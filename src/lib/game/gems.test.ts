import { describe, expect, it } from "vitest";
import { DEFAULT_GEM_SETTINGS, gemsForCorrect, normalizeRedeemNote, parseGemSettings, robuxFor, validateRedeemAmount, validateRobuxAmount } from "./gems";

describe("validateRedeemAmount", () => {
  it("1以上・使えるGem以下の整数だけ", () => {
    expect(validateRedeemAmount("10", 30)).toBe(10);
    expect(validateRedeemAmount(30, 30)).toBe(30);
    expect(validateRedeemAmount("31", 30)).toBeNull();
    expect(validateRedeemAmount("0", 30)).toBeNull();
    expect(validateRedeemAmount("1.5", 30)).toBeNull();
    expect(validateRedeemAmount("", 30)).toBeNull();
  });
});

describe("validateRobuxAmount", () => {
  it("100 Gem ずつ・使えるGem以下だけ", () => {
    expect(validateRobuxAmount("100", 150)).toBe(100);
    expect(validateRobuxAmount(300, 300)).toBe(300);
    expect(validateRobuxAmount("50", 150)).toBeNull();
    expect(validateRobuxAmount("150", 150)).toBeNull();
    expect(validateRobuxAmount("200", 150)).toBeNull();
    expect(validateRobuxAmount("0", 150)).toBeNull();
    expect(validateRobuxAmount("-100", 150)).toBeNull();
  });
  it("2 Gem で 1 Robux", () => {
    expect(robuxFor(100)).toBe(50);
    expect(robuxFor(300)).toBe(150);
  });
});

describe("normalizeRedeemNote", () => {
  it("空でもよく、前後の空白は取る", () => {
    expect(normalizeRedeemNote(null)).toBe("");
    expect(normalizeRedeemNote("  アイス ")).toBe("アイス");
  });
  it("30文字まで・制御文字やタグ記号はだめ", () => {
    expect(normalizeRedeemNote("あ".repeat(30))).toBe("あ".repeat(30));
    expect(normalizeRedeemNote("あ".repeat(31))).toBeNull();
    expect(normalizeRedeemNote("a\nb")).toBeNull();
    expect(normalizeRedeemNote("<b>")).toBeNull();
  });
});

describe("parseGemSettings", () => {
  it("0〜100の整数を受け付ける", () => {
    expect(parseGemSettings({ correctFirstTry: "2", correctRetry: "0", questClear: "100" })).toEqual({
      correctFirstTry: 2,
      correctRetry: 0,
      questClear: 100,
    });
  });
  it("空・小数・範囲外が1つでもあればだめ", () => {
    const ok = { correctFirstTry: "1", correctRetry: "0", questClear: "10" };
    expect(parseGemSettings({ ...ok, correctRetry: "" })).toBeNull();
    expect(parseGemSettings({ ...ok, questClear: "1.5" })).toBeNull();
    expect(parseGemSettings({ ...ok, questClear: "101" })).toBeNull();
    expect(parseGemSettings({ ...ok, correctFirstTry: "-1" })).toBeNull();
    expect(parseGemSettings({ correctFirstTry: "1" })).toBeNull();
  });
});

describe("gemsForCorrect", () => {
  it("1回目と再挑戦で設定の数を使う", () => {
    const settings = { ...DEFAULT_GEM_SETTINGS, correctFirstTry: 3, correctRetry: 1 };
    expect(gemsForCorrect(true, settings)).toBe(3);
    expect(gemsForCorrect(false, settings)).toBe(1);
  });
});
