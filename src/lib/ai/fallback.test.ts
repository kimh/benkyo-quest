import { describe, expect, it } from "vitest";
import { subjectsFor, unitsFor } from "@/lib/curriculum/units";
import { GRADES } from "@/lib/game/player";
import { isCorrect, validateQuestion } from "@/lib/game/question";
import { fallbackQuestion } from "./fallback";

/** テスト用の再現できる乱数 */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("fallbackQuestion", () => {
  for (const grade of GRADES) {
    for (const subject of subjectsFor(grade)) {
      it(`${grade}年 ${subject} は検証に通り、正解で正解になる`, () => {
        const slot = { subject, unit: unitsFor(grade, subject)[0], difficulty: 3 };
        for (let seed = 1; seed <= 300; seed++) {
          const q = fallbackQuestion(slot, grade, seeded(seed));
          expect(validateQuestion(q, grade), `${seed}: ${q.prompt}`).toEqual([]);
          expect(isCorrect(q, q.answer)).toBe(true);
          expect(q.source).toBe("fallback");
          expect(q.subject).toBe(subject);
        }
      });
    }
  }
});
