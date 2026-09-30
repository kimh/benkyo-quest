import { describe, expect, it } from "vitest";
import { unlearnedKanji } from "./kanji";

describe("unlearnedKanji", () => {
  it("1年生は1年の漢字だけ", () => {
    expect(unlearnedKanji("犬が三びき", 1)).toEqual([]);
    expect(unlearnedKanji("魚が三びき", 1)).toEqual(["魚"]);
  });
  it("2年生は1・2年の漢字まで", () => {
    expect(unlearnedKanji("魚が三びき", 2)).toEqual([]);
    expect(unlearnedKanji("合計は何円？", 2)).toEqual([]);
    expect(unlearnedKanji("全部で何個？", 2)).toEqual(["全", "部", "個"]);
  });
  it("3年生以上はチェックしない", () => {
    expect(unlearnedKanji("面積を求めよう", 5)).toEqual([]);
  });
});
