import { describe, expect, it } from "vitest";
import { BATTLE_SONG, BOSS_SONG, FIELD_SONG, frequency, length } from "./songs";

describe.each([
  ["FIELD_SONG", FIELD_SONG],
  ["BATTLE_SONG", BATTLE_SONG],
  ["BOSS_SONG", BOSS_SONG],
])("%s", (_, song) => {
  it("メロディとベースが同じ長さ（8小節）", () => {
    expect(length(song.melody)).toBe(64);
    expect(length(song.bass)).toBe(64);
  });
  it("すべての音名が読める", () => {
    for (const [p] of [...song.melody, ...song.bass]) expect(() => frequency(p)).not.toThrow();
  });
});

describe("BOSS_SONG", () => {
  it("バトル曲を半音上げている（A4 → A#4）", () => {
    expect(BOSS_SONG.melody[0][0]).toBe("A#4");
    expect(BOSS_SONG.bass[0][0]).toBe("A#2");
  });
});

describe("frequency", () => {
  it("A4 = 440Hz、C4 ≒ 261.6Hz", () => {
    expect(frequency("A4")).toBe(440);
    expect(frequency("C4")).toBeCloseTo(261.63, 1);
    expect(frequency("R")).toBeNull();
  });
});
