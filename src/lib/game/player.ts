import { daysBetween } from "@/lib/date";

export const GRADES = [1, 2, 3, 4, 5, 6] as const;
export const NAME_MAX_LENGTH = 8;
export const MAX_PLAYERS = 6;
/** 科目レベル(1〜10)の初期値。正答率で上下する */
export const INITIAL_SUBJECT_LEVEL = 3;

export type NameResult = { ok: true; name: string } | { ok: false; error: string };

export function validateName(input: unknown): NameResult {
  if (typeof input !== "string") return { ok: false, error: "なまえを いれてね" };
  if (/[\u0000-\u001f\u007f<>]/.test(input)) return { ok: false, error: "つかえない もじが あるよ" };
  const name = input.normalize("NFC").trim().replace(/\s+/g, " ");
  if (name.length === 0) return { ok: false, error: "なまえを いれてね" };
  if ([...name].length > NAME_MAX_LENGTH)
    return { ok: false, error: `なまえは ${NAME_MAX_LENGTH}もじ までだよ` };
  return { ok: true, name };
}

export function parseGrade(input: unknown): number | null {
  const n = Number(input);
  return (GRADES as readonly number[]).includes(n) ? n : null;
}

/** 次のレベルまでに必要なEXP */
export function expToNextLevel(level: number): number {
  return 20 + 10 * (level - 1);
}

/** 表示用の連続日数。最後にクリアしたのが昨日より前なら途切れている */
export function currentStreak(streakDays: number, lastClearedDate: string | null, today: string): number {
  if (!lastClearedDate) return 0;
  return daysBetween(lastClearedDate, today) <= 1 ? streakDays : 0;
}
