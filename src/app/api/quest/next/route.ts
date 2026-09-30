import { currentPlayer } from "@/lib/players";
import { QuestError, startNextQuest } from "@/lib/quests";
import { questPayload } from "../payload";

// AIで問題を作るので時間がかかる
export const maxDuration = 60;

/** クリアしたあとに、次の回のクエストを始める（1日 MAX_QUESTS_PER_DAY 回まで） */
export async function POST() {
  const player = await currentPlayer();
  if (!player) return Response.json({ error: "no_player" }, { status: 401 });

  try {
    return Response.json(await questPayload(await startNextQuest(player), player.grade));
  } catch (e) {
    if (e instanceof QuestError && e.code === "daily_limit") {
      return Response.json({ error: e.code }, { status: 409 });
    }
    throw e;
  }
}
