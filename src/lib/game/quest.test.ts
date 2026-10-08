import { describe, expect, it } from "vitest";
import { unitsFor } from "@/lib/curriculum/units";
import { adjustLevel, parseSubjectLevel } from "./level";
import {
  bonusRoundsForReset,
  MAX_QUESTS_PER_DAY,
  maxRoundsToday,
  pickUnits,
  QUEST_STAGES,
  QUEST_SUBJECTS,
  questSubjects,
} from "./quest";

describe("QUEST_SUBJECTS", () => {
  it("1日10問", () => {
    expect(QUEST_SUBJECTS).toHaveLength(10);
  });
});

describe("pickUnits", () => {
  const units = unitsFor(2, "math");
  it("数が足りていれば重ならない", () => {
    const picked = pickUnits(units, new Map(), 5);
    expect(new Set(picked.map((u) => u.id)).size).toBe(5);
  });
  it("単元数より多く選ぶときは重なってよい", () => {
    expect(pickUnits(units.slice(0, 2), new Map(), 5)).toHaveLength(5);
  });
  it("苦手な単元が選ばれやすい", () => {
    const stats = new Map(units.map((u) => [u.id, { total: 10, correct: u.id === "m2-kuku" ? 0 : 10 }]));
    let hits = 0;
    for (let i = 0; i < 500; i++) if (pickUnits(units, stats, 1)[0].id === "m2-kuku") hits++;
    // 重み 3 / (3 + 9*1) = 25%。一様(10%)より明らかに多い
    expect(hits).toBeGreaterThan(80);
  });
});

describe("adjustLevel", () => {
  const answers = (correct: number, total: number) =>
    Array.from({ length: total }, (_, i) => i < correct);
  it("10問未満は変えない", () => {
    expect(adjustLevel(3, answers(9, 9))).toBe(3);
  });
  it("85%以上で上がり、50%未満で下がる", () => {
    expect(adjustLevel(3, answers(17, 20))).toBe(4);
    expect(adjustLevel(3, answers(16, 20))).toBe(3);
    expect(adjustLevel(3, answers(9, 20))).toBe(2);
  });
  it("1〜10の範囲におさめる", () => {
    expect(adjustLevel(10, answers(20, 20))).toBe(10);
    expect(adjustLevel(1, answers(0, 20))).toBe(1);
  });
});

describe("parseSubjectLevel", () => {
  it("1〜10の整数だけ", () => {
    expect(parseSubjectLevel("1")).toBe(1);
    expect(parseSubjectLevel("10")).toBe(10);
    expect(parseSubjectLevel("0")).toBeNull();
    expect(parseSubjectLevel("11")).toBeNull();
    expect(parseSubjectLevel("2.5")).toBeNull();
    expect(parseSubjectLevel("")).toBeNull();
    expect(parseSubjectLevel(null)).toBeNull();
  });
});

describe("questSubjects", () => {
  it("小学生は算数4問・英語3問・理科3問", () => {
    for (const grade of [1, 2, 5]) {
      const subjects = questSubjects(grade);
      expect(subjects.filter((s) => s === "math")).toHaveLength(4);
      expect(subjects.filter((s) => s === "english")).toHaveLength(3);
      expect(subjects.filter((s) => s === "science")).toHaveLength(3);
    }
  });
  it("小学生はどの学年にも理科の単元があり、id が重ならない", () => {
    const ids = [1, 2, 3, 4, 5, 6].flatMap((grade) => {
      const units = unitsFor(grade, "science");
      expect(units.length, `${grade}年`).toBeGreaterThan(0);
      return units.map((u) => u.id);
    });
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("保育園は ひらがな7問・かず3問で、ステージの問題数は同じ", () => {
    const subjects = questSubjects(0);
    expect(subjects).toHaveLength(QUEST_SUBJECTS.length);
    expect(subjects.filter((s) => s === "japanese")).toHaveLength(7);
    expect(subjects.filter((s) => s === "math")).toHaveLength(3);
    expect(QUEST_STAGES.reduce((n, s) => n + s.subjects.length, 0)).toBe(subjects.length);
  });
});

describe("maxRoundsToday", () => {
  it("リセットした日だけ回数が増える", () => {
    expect(maxRoundsToday({ bonusRoundsDate: null, bonusRounds: 0 }, "2026-10-03")).toBe(MAX_QUESTS_PER_DAY);
    expect(maxRoundsToday({ bonusRoundsDate: "2026-10-03", bonusRounds: 3 }, "2026-10-03")).toBe(MAX_QUESTS_PER_DAY + 3);
    expect(maxRoundsToday({ bonusRoundsDate: "2026-10-02", bonusRounds: 3 }, "2026-10-03")).toBe(MAX_QUESTS_PER_DAY);
  });
  it("3回遊んでからリセットすると、あと3回遊べる", () => {
    const max = maxRoundsToday({ bonusRoundsDate: "2026-10-03", bonusRounds: bonusRoundsForReset(3) }, "2026-10-03");
    expect(max - 3).toBe(MAX_QUESTS_PER_DAY);
  });
});
