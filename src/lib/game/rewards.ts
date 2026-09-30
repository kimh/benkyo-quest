import { daysBetween } from "@/lib/date";
import { expToNextLevel } from "./player";

/** 1回目で正解したときのEXP */
export const EXP_CORRECT_FIRST_TRY = 10;
/** ヒントのあとに正解したときのEXP */
export const EXP_CORRECT_RETRY = 5;
/** まちがえても、さいごまで がんばったぶんのEXP */
export const EXP_TRIED = 2;
/** クエストをクリアしたときのボーナスEXP */
export const EXP_QUEST_CLEAR = 20;

/** 1問ぶんのEXP（答え終わった問題の attempts と correct から） */
export function expForAnswer(attempts: number, correct: boolean | null): number {
  if (correct) return attempts <= 1 ? EXP_CORRECT_FIRST_TRY : EXP_CORRECT_RETRY;
  return EXP_TRIED;
}

/** EXPを足して、レベルアップを反映する。exp は「いまのレベルの中でたまったEXP」 */
export function applyExp(level: number, exp: number, gained: number): { level: number; exp: number } {
  exp += gained;
  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level++;
  }
  return { level, exp };
}

/** クリアした日の連続日数。同じ日の2回目以降は変えず、1日あいたら1からやり直し */
export function nextStreak(streakDays: number, lastClearedDate: string | null, today: string): number {
  if (!lastClearedDate) return 1;
  const gap = daysBetween(lastClearedDate, today);
  if (gap <= 0) return Math.max(streakDays, 1);
  return gap === 1 ? streakDays + 1 : 1;
}
