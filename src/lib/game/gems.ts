/** 1回目で正解したときのGem */
export const GEM_CORRECT_FIRST_TRY = 1;
/** ヒントのあとの再挑戦で正解したときのGem */
export const GEM_CORRECT_RETRY = 0;
/** クエストを1回クリアしたときのボーナスGem */
export const GEM_QUEST_CLEAR = 10;

export function gemsForCorrect(firstTry: boolean): number {
  return firstTry ? GEM_CORRECT_FIRST_TRY : GEM_CORRECT_RETRY;
}

/** 二重付与を防ぐための、付与ごとの一意なキー */
export const gemRef = {
  answer: (answerId: number) => `answer:${answerId}`,
  questClear: (questId: number) => `quest:${questId}`,
};
