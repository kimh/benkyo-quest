import { currentPlayer } from "@/lib/players";
import { getOrCreateTodayQuest } from "@/lib/quests";
import { questPayload } from "../payload";

// 初回はAIで問題を作るので時間がかかる
export const maxDuration = 60;

/** 今日のいまの回のクエスト。今日まだ無ければ1回目を作る */
export async function GET() {
  const player = await currentPlayer();
  if (!player) return Response.json({ error: "no_player" }, { status: 401 });

  return Response.json(await questPayload(await getOrCreateTodayQuest(player), player.grade));
}
