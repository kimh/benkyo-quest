import { QUEST_STAGES, type StageKind } from "./quest";

export type Stage = {
  /** 何体目のモンスターか（0から） */
  number: number;
  kind: StageKind;
  /** このモンスターの最初の問題の番号 */
  start: number;
  /** このモンスターの問題数 */
  size: number;
};

export const STAGES: Stage[] = (() => {
  let start = 0;
  return QUEST_STAGES.map((s, number) => {
    const stage = { number, kind: s.kind, start, size: s.subjects.length };
    start += s.subjects.length;
    return stage;
  });
})();

/** その問題が何体目のモンスターとのバトルか */
export function stageOf(questionIndex: number): Stage {
  return STAGES.find((s) => questionIndex < s.start + s.size) ?? STAGES[STAGES.length - 1];
}

/**
 * モンスターの残りHP（0〜1）。答え終わった問題の数だけ減る。
 * まちがえてもクエストは先に進むので、ノックの反撃で必ず減る。
 */
export function hpRatio(stage: Stage, finished: boolean[]): number {
  const done = finished.slice(stage.start, stage.start + stage.size).filter(Boolean).length;
  return (stage.size - done) / stage.size;
}

/** そのモンスターの問題をすべて答え終わったか */
export function stageCleared(stage: Stage, finished: boolean[]): boolean {
  return finished.slice(stage.start, stage.start + stage.size).every(Boolean);
}
