/**
 * BGMの楽譜。音の長さは8分音符=1。"R" は休符。
 * メロディ・ベースとも、1小節=8 になるように書く。
 */
export type Note = [pitch: string, eighths: number];

export type Song = {
  bpm: number;
  melody: Note[];
  bass: Note[];
};

/** ホーム・タイトル用：明るくはずむフィールド曲（ハ長調・8小節ループ） */
export const FIELD_SONG: Song = {
  bpm: 132,
  melody: [
    // 1: C
    ["C5", 2], ["E5", 2], ["G5", 2], ["E5", 2],
    // 2: F
    ["F5", 2], ["A5", 2], ["G5", 4],
    // 3: C
    ["E5", 1], ["F5", 1], ["G5", 2], ["C6", 2], ["G5", 2],
    // 4: Am
    ["A5", 2], ["G5", 2], ["E5", 4],
    // 5: F
    ["F5", 2], ["F5", 1], ["E5", 1], ["D5", 2], ["E5", 2],
    // 6: Dm
    ["D5", 2], ["E5", 2], ["F5", 2], ["A5", 2],
    // 7: G
    ["G5", 2], ["E5", 2], ["D5", 2], ["B4", 2],
    // 8: C
    ["C5", 6], ["R", 2],
  ],
  bass: [
    ["C3", 2], ["G3", 2], ["C4", 2], ["G3", 2],
    ["F2", 2], ["C3", 2], ["F3", 2], ["C3", 2],
    ["C3", 2], ["G3", 2], ["C4", 2], ["G3", 2],
    ["A2", 2], ["E3", 2], ["A3", 2], ["E3", 2],
    ["F2", 2], ["C3", 2], ["F3", 2], ["C3", 2],
    ["D3", 2], ["A3", 2], ["D4", 2], ["A3", 2],
    ["G2", 2], ["D3", 2], ["G3", 2], ["B3", 2],
    ["C3", 2], ["G3", 2], ["C4", 4],
  ],
};

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C#5" などを周波数(Hz)に。休符は null */
export function frequency(pitch: string): number | null {
  if (pitch === "R") return null;
  const m = /^([A-G])(#|b)?(\d)$/.exec(pitch);
  if (!m) throw new Error(`音名が読めません: ${pitch}`);
  const semitone = NOTE_INDEX[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semitone;
  return 440 * 2 ** ((midi - 69) / 12);
}

export function length(notes: Note[]): number {
  return notes.reduce((sum, [, d]) => sum + d, 0);
}
