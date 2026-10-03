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
  it("ひらがなの「きいて」の問題は、ひらがなの読み上げだけ・問題文に ことばを書かない", () => {
    const listen: Question = {
      ...base,
      subject: "japanese",
      unit: "j0-listen",
      prompt: "よみあげる ことばは どれかな？",
      choices: ["いちご", "いちこ", "いしご", "りんご"],
      answer: "いちご",
      expression: "",
      hint: "さいしょの もじを よく きいてね",
      explanation: "「いちご」は い・ち・ご だよ",
      speech: "いちご",
    };
    expect(validateQuestion(listen, 0)).toEqual([]);
    expect(validateQuestion({ ...listen, speech: "strawberry" }, 0)).toContain("読み上げに ひらがな以外の文字がある");
    expect(validateQuestion({ ...listen, speech: "苺" }, 0)).toContain("読み上げに ひらがな以外の文字がある");
    expect(validateQuestion({ ...listen, prompt: "いちご は どれかな？" }, 0)).toContain(
      "問題文かヒントに読み上げの ことばが書いてある",
    );
    expect(validateQuestion({ ...base, speech: "いちご" }, 2)).toContain("読み上げに英語以外の文字がある");
  });
  it("英語は英検の読解や会話文のために長めの文を許す", () => {
    const english: Question = {
      ...base,
      subject: "english",
      unit: "k3-talk",
      prompt: `${"A: Have you ever been to Kyoto? ".repeat(6)}\n( )に 入るのは どれ？`,
      choices: ["Yes, I have been there twice.", "No, I don't like it at all.", "I will go there.", "It is mine."],
      answer: "Yes, I have been there twice.",
      expression: "",
      hint: "have been to の文だよ",
      explanation: "Have you ever 〜? には Yes, I have. で答えるよ",
    };
    expect(validateQuestion(english, 5)).toEqual([]);
    expect(validateQuestion({ ...base, prompt: "あ".repeat(151) }, 2)).toContain("問題文が長すぎる");
    expect(validateQuestion({ ...english, prompt: "a".repeat(301) }, 5)).toContain("問題文が長すぎる");
  });
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

describe("validateQuestion（保育園）", () => {
  const pre: Question = {
    ...base,
    unit: "m0-count",
    prompt: "🍎🍎🍎 いくつ あるかな？",
    choices: ["2", "3", "4", "5"],
    answer: "3",
    expression: "3",
    hint: "ゆびで かぞえよう",
    explanation: "3こ だよ",
  };
  it("ひらがなと絵文字だけの4択は合格", () => {
    expect(validateQuestion(pre, 0)).toEqual([]);
  });
  it("漢字は1つも使えない", () => {
    expect(validateQuestion({ ...pre, prompt: "🍎🍎🍎 何こ あるかな？" }, 0)).toContainEqual(expect.stringContaining("何"));
  });
  it("選択肢は2〜4つでよい（どっちが おおい）", () => {
    const more: Question = { ...pre, unit: "m0-more", prompt: "🐱🐱🐱 と 🐶 どっちが おおい？", choices: ["🐱", "🐶"], answer: "🐱", expression: "" };
    expect(validateQuestion(more, 0)).toEqual([]);
    expect(validateQuestion({ ...more, choices: ["🐱"] }, 0)).toContain("選択肢が4つでない");
    expect(validateQuestion({ ...base, choices: ["41", "31"] }, 2)).toContain("選択肢が4つでない");
  });
  it("数字入力は使えない", () => {
    expect(validateQuestion({ ...pre, format: "number", choices: [] }, 0)).toContain("保育園は4択だけ");
  });
  it("ひらがなの問題に式はいらない", () => {
    const j: Question = { ...pre, subject: "japanese", unit: "j0-match", prompt: "「あ」と おなじ もじは？", choices: ["あ", "お", "め", "ぬ"], answer: "あ" };
    expect(validateQuestion(j, 0)).toContain("ひらがなの問題に式がある");
    expect(validateQuestion({ ...j, expression: "" }, 0)).toEqual([]);
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
