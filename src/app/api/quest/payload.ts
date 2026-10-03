import { toPublic } from "@/lib/game/question";
import { maxRoundsToday } from "@/lib/game/quest";
import { gemBalance, type Player } from "@/lib/players";
import { questGems, type TodayQuest } from "@/lib/quests";

/** クライアントに返すクエスト。正解・ヒント・式は含めない */
export async function questPayload({ quest, questions, answers }: TodayQuest, player: Player) {
  const [balance, earned] = await Promise.all([
    gemBalance(quest.playerId),
    questGems(quest.id, answers.map((a) => a.id)),
  ]);
  return {
    date: quest.date,
    grade: player.grade,
    round: quest.round,
    maxRounds: maxRoundsToday(player, quest.date),
    status: quest.status,
    questions: questions.map(toPublic),
    progress: answers.map((a) => ({ attempts: a.attempts, correct: a.correct })),
    gems: { balance, earned },
  };
}
