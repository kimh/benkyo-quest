import { PRESCHOOL, type Subject, type Unit } from "@/lib/curriculum/units";

export type StageKind = "minion" | "boss";

/** 1日に遊べるクエストの回数 */
export const MAX_QUESTS_PER_DAY = 3;

/** 今日遊べる回数。保護者がリセットした日は、そのぶん増える */
export function maxRoundsToday(
  player: { bonusRoundsDate: string | null; bonusRounds: number },
  today: string,
): number {
  return MAX_QUESTS_PER_DAY + (player.bonusRoundsDate === today ? player.bonusRounds : 0);
}

/** 回数をリセットしたときの、今日足す回数（いま遊んだ回のぶんだけ足して、また MAX 回遊べるようにする） */
export function bonusRoundsForReset(playedRounds: number): number {
  return Math.max(0, playedRounds);
}

/** 1日のクエストの構成（小学生）：雑魚3体＋ボス。合計10問（算数4・英語3・理科3） */
export const QUEST_STAGES: { kind: StageKind; subjects: Subject[] }[] = [
  { kind: "minion", subjects: ["math", "math", "math"] },
  { kind: "minion", subjects: ["english", "english", "english"] },
  { kind: "minion", subjects: ["science", "science"] },
  { kind: "boss", subjects: ["math", "science"] },
];

export const QUEST_SUBJECTS: Subject[] = QUEST_STAGES.flatMap((s) => s.subjects);

/**
 * 保育園は ひらがな を重点的に出す（10問のうち ひらがな7問・かず3問）。
 * ステージごとの問題数は QUEST_STAGES と同じ（3・3・2・2）。
 */
const PRESCHOOL_SUBJECTS: Subject[] = [
  ...(["japanese", "japanese", "japanese"] as const),
  ...(["math", "math", "japanese"] as const),
  ...(["japanese", "math"] as const),
  ...(["japanese", "japanese"] as const),
];

/** その学年のクエストの科目の並び */
export function questSubjects(grade: number): Subject[] {
  return grade === PRESCHOOL ? PRESCHOOL_SUBJECTS : QUEST_SUBJECTS;
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
