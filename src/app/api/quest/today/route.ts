import { toPublic } from "@/lib/game/question";
import { currentPlayer } from "@/lib/players";
import { getOrCreateTodayQuest } from "@/lib/quests";

// 初回はAIで問題を作るので時間がかかる
export const maxDuration = 60;

/** 今日のクエスト。正解・ヒント・式はクライアントに渡さない */
export async function GET() {
  const player = await currentPlayer();
  if (!player) return Response.json({ error: "no_player" }, { status: 401 });

  const { quest, questions, answers } = await getOrCreateTodayQuest(player);
  return Response.json({
    date: quest.date,
    status: quest.status,
    questions: questions.map(toPublic),
    progress: answers.map((a) => ({ attempts: a.attempts, correct: a.correct })),
  });
}
