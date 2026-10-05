/** もらえるGemの数。保護者画面で変えられる */
export type GemSettings = {
  /** 1回目で正解したとき */
  correctFirstTry: number;
  /** ヒントのあとの再挑戦で正解したとき */
  correctRetry: number;
  /** クエストを1回クリアしたときのボーナス */
  questClear: number;
};

export const DEFAULT_GEM_SETTINGS: GemSettings = { correctFirstTry: 1, correctRetry: 0, questClear: 10 };

/** 設定できるGemの数の上限 */
export const MAX_GEM_SETTING = 100;

const GEM_SETTING_KEYS = ["correctFirstTry", "correctRetry", "questClear"] as const;

/** 0〜MAX_GEM_SETTING の整数だけ受け付ける。1つでもおかしければ null */
export function parseGemSettings(input: Record<string, unknown>): GemSettings | null {
  const out = { ...DEFAULT_GEM_SETTINGS };
  for (const key of GEM_SETTING_KEYS) {
    const raw = input[key];
    if (raw === "" || raw == null) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > MAX_GEM_SETTING) return null;
    out[key] = n;
  }
  return out;
}

export function gemsForCorrect(firstTry: boolean, settings: GemSettings): number {
  return firstTry ? settings.correctFirstTry : settings.correctRetry;
}

/** 二重付与を防ぐための、付与ごとの一意なキー */
export const gemRef = {
  answer: (answerId: number) => `answer:${answerId}`,
  questClear: (questId: number) => `quest:${questId}`,
  redeem: (requestId: number) => `redeem:${requestId}`,
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

/** Robux 1 に ひつような Gem */
export const GEMS_PER_ROBUX = 2;
/** Robux こうかんは この Gem の数ずつ（いちばん少なくても この数） */
export const ROBUX_GEM_STEP = 100;

export const robuxFor = (gems: number) => gems / GEMS_PER_ROBUX;

/** Robux と こうかんする Gem の数を確かめる（ROBUX_GEM_STEP ずつ・使えるGem以下） */
export function validateRobuxAmount(input: unknown, available: number): number | null {
  const n = validateRedeemAmount(input, available);
  return n !== null && n % ROBUX_GEM_STEP === 0 ? n : null;
}
