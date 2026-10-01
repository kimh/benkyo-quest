import { describe, expect, it } from "vitest";
import { medalFor, rankBy, topWithSelf, type PlayerScore } from "./ranking";

const p = (playerId: number, answered: number, correct: number): PlayerScore => ({
  playerId,
  name: `p${playerId}`,
  answered,
  correct,
});

describe("rankBy", () => {
  it("多い順・同じ数は同じ順位・0の人はのせない", () => {
    const rows = rankBy([p(1, 10, 5), p(2, 20, 8), p(3, 15, 8), p(4, 3, 0), p(5, 12, 4)], "correct");
    expect(rows.map((r) => [r.playerId, r.rank])).toEqual([
      [2, 1],
      [3, 1],
      [1, 3],
      [5, 4],
    ]);
  });
  it("回答数でもならべられる", () => {
    expect(rankBy([p(1, 10, 5), p(2, 20, 8)], "answered").map((r) => r.value)).toEqual([20, 10]);
  });
  it("だれもいなければ空", () => {
    expect(rankBy([], "correct")).toEqual([]);
  });
});

describe("topWithSelf", () => {
  const ranked = rankBy([p(1, 5, 5), p(2, 4, 4), p(3, 3, 3), p(4, 3, 3), p(5, 1, 1)], "correct");
  it("3位までは同じ順位の人もふくむ", () => {
    expect(topWithSelf(ranked, 1).top.map((r) => r.playerId)).toEqual([1, 2, 3, 4]);
    expect(topWithSelf(ranked, 1).self).toBeNull();
  });
  it("圏外なら自分の行を返す", () => {
    expect(topWithSelf(ranked, 5).self).toMatchObject({ playerId: 5, rank: 5 });
  });
  it("まだ答えていない自分は出さない", () => {
    expect(topWithSelf(ranked, 9).self).toBeNull();
  });
});

describe("medalFor", () => {
  it("1位ダイアモンド・2位ゴールド・3位シルバー", () => {
    expect(medalFor(1)?.label).toBe("ダイアモンド");
    expect(medalFor(2)?.label).toBe("ゴールド");
    expect(medalFor(3)?.label).toBe("シルバー");
    expect(medalFor(4)).toBeNull();
  });
});
