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

/** Gemこうかんの メモの最大文字数 */
export const REDEEM_NOTE_MAX = 30;
/** 1人が同時に出せる「おねがいちゅう」の数 */
export const MAX_PENDING_REDEEMS = 3;

/** こうかんする Gem の数を確かめる（1以上・使えるGem以下の整数） */
export function validateRedeemAmount(input: unknown, available: number): number | null {
  const n = Number(input);
  return Number.isInteger(n) && n >= 1 && n <= available ? n : null;
}

/** こうかんの メモ（なにと こうかんしたいか）。空でもよい */
export function normalizeRedeemNote(input: unknown): string | null {
  if (input == null) return "";
  if (typeof input !== "string") return null;
  if (/[\u0000-\u001f\u007f<>]/.test(input)) return null;
  const note = input.normalize("NFC").trim().replace(/\s+/g, " ");
  return [...note].length <= REDEEM_NOTE_MAX ? note : null;
}
