import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { PLAYER_COOKIE, verifyPlayerToken } from "@/lib/session";

export type Player = typeof schema.players.$inferSelect;

export async function listPlayers(): Promise<Pick<Player, "id" | "name" | "grade">[]> {
  return db
    .select({ id: schema.players.id, name: schema.players.name, grade: schema.players.grade })
    .from(schema.players)
    .orderBy(asc(schema.players.id));
}

export async function getPlayer(id: number): Promise<Player | null> {
  const [p] = await db.select().from(schema.players).where(eq(schema.players.id, id));
  return p ?? null;
}

/** この端末にひもづいた冒険の書。無い・削除済みなら null */
export async function currentPlayer(): Promise<Player | null> {
  const id = verifyPlayerToken((await cookies()).get(PLAYER_COOKIE)?.value);
  return id ? getPlayer(id) : null;
}

export async function gemBalance(playerId: number): Promise<number> {
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.gemTransactions.delta}), 0)::int` })
    .from(schema.gemTransactions)
    .where(eq(schema.gemTransactions.playerId, playerId));
  return r?.total ?? 0;
}
