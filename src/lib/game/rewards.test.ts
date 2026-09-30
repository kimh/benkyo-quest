import { describe, expect, it } from "vitest";
import { applyExp, expForAnswer, nextStreak } from "./rewards";

describe("expForAnswer", () => {
  it("1回目で正解 10、ヒント後に正解 5、まちがい 2", () => {
    expect(expForAnswer(1, true)).toBe(10);
    expect(expForAnswer(2, true)).toBe(5);
    expect(expForAnswer(2, false)).toBe(2);
  });
});

describe("applyExp", () => {
  it("必要EXPに届くとレベルアップし、あまりは次のレベルに持ちこす", () => {
    // Lv1→2 は 20、Lv2→3 は 30
    expect(applyExp(1, 15, 3)).toEqual({ level: 1, exp: 18 });
    expect(applyExp(1, 15, 10)).toEqual({ level: 2, exp: 5 });
    expect(applyExp(1, 0, 55)).toEqual({ level: 3, exp: 5 });
  });
});

describe("nextStreak", () => {
  it("はじめてのクリアは1日目", () => {
    expect(nextStreak(0, null, "2026-10-01")).toBe(1);
  });
  it("昨日もクリアしていれば +1（月をまたいでも）", () => {
    expect(nextStreak(4, "2026-09-30", "2026-10-01")).toBe(5);
  });
  it("同じ日の2回目以降は変わらない", () => {
    expect(nextStreak(4, "2026-10-01", "2026-10-01")).toBe(4);
  });
  it("1日でもあいたら1から", () => {
    expect(nextStreak(9, "2026-09-28", "2026-10-01")).toBe(1);
  });
});
