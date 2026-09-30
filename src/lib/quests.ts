import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { generateQuestions, type Slot } from "@/lib/ai/generate";
import { unitsFor, type Subject } from "@/lib/curriculum/units";
import { jstDate } from "@/lib/date";
import { db, schema } from "@/lib/db";
import { gemRef, gemsForCorrect, GEM_QUEST_CLEAR } from "@/lib/game/gems";
import { adjustLevel, LEVEL_WINDOW } from "@/lib/game/level";
import { applyExp, expForAnswer, EXP_QUEST_CLEAR, nextStreak } from "@/lib/game/rewards";
import { MAX_QUESTS_PER_DAY, pickUnits, questSubjects, type UnitStats } from "@/lib/game/quest";
import { isCorrect, type Question } from "@/lib/game/question";
import { gemBalance, type Player } from "@/lib/players";

export type Quest = typeof schema.quests.$inferSelect;
export type AnswerRow = typeof schema.answers.$inferSelect;

export type TodayQuest = { quest: Quest; questions: Question[]; answers: AnswerRow[] };

/** 1問あたりの挑戦回数（1回目＋ヒント後の再挑戦） */
export const MAX_ATTEMPTS = 2;

export type AnswerResult = (
  | { result: "correct"; firstTry: boolean; explanation: string }
  | { result: "retry"; hint: string }
  | { result: "wrong"; answer: string; explanation: string }
) & {
  questCleared: boolean;
  /** この解答でもらったGem（正解ぶん） */
  gems: number;
  /** この解答でクエストをクリアしてもらったボーナスGem */
  clearBonus: number;
  /** いま持っているGem */
  balance: number;
  /** この解答でクエストをクリアしたときのごほうび（クリアしていなければ null） */
  reward: ClearReward | null;
};

/** クエストクリアのごほうび（Gem以外） */
export type ClearReward = {
  exp: number;
  level: number;
  levelUp: boolean;
  streakDays: number;
  /** むずかしさが上がった科目 */
  subjectUps: Subject[];
};

/** 今日いちばん新しい回のクエスト */
async function findTodayQuest(playerId: number): Promise<TodayQuest | null> {
  const [quest] = await db
    .select()
    .from(schema.quests)
    .where(and(eq(schema.quests.playerId, playerId), eq(schema.quests.date, jstDate())))
    .orderBy(desc(schema.quests.round))
    .limit(1);
  if (!quest) return null;
  const answers = await db
    .select()
    .from(schema.answers)
    .where(eq(schema.answers.questId, quest.id))
    .orderBy(asc(schema.answers.questionIndex));
  return { quest, questions: quest.questions as Question[], answers };
}

