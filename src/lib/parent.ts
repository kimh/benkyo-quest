import "server-only";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { EikenGrade } from "@/lib/curriculum/eiken";
import type { Subject } from "@/lib/curriculum/units";
import { db, schema } from "@/lib/db";
import { jstDate } from "@/lib/date";
import { gemRef } from "@/lib/game/gems";
import { bonusRoundsForReset } from "@/lib/game/quest";
import { INITIAL_SUBJECT_LEVEL } from "@/lib/game/player";
import { isValidParentToken, PARENT_COOKIE } from "@/lib/session";

/** 保護者としてログインしていなければ /parent/login へ */
export async function requireParent(): Promise<void> {
  if (!isValidParentToken((await cookies()).get(PARENT_COOKIE)?.value)) redirect("/parent/login");
}

/** 子どもの一覧（Gem残高つき） */
export async function listChildren() {
  const balances = db
    .select({
      playerId: schema.gemTransactions.playerId,
      gems: sql<number>`sum(${schema.gemTransactions.delta})::int`.as("gems"),
    })
    .from(schema.gemTransactions)
    .groupBy(schema.gemTransactions.playerId)
    .as("balances");
  return db
    .select({
      id: schema.players.id,
      name: schema.players.name,
      grade: schema.players.grade,
      eikenGrade: schema.players.eikenGrade,
      playerLevel: schema.players.playerLevel,
      streakDays: schema.players.streakDays,
      lastClearedDate: schema.players.lastClearedDate,
      gems: sql<number>`coalesce(${balances.gems}, 0)::int`,
    })
    .from(schema.players)
    .leftJoin(balances, eq(balances.playerId, schema.players.id))
    .orderBy(asc(schema.players.id));
}

/** おねがいちゅうのGemこうかん（古い順・子どもの名前つき） */
export async function listPendingRedemptions() {
  return db
    .select({
      id: schema.redemptionRequests.id,
      playerId: schema.redemptionRequests.playerId,
      playerName: schema.players.name,
      amount: schema.redemptionRequests.amount,
      note: schema.redemptionRequests.note,
      createdAt: schema.redemptionRequests.createdAt,
    })
    .from(schema.redemptionRequests)
    .innerJoin(schema.players, eq(schema.redemptionRequests.playerId, schema.players.id))
    .where(eq(schema.redemptionRequests.status, "pending"))
    .orderBy(asc(schema.redemptionRequests.createdAt));
}

export type ApproveError = "not_pending" | "short";

/**
 * こうかんを承認して、Gem を引く。
 * 申請の行をロックしてから pending を確かめるので、2回押しても1回しか引かれない。
 */
export async function approveRedemption(requestId: number): Promise<ApproveError | null> {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(schema.redemptionRequests)
      .where(eq(schema.redemptionRequests.id, requestId))
      .for("update");
    if (!req || req.status !== "pending") return "not_pending";

    const [{ balance }] = await tx
      .select({ balance: sql<number>`coalesce(sum(${schema.gemTransactions.delta}), 0)::int` })
      .from(schema.gemTransactions)
      .where(eq(schema.gemTransactions.playerId, req.playerId));
    if (balance < req.amount) return "short";

    await tx
      .insert(schema.gemTransactions)
      .values({ playerId: req.playerId, delta: -req.amount, reason: "redeem", refId: gemRef.redeem(req.id) })
      .onConflictDoNothing({ target: schema.gemTransactions.refId });
    await tx
      .update(schema.redemptionRequests)
      .set({ status: "approved", resolvedAt: new Date() })
      .where(eq(schema.redemptionRequests.id, req.id));
    return null;
  });
}

/** こうかんを却下する（Gem は引かない） */
export async function rejectRedemption(requestId: number): Promise<boolean> {
  const rows = await db
    .update(schema.redemptionRequests)
    .set({ status: "rejected", resolvedAt: new Date() })
    .where(and(eq(schema.redemptionRequests.id, requestId), eq(schema.redemptionRequests.status, "pending")))
    .returning({ id: schema.redemptionRequests.id });
  return rows.length > 0;
}

export type UnitStat = { subject: Subject; unit: string; total: number; correct: number; firstTry: number };

/** 科目×単元ごとの成績（答え終わった問題だけ） */
export async function playerStats(playerId: number): Promise<UnitStat[]> {
  return db
    .select({
      subject: schema.answers.subject,
      unit: schema.answers.unit,
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${schema.answers.correct})::int`,
      firstTry: sql<number>`count(*) filter (where ${schema.answers.correct} and ${schema.answers.attempts} = 1)::int`,
    })
    .from(schema.answers)
    .innerJoin(schema.quests, eq(schema.answers.questId, schema.quests.id))
    .where(and(eq(schema.quests.playerId, playerId), isNotNull(schema.answers.correct)))
    .groupBy(schema.answers.subject, schema.answers.unit)
    .orderBy(asc(schema.answers.subject), asc(schema.answers.unit));
}

const LEVEL_COLUMN = { math: "mathLevel", english: "englishLevel", japanese: "japaneseLevel" } as const;

export async function setSubjectLevel(playerId: number, subject: Subject, level: number): Promise<void> {
  await db
    .update(schema.players)
    .set({ [LEVEL_COLUMN[subject]]: level })
    .where(eq(schema.players.id, playerId));
}

/**
 * 英語のコース（学年どおり / 英検の級）を変える。
 * 変えたときは英語のレベルを最初の値にもどす（前のコースのレベルは目安にならないため）。
 */
export async function setEikenGrade(playerId: number, eikenGrade: EikenGrade | null): Promise<void> {
  await db
    .update(schema.players)
    .set({ eikenGrade, englishLevel: INITIAL_SUBJECT_LEVEL })
    .where(and(eq(schema.players.id, playerId), sql`${schema.players.eikenGrade} is distinct from ${eikenGrade}`));
}

/** 今日遊んだ回数（いちばん新しい回の番号） */
export async function todayRounds(playerId: number): Promise<number> {
  const [row] = await db
    .select({ round: sql<number>`coalesce(max(${schema.quests.round}), 0)::int` })
    .from(schema.quests)
    .where(and(eq(schema.quests.playerId, playerId), eq(schema.quests.date, jstDate())));
  return row?.round ?? 0;
}

/** 今日のクエストの回数をリセットして、また MAX_QUESTS_PER_DAY 回遊べるようにする（記録は消さない） */
export async function resetTodayRounds(playerId: number): Promise<void> {
  const played = await todayRounds(playerId);
  await db
    .update(schema.players)
    .set({ bonusRoundsDate: jstDate(), bonusRounds: bonusRoundsForReset(played) })
    .where(eq(schema.players.id, playerId));
}
