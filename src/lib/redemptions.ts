import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { MAX_PENDING_REDEEMS, normalizeRedeemNote, validateRedeemAmount, validateRobuxAmount } from "@/lib/game/gems";

export type Redemption = typeof schema.redemptionRequests.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** 持っているGemと、おねがいちゅう（まだ引かれていない）のGem */
async function gemStatus(tx: Tx | typeof db, playerId: number) {
  const [{ balance }] = await tx
    .select({ balance: sql<number>`coalesce(sum(${schema.gemTransactions.delta}), 0)::int` })
    .from(schema.gemTransactions)
    .where(eq(schema.gemTransactions.playerId, playerId));
  const [{ pending, count }] = await tx
    .select({
      pending: sql<number>`coalesce(sum(${schema.redemptionRequests.amount}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.redemptionRequests)
    .where(and(eq(schema.redemptionRequests.playerId, playerId), eq(schema.redemptionRequests.status, "pending")));
  return { balance, pending, pendingCount: count, available: Math.max(0, balance - pending) };
}

export async function redeemSummary(playerId: number) {
  const [status, requests] = await Promise.all([
    gemStatus(db, playerId),
    db
      .select()
      .from(schema.redemptionRequests)
      .where(eq(schema.redemptionRequests.playerId, playerId))
      .orderBy(desc(schema.redemptionRequests.createdAt))
      .limit(20),
  ]);
  return { ...status, requests };
}

export type RedeemKind = Redemption["kind"];
export type RedeemError = "bad_amount" | "bad_note" | "too_many" | "robux_off";

/**
 * Gemこうかんを おねがいする。Gem はまだ引かず、保護者が承認したときに引く。
 * 同時に押されても使えるGemをこえないよう、プレイヤーの行をロックして確かめる。
 * Robux は保護者がオンにした子だけ、ROBUX_GEM_STEP ずつ（メモはなし）。
 */
export async function requestRedeem(
  playerId: number,
  kind: RedeemKind,
  amountInput: unknown,
  noteInput: unknown,
): Promise<RedeemError | null> {
  const note = kind === "robux" ? "" : normalizeRedeemNote(noteInput);
  if (note === null) return "bad_note";
  return db.transaction(async (tx) => {
    const [player] = await tx
      .select({ robuxEnabled: schema.players.robuxEnabled })
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .for("update");
    if (kind === "robux" && !player?.robuxEnabled) return "robux_off";
    const { available, pendingCount } = await gemStatus(tx, playerId);
    if (pendingCount >= MAX_PENDING_REDEEMS) return "too_many";
    const amount = (kind === "robux" ? validateRobuxAmount : validateRedeemAmount)(amountInput, available);
    if (amount === null) return "bad_amount";
    await tx.insert(schema.redemptionRequests).values({ playerId, kind, amount, note });
    return null;
  });
}

/** おねがいちゅうの こうかんを とりけす（自分の・おねがいちゅうのものだけ） */
export async function cancelRedeem(playerId: number, requestId: number): Promise<boolean> {
  const rows = await db
    .delete(schema.redemptionRequests)
    .where(
      and(
        eq(schema.redemptionRequests.id, requestId),
        eq(schema.redemptionRequests.playerId, playerId),
        eq(schema.redemptionRequests.status, "pending"),
      ),
    )
    .returning({ id: schema.redemptionRequests.id });
  return rows.length > 0;
}
