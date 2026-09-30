import { describe, expect, it } from "vitest";
import { isCorrect, validateQuestion, type Question } from "./question";

const base: Question = {
  subject: "math",
  unit: "m2-add-col",
  difficulty: 3,
  format: "choice",
  prompt: "りんごが 23こ、みかんが 18こ。あわせて いくつ？",
  choices: ["41", "31", "51", "40"],
  answer: "41",
  expression: "23+18",
  hint: "一のくらいから たしてみよう",
  explanation: "23+18=41 だよ",
  speech: "",
  source: "ai",
};

describe("validateQuestion", () => {
  it("正しい問題は合格", () => {
    expect(validateQuestion(base, 2)).toEqual([]);
  });
  it("式と答えが合わないと不合格", () => {
    expect(validateQuestion({ ...base, answer: "40", choices: ["41", "31", "51", "40"] }, 2)).toContainEqual(
      expect.stringContaining("式と答えが合わない"),
    );
  });
  it("正解が選択肢にない・選択肢が重複", () => {
    expect(validateQuestion({ ...base, choices: ["31", "51", "40", "30"] }, 2)).toContain("正解が選択肢にない");
    expect(validateQuestion({ ...base, choices: ["41", "41", "51", "40"] }, 2)).toContain("選択肢が重複している");
  });
  it("値が同じ選択肢（0.5 と 1/2）は不合格", () => {
    const q: Question = { ...base, choices: ["1/2", "0.5", "1/3", "1/4"], answer: "1/2", expression: "1/2" };
    expect(validateQuestion(q, 5)).toContain("正解と同じ値の選択肢がある");
  });
  it("数字入力は選択肢なし・答えは数", () => {
    const q: Question = { ...base, format: "number", choices: [] };
    expect(validateQuestion(q, 2)).toEqual([]);
    expect(validateQuestion({ ...q, answer: "3/4", expression: "3/4" }, 5)).toContain("数字入力の答えが整数・小数でない");
  });
  it("2年生に習っていない漢字があると不合格", () => {
    expect(validateQuestion({ ...base, prompt: "全部で 何個？" }, 2)).toContainEqual(expect.stringContaining("全部個"));
  });
  it("数でない答えの算数（時こく）は式なしでよい", () => {
    const q: Question = {
      ...base,
      unit: "m2-time",
      prompt: "3じ から 30ぷん たつと？",
      choices: ["3じ30ぷん", "4じ", "3じ", "2じ30ぷん"],
      answer: "3じ30ぷん",
      expression: "",
    };
    expect(validateQuestion(q, 2)).toEqual([]);
  });
  it("英語の読み上げは英語だけ", () => {
    const q: Question = {
      ...base,
      subject: "english",
      prompt: "よみあげを きいてね！ どれかな？",
      choices: ["🐶", "🐱", "🐦", "🐟"],
      answer: "🐶",
      expression: "",
      speech: "dog",
    };
    expect(validateQuestion(q, 2)).toEqual([]);
    expect(validateQuestion({ ...q, speech: "いぬ" }, 2)).toContain("読み上げに英語以外の文字がある");
  });
});

describe("isCorrect", () => {
  it("選択肢は完全一致", () => {
    expect(isCorrect(base, "41")).toBe(true);
    expect(isCorrect(base, "31")).toBe(false);
  });
  it("数字入力は値で比べる", () => {
    const q: Question = { ...base, format: "number", choices: [], answer: "0.5" };
    expect(isCorrect(q, "0.50")).toBe(true);
    expect(isCorrect(q, ".5")).toBe(false);
    expect(isCorrect(q, "")).toBe(false);
  });
});