/** 単元ごとの成績（答え終わった問題だけ） */
async function unitStats(playerId: number): Promise<UnitStats> {
  const rows = await db
    .select({
      unit: schema.answers.unit,
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${schema.answers.correct})::int`,
    })
    .from(schema.answers)
    .innerJoin(schema.quests, eq(schema.answers.questId, schema.quests.id))
    .where(and(eq(schema.quests.playerId, playerId), isNotNull(schema.answers.correct)))
    .groupBy(schema.answers.unit);
  return new Map(rows.map((r) => [r.unit, { total: r.total, correct: r.correct }]));
}

/** 直近3回ぶんの問題文（同じ日の前の回も含む。同じ問題を出さないため） */
async function recentPrompts(playerId: number): Promise<string[]> {
  const rows = await db
    .select({ questions: schema.quests.questions })
    .from(schema.quests)
    .where(eq(schema.quests.playerId, playerId))
    .orderBy(desc(schema.quests.createdAt))
    .limit(3);
  return rows.flatMap((r) => (r.questions as Question[]).map((q) => q.prompt));
}

export function subjectLevels(player: Player): Record<Subject, number> {
  return { math: player.mathLevel, english: player.englishLevel, japanese: player.japaneseLevel };
}

function buildSlots(player: Player, stats: UnitStats): Slot[] {
  const levels = subjectLevels(player);
  const subjects = questSubjects(player.grade);
  const picked = new Map(
    [...new Set(subjects)].map((subject) => [
      subject,
      pickUnits(unitsFor(player.grade, subject), stats, subjects.filter((s) => s === subject).length),
    ]),
  );
  return subjects.map((subject) => ({ subject, unit: picked.get(subject)!.shift()!, difficulty: levels[subject] }));
}

/**
 * 今日のクエスト（いちばん新しい回）を返す。今日まだ1回も無ければ1回目を作る。
 * クリア済みでも次の回は作らない（次の回は startNextQuest で始める）。
 */
export async function getOrCreateTodayQuest(player: Player): Promise<TodayQuest> {
  return (await findTodayQuest(player.id)) ?? createQuest(player, 1);
}

/**
 * 次の回のクエストを始める。遊んでいる途中の回があればそれを返す。
 * 1日 MAX_QUESTS_PER_DAY 回まで。
 */
export async function startNextQuest(player: Player): Promise<TodayQuest> {
  const latest = await findTodayQuest(player.id);
  if (!latest) return createQuest(player, 1);
  if (latest.quest.status !== "cleared") return latest;
  if (latest.quest.round >= MAX_QUESTS_PER_DAY) throw new QuestError("daily_limit");
  return createQuest(player, latest.quest.round + 1);
}

/**
 * AIで問題を作って、その回のクエストを保存する。
 * 同じ回が同時に2回作られても、保存されるのは先に終わった1つだけ。
 */
async function createQuest(player: Player, round: number): Promise<TodayQuest> {
  const today = jstDate();
  const [stats, recent] = await Promise.all([unitStats(player.id), recentPrompts(player.id)]);
  const slots = buildSlots(player, stats);
  const { questions, aiCount, rejected, failures } = await generateQuestions({
    grade: player.grade,
    levels: subjectLevels(player),
    slots,
    recentPrompts: recent,
  });
  if (aiCount < questions.length) {
    console.warn("quest: フォールバック問題を使用", { playerId: player.id, aiCount, rejected, failures });
  }

  // クエストと解答欄は同時に見えるよう1つのトランザクションで入れる
  await db.transaction(async (tx) => {
    const [quest] = await tx
      .insert(schema.quests)
      .values({ playerId: player.id, date: today, round, questions })
      .onConflictDoNothing({ target: [schema.quests.playerId, schema.quests.date, schema.quests.round] })
      .returning();
    if (!quest) return;
    await tx.insert(schema.answers).values(
      questions.map((q, i) => ({
        questId: quest.id,
        questionIndex: i,
        subject: q.subject,
        unit: q.unit,
        difficulty: q.difficulty,
      })),
    );
  });
  const created = await findTodayQuest(player.id);
  if (!created) throw new Error("クエストを保存できませんでした");
  return created;
}

function isFinished(a: AnswerRow): boolean {
  return a.correct === true || a.attempts >= MAX_ATTEMPTS;
}

type Earned = Pick<AnswerResult, "questCleared" | "gems" | "clearBonus" | "balance" | "reward">;

/** 答え終わった問題の結果を返す。再送・リロードのときは Gem は 0 */
function storedResult(q: Question, a: AnswerRow, earned: Earned): AnswerResult {
  return a.correct
    ? { result: "correct", firstTry: a.attempts === 1, explanation: q.explanation, ...earned }
    : { result: "wrong", answer: q.answer, explanation: q.explanation, ...earned };
}

export class QuestError extends Error {
  constructor(public code: "no_quest" | "bad_index" | "daily_limit") {
    super(code);
  }
}

/** 今日のいまの回のクエストの1問に答える。採点とGemの付与はサーバーだけで行う */
export async function submitAnswer(player: Player, index: number, value: string): Promise<AnswerResult> {
  for (let retry = 0; retry < 3; retry++) {
    const today = await findTodayQuest(player.id);
    if (!today) throw new QuestError("no_quest");
    const q = today.questions[index];
    const a = today.answers.find((r) => r.questionIndex === index);
    if (!q || !a) throw new QuestError("bad_index");
    if (isFinished(a)) {
      return storedResult(q, a, {
        questCleared: today.quest.status === "cleared",
        gems: 0,
        clearBonus: 0,
        balance: await gemBalance(player.id),
        reward: null,
      });
    }

    const ok = isCorrect(q, value);
    const attempts = a.attempts + 1;
    const correct = ok ? true : attempts >= MAX_ATTEMPTS ? false : null;
    const gems = ok ? gemsForCorrect(attempts === 1) : 0;

    // 解答の保存とGemの付与は一緒に行う（片方だけ残らないように）
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(schema.answers)
        .set({ attempts, correct, answeredAt: correct === null ? null : new Date() })
        // 同時に送られたときは先に着いた方だけ採用する
        .where(and(eq(schema.answers.id, a.id), eq(schema.answers.attempts, a.attempts)))
        .returning();
      if (row && gems > 0) {
        await tx
          .insert(schema.gemTransactions)
          .values({ playerId: player.id, delta: gems, reason: "correct", refId: gemRef.answer(a.id) })
          .onConflictDoNothing({ target: schema.gemTransactions.refId });
      }
      return row;
    });
    if (!updated) continue;

    if (correct === null) {
      return {
        result: "retry",
        hint: q.hint,
        questCleared: false,
        gems: 0,
        clearBonus: 0,
        balance: await gemBalance(player.id),
        reward: null,
      };
    }

    const { cleared, clearBonus, reward } = await clearIfDone(player.id, today.quest.id);
    return storedResult(q, updated, { questCleared: cleared, gems, clearBonus, balance: await gemBalance(player.id), reward });
  }
  throw new Error("解答を保存できませんでした");
}

const LEVEL_COLUMN = { math: "mathLevel", english: "englishLevel", japanese: "japaneseLevel" } as const;

/**
 * 全問答え終わっていればクエストをクリアにし、ごほうび（Gem・EXP/Lv・連続日数・科目レベル）を付ける。
 * ごほうびは in_progress → cleared に変わった1回だけ（二重に付けない）。
 */
async function clearIfDone(
  playerId: number,
  questId: number,
): Promise<{ cleared: boolean; clearBonus: number; reward: ClearReward | null }> {
  const answers = await db.select().from(schema.answers).where(eq(schema.answers.questId, questId));
  if (!answers.every(isFinished)) return { cleared: false, clearBonus: 0, reward: null };

  return db.transaction(async (tx) => {
    const [cleared] = await tx
      .update(schema.quests)
      .set({ status: "cleared" })
      .where(and(eq(schema.quests.id, questId), eq(schema.quests.status, "in_progress")))
      .returning({ id: schema.quests.id });
    if (!cleared) return { cleared: true, clearBonus: 0, reward: null };

    const [bonus] = await tx
      .insert(schema.gemTransactions)
      .values({ playerId, delta: GEM_QUEST_CLEAR, reason: "clear_bonus", refId: gemRef.questClear(questId) })
      .onConflictDoNothing({ target: schema.gemTransactions.refId })
      .returning({ id: schema.gemTransactions.id });

    const [player] = await tx.select().from(schema.players).where(eq(schema.players.id, playerId)).for("update");

    // EXP とレベルアップ
    const exp = answers.reduce((sum, a) => sum + expForAnswer(a.attempts, a.correct), EXP_QUEST_CLEAR);
    const grown = applyExp(player.playerLevel, player.exp, exp);

    // 連続日数
    const today = jstDate();
    const streakDays = nextStreak(player.streakDays, player.lastClearedDate, today);

    // 科目ごとに、直近の正答率でむずかしさを調整する
    const levelUpdates: Partial<Record<(typeof LEVEL_COLUMN)[Subject], number>> = {};
    const subjectUps: Subject[] = [];
    for (const subject of [...new Set(answers.map((a) => a.subject))]) {
      const recent = await tx
        .select({ correct: schema.answers.correct })
        .from(schema.answers)
        .innerJoin(schema.quests, eq(schema.answers.questId, schema.quests.id))
        .where(
          and(
            eq(schema.quests.playerId, playerId),
            eq(schema.answers.subject, subject),
            isNotNull(schema.answers.correct),
          ),
        )
        .orderBy(desc(schema.answers.answeredAt))
        .limit(LEVEL_WINDOW);
      const column = LEVEL_COLUMN[subject];
      const now = player[column];
      const next = adjustLevel(now, recent.map((r) => r.correct === true));
      if (next !== now) levelUpdates[column] = next;
      if (next > now) subjectUps.push(subject);
    }

    await tx
      .update(schema.players)
      .set({
        playerLevel: grown.level,
        exp: grown.exp,
        streakDays,
        lastClearedDate: today,
        ...levelUpdates,
      })
      .where(eq(schema.players.id, playerId));

    return {
      cleared: true,
      clearBonus: bonus ? GEM_QUEST_CLEAR : 0,
      reward: { exp, level: grown.level, levelUp: grown.level > player.playerLevel, streakDays, subjectUps },
    };
  });
}

/** そのクエストでもらったGemの合計（正解ぶん＋クリアボーナス） */
export async function questGems(questId: number, answerIds: number[]): Promise<number> {
  const refs = [gemRef.questClear(questId), ...answerIds.map(gemRef.answer)];
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.gemTransactions.delta}), 0)::int` })
    .from(schema.gemTransactions)
    .where(inArray(schema.gemTransactions.refId, refs));
  return r?.total ?? 0;
}
