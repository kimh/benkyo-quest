import { describe, expect, it } from "vitest";
import { FIELD_SONG, frequency, length } from "./songs";

describe("FIELD_SONG", () => {
  it("メロディとベースが同じ長さ（8小節）", () => {
    expect(length(FIELD_SONG.melody)).toBe(64);
    expect(length(FIELD_SONG.bass)).toBe(64);
  });
  it("すべての音名が読める", () => {
    for (const [p] of [...FIELD_SONG.melody, ...FIELD_SONG.bass]) expect(() => frequency(p)).not.toThrow();
  });
});

describe("frequency", () => {
  it("A4 = 440Hz、C4 ≒ 261.6Hz", () => {
    expect(frequency("A4")).toBe(440);
    expect(frequency("C4")).toBeCloseTo(261.63, 1);
    expect(frequency("R")).toBeNull();
  });
});
