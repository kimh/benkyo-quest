import { describe, expect, it } from "vitest";
import { hpRatio, stageCleared, stageOf, STAGES } from "./battle";
import { BOSSES, MINIONS, monstersForQuest } from "./monsters";

describe("stageOf", () => {
  it("10問を 雑魚3体(3・3・2問)＋ボス(2問) に分ける", () => {
    expect(STAGES.map((s) => [s.kind, s.start, s.size])).toEqual([
      ["minion", 0, 3],
      ["minion", 3, 3],
      ["minion", 6, 2],
      ["boss", 8, 2],
    ]);
    expect(stageOf(0).number).toBe(0);
    expect(stageOf(2).number).toBe(0);
    expect(stageOf(3).number).toBe(1);
    expect(stageOf(7).number).toBe(2);
    expect(stageOf(9).kind).toBe("boss");
  });
});

describe("hpRatio / stageCleared", () => {
  const finished = [true, true, false, false, false, false, false, false, false, false];
  it("答え終わった数だけHPが減る", () => {
    expect(hpRatio(STAGES[0], finished)).toBeCloseTo(1 / 3);
    expect(hpRatio(STAGES[1], finished)).toBe(1);
    expect(stageCleared(STAGES[0], finished)).toBe(false);
    expect(stageCleared(STAGES[0], [true, true, true, ...finished.slice(3)])).toBe(true);
  });
});

describe("monstersForQuest", () => {
  it("同じ日・同じ回なら同じモンスター、雑魚は重ならない", () => {
    const a = monstersForQuest("2026-10-01", 1);
    expect(monstersForQuest("2026-10-01", 1)).toEqual(a);
    expect(new Set(a.minions.map((m) => m.id)).size).toBe(3);
    expect(BOSSES).toContainEqual(a.boss);
    a.minions.forEach((m) => expect(MINIONS).toContainEqual(m));
  });
  it("日や回が変わると顔ぶれが変わる", () => {
    const sets = new Set(
      ["2026-10-01", "2026-10-02", "2026-10-03"].flatMap((d) => [1, 2, 3].map((r) => JSON.stringify(monstersForQuest(d, r)))),
    );
    expect(sets.size).toBeGreaterThan(3);
  });
});
