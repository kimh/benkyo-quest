import "server-only";
import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { generateQuestions, type Slot } from "@/lib/ai/generate";
import { unitsFor, type Subject } from "@/lib/curriculum/units";
import { jstDate } from "@/lib/date";
import { db, schema } from "@/lib/db";
import { MAX_QUESTS_PER_DAY, pickUnits, QUEST_SUBJECTS, type UnitStats } from "@/lib/game/quest";
import { isCorrect, type Question } from "@/lib/game/question";
import type { Player } from "@/lib/players";

export type Quest = typeof schema.quests.$inferSelect;
export type AnswerRow = typeof schema.answers.$inferSelect;

export type TodayQuest = { quest: Quest; questions: Question[]; answers: AnswerRow[] };

/** 1問あたりの挑戦回数（1回目＋ヒント後の再挑戦） */
export const MAX_ATTEMPTS = 2;

export type AnswerResult = (
  | { result: "correct"; firstTry: boolean; explanation: string }
  | { result: "retry"; hint: string }
  | { result: "wrong"; answer: string; explanation: string }
) & { questCleared: boolean };

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

function buildSlots(player: Player, stats: UnitStats): Slot[] {
  const levels: Record<Subject, number> = { math: player.mathLevel, english: player.englishLevel };
  const picked: Record<Subject, ReturnType<typeof pickUnits>> = {
    math: pickUnits(unitsFor(player.grade, "math"), stats, QUEST_SUBJECTS.filter((s) => s === "math").length),
    english: pickUnits(unitsFor(player.grade, "english"), stats, QUEST_SUBJECTS.filter((s) => s === "english").length),
  };
  return QUEST_SUBJECTS.map((subject) => ({ subject, unit: picked[subject].shift()!, difficulty: levels[subject] }));
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
    levels: { math: player.mathLevel, english: player.englishLevel },
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

/** 答え終わった問題の結果をもう一度返す（二重送信・リロード用） */
function storedResult(q: Question, a: AnswerRow, questCleared: boolean): AnswerResult {
  return a.correct
    ? { result: "correct", firstTry: a.attempts === 1, explanation: q.explanation, questCleared }
    : { result: "wrong", answer: q.answer, explanation: q.explanation, questCleared };
}

export class QuestError extends Error {
  constructor(public code: "no_quest" | "bad_index" | "daily_limit") {
    super(code);
  }
}

/** 今日のいまの回のクエストの1問に答える。採点はサーバーだけで行う */
export async function submitAnswer(player: Player, index: number, value: string): Promise<AnswerResult> {
  for (let retry = 0; retry < 3; retry++) {
    const today = await findTodayQuest(player.id);
    if (!today) throw new QuestError("no_quest");
    const q = today.questions[index];
    const a = today.answers.find((r) => r.questionIndex === index);
    if (!q || !a) throw new QuestError("bad_index");
    if (isFinished(a)) return storedResult(q, a, today.quest.status === "cleared");

    const ok = isCorrect(q, value);
    const attempts = a.attempts + 1;
    const correct = ok ? true : attempts >= MAX_ATTEMPTS ? false : null;
    const [updated] = await db
      .update(schema.answers)
      .set({ attempts, correct, answeredAt: correct === null ? null : new Date() })
      // 同時に送られたときは先に着いた方だけ採用する
      .where(and(eq(schema.answers.id, a.id), eq(schema.answers.attempts, a.attempts)))
      .returning();
    if (!updated) continue;

    if (correct === null) return { result: "retry", hint: q.hint, questCleared: false };

    const questCleared = await clearIfDone(today.quest.id);
    return storedResult(q, updated, questCleared);
  }
  throw new Error("解答を保存できませんでした");
}

/** 全問答え終わっていればクエストをクリアにする。クリア済みなら true */
async function clearIfDone(questId: number): Promise<boolean> {
  const answers = await db.select().from(schema.answers).where(eq(schema.answers.questId, questId));
  if (!answers.every(isFinished)) return false;
  const [cleared] = await db
    .update(schema.quests)
    .set({ status: "cleared" })
    .where(and(eq(schema.quests.id, questId), eq(schema.quests.status, "in_progress")))
    .returning({ id: schema.quests.id });
  if (cleared) {
    // TODO(ステップ5): ここでクリア報酬を付与する（Gem ledger・EXP/Lv・連続日数・科目レベル調整 adjustLevel）。
    // 付与は この「in_progress → cleared に変わった1回」だけで行うこと（二重付与防止）。
  }
  return true;
}
