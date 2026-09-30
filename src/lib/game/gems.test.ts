import { describe, expect, it } from "vitest";
import { normalizeRedeemNote, validateRedeemAmount } from "./gems";

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
