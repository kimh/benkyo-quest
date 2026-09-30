import { describe, expect, it } from "vitest";
import { currentStreak, parseGrade, validateName } from "./player";

describe("validateName", () => {
  it("前後の空白を取り除く", () => {
    expect(validateName("  たろう ")).toEqual({ ok: true, name: "たろう" });
  });
  it("空やスペースだけはエラー", () => {
    expect(validateName("").ok).toBe(false);
    expect(validateName("　 ").ok).toBe(false);
  });
  it("8文字まで（絵文字も1文字として数える）", () => {
    expect(validateName("あいうえおかきく").ok).toBe(true);
    expect(validateName("あいうえおかきくけ").ok).toBe(false);
    expect(validateName("🐶🐶🐶🐶🐶🐶🐶🐶").ok).toBe(true);
  });
  it("制御文字やタグ記号は使えない", () => {
    expect(validateName("a\nb").ok).toBe(false);
    expect(validateName("<b>").ok).toBe(false);
  });
});

describe("parseGrade", () => {
  it("保育園(0)と1〜6年のみ受け付ける", () => {
    expect(parseGrade("2")).toBe(2);
    expect(parseGrade("0")).toBe(0);
    expect(parseGrade("")).toBeNull();
    expect(parseGrade(null)).toBeNull();
    expect(parseGrade("-1")).toBeNull();
    expect(parseGrade("7")).toBeNull();
    expect(parseGrade("x")).toBeNull();
  });
});

describe("currentStreak", () => {
  it("今日か昨日にクリアしていれば続いている", () => {
    expect(currentStreak(5, "2026-09-30", "2026-09-30")).toBe(5);
    expect(currentStreak(5, "2026-09-29", "2026-09-30")).toBe(5);
    expect(currentStreak(5, "2026-08-31", "2026-09-01")).toBe(5);
  });
  it("2日以上あくと0", () => {
    expect(currentStreak(5, "2026-09-28", "2026-09-30")).toBe(0);
    expect(currentStreak(0, null, "2026-09-30")).toBe(0);
  });
});
