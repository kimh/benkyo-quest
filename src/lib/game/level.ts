export const MIN_SUBJECT_LEVEL = 1;
export const MAX_SUBJECT_LEVEL = 10;
/** 判定に使う直近の解答数 */
export const LEVEL_WINDOW = 20;
/** これより少ないうちはレベルを動かさない */
export const LEVEL_MIN_ANSWERS = 10;

/**
 * 直近の正誤（新しい順）から科目レベルを調整する。
 * 85%以上で+1、50%未満で-1。
 */
export function adjustLevel(level: number, recentNewestFirst: boolean[]): number {
  const recent = recentNewestFirst.slice(0, LEVEL_WINDOW);
  if (recent.length < LEVEL_MIN_ANSWERS) return level;
  const rate = recent.filter(Boolean).length / recent.length;
  const next = rate >= 0.85 ? level + 1 : rate < 0.5 ? level - 1 : level;
  return Math.min(MAX_SUBJECT_LEVEL, Math.max(MIN_SUBJECT_LEVEL, next));
}
