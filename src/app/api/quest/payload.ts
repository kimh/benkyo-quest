import { toPublic } from "@/lib/game/question";
import { MAX_QUESTS_PER_DAY } from "@/lib/game/quest";
import type { TodayQuest } from "@/lib/quests";

/** クライアントに返すクエスト。正解・ヒント・式は含めない */
export function questPayload({ quest, questions, answers }: TodayQuest) {
  return {
    date: quest.date,
    round: quest.round,
    maxRounds: MAX_QUESTS_PER_DAY,
    status: quest.status,
    questions: questions.map(toPublic),
    progress: answers.map((a) => ({ attempts: a.attempts, correct: a.correct })),
  };
}
