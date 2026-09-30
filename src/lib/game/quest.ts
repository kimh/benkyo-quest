import { subjectsFor, type Subject, type Unit } from "@/lib/curriculum/units";

export type StageKind = "minion" | "boss";

/** 1日に遊べるクエストの回数 */
export const MAX_QUESTS_PER_DAY = 3;

/** 1日のクエストの構成：雑魚3体＋ボス。合計10問 */
export const QUEST_STAGES: { kind: StageKind; subjects: Subject[] }[] = [
  { kind: "minion", subjects: ["math", "math", "math"] },
  { kind: "minion", subjects: ["english", "english", "english"] },
  { kind: "minion", subjects: ["math", "english"] },
  { kind: "boss", subjects: ["math", "english"] },
];

export const QUEST_SUBJECTS: Subject[] = QUEST_STAGES.flatMap((s) => s.subjects);

/** その学年のクエストの科目の並び。保育園は英語の枠が「ひらがな」になる */
export function questSubjects(grade: number): Subject[] {
  const [main, second] = subjectsFor(grade);
  return QUEST_SUBJECTS.map((s) => (s === "math" ? main : second));
}

export type UnitStats = Map<string, { total: number; correct: number }>;

/**
 * 出題する単元を選ぶ。正答率が低い単元・まだ出ていない単元ほど選ばれやすい。
 * できるだけ同じ単元が重ならないようにする。
 */
export function pickUnits(
  units: Unit[],
  stats: UnitStats,
  count: number,
  random: () => number = Math.random,
): Unit[] {
  const weight = (u: Unit) => {
    const s = stats.get(u.id);
    if (!s || s.total === 0) return 1.5;
    return 1 + 2 * (1 - s.correct / s.total);
  };
  const picked: Unit[] = [];
  let pool = [...units];
  while (picked.length < count) {
    if (pool.length === 0) pool = [...units];
    const total = pool.reduce((sum, u) => sum + weight(u), 0);
    let r = random() * total;
    const idx = pool.findIndex((u) => (r -= weight(u)) < 0);
    const [u] = pool.splice(idx === -1 ? pool.length - 1 : idx, 1);
    picked.push(u);
  }
  return picked;
}
