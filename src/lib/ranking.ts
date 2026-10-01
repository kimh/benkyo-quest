import "server-only";
import { eq, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { rankBy, topWithSelf, type RankRow } from "@/lib/game/ranking";

export type RankingBoard = { top: RankRow[]; self: RankRow | null };
export type Ranking = { correct: RankingBoard; answered: RankingBoard };

/** 累計の 正解数・回答数 のランキング（答え終わった問題だけ） */
export async function getRanking(selfId: number): Promise<Ranking> {
  const scores = await db
    .select({
      playerId: schema.players.id,
      name: schema.players.name,
      answered: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${schema.answers.correct})::int`,
    })
    .from(schema.answers)
    .innerJoin(schema.quests, eq(schema.answers.questId, schema.quests.id))
    .innerJoin(schema.players, eq(schema.quests.playerId, schema.players.id))
    .where(isNotNull(schema.answers.correct))
    .groupBy(schema.players.id, schema.players.name);
  return {
    correct: topWithSelf(rankBy(scores, "correct"), selfId),
    answered: topWithSelf(rankBy(scores, "answered"), selfId),
  };
}
