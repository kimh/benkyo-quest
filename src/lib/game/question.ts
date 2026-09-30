import { unlearnedKanji } from "@/lib/curriculum/kanji";
import type { Subject } from "@/lib/curriculum/units";
import { eq, evaluate, parseAnswerNumber, parseDecimal } from "@/lib/ai/rational";

export type QuestionFormat = "choice" | "number";

/** DBに保存する問題（正解を含む。クライアントには PublicQuestion だけ渡す） */
export type Question = {
  subject: Subject;
  unit: string;
  difficulty: number;
  format: QuestionFormat;
  /** ノックの台詞としての問題文 */
  prompt: string;
  /** choice のときの選択肢（4つ）。number のときは空 */
  choices: string[];
  answer: string;
  /** 算数の答えを計算する式。コードで検算する */
  expression: string;
  hint: string;
  explanation: string;
  /** 英語の読み上げテキスト。無ければ空 */
  speech: string;
  source: "ai" | "fallback";
};

export type PublicQuestion = Pick<Question, "subject" | "format" | "prompt" | "choices" | "speech">;

export function toPublic(q: Question): PublicQuestion {
  return { subject: q.subject, format: q.format, prompt: q.prompt, choices: q.choices, speech: q.speech };
}

const MAX_PROMPT = 150;
const MAX_CHOICE = 30;
const MAX_SPEECH = 120;

/** 問題として出してよいかを検査し、問題点の一覧を返す（空なら合格） */
export function validateQuestion(q: Question, grade: number): string[] {
  const errors: string[] = [];
  const fields = [q.prompt, q.answer, q.hint, q.explanation];
  if (fields.some((f) => !f.trim())) errors.push("空の項目がある");
  if (q.prompt.length > MAX_PROMPT) errors.push("問題文が長すぎる");
  if (q.speech.length > MAX_SPEECH) errors.push("読み上げが長すぎる");
  if (q.speech && /[^\x20-\x7e]/.test(q.speech)) errors.push("読み上げに英語以外の文字がある");

  if (q.format === "choice") {
    if (q.choices.length !== 4) errors.push("選択肢が4つでない");
    if (new Set(q.choices.map((c) => c.trim())).size !== q.choices.length) errors.push("選択肢が重複している");
    if (q.choices.some((c) => !c.trim() || c.length > MAX_CHOICE)) errors.push("選択肢が空か長すぎる");
    if (!q.choices.includes(q.answer)) errors.push("正解が選択肢にない");
  } else {
    if (q.choices.length !== 0) errors.push("数字入力なのに選択肢がある");
    if (!parseDecimal(q.answer)) errors.push("数字入力の答えが整数・小数でない");
    if (q.subject !== "math") errors.push("数字入力は算数だけ");
  }

  if (q.subject === "math") {
    const answerValue = parseAnswerNumber(q.answer);
    if (answerValue) {
      const computed = evaluate(q.expression);
      if (!computed) errors.push(`式が計算できない: ${q.expression}`);
      else if (!eq(computed, answerValue)) errors.push(`式と答えが合わない: ${q.expression} ≠ ${q.answer}`);
      if (q.format === "choice") {
        const same = q.choices.filter((c) => {
          const v = parseAnswerNumber(c);
          return v && eq(v, answerValue);
        });
        if (same.length > 1) errors.push("正解と同じ値の選択肢がある");
      }
    }
  }

  const texts = [q.prompt, q.hint, q.explanation, ...q.choices].join("");
  const kanji = unlearnedKanji(texts, grade);
  if (kanji.length) errors.push(`まだ習っていない漢字: ${kanji.join("")}`);

  return errors;
}

/** 解答が正しいか。選択肢はそのまま比較、数字は値で比較（"0.50" と "0.5" は同じ） */
export function isCorrect(q: Question, value: string): boolean {
  if (q.format === "choice") return value === q.answer;
  const a = parseAnswerNumber(value);
  const b = parseAnswerNumber(q.answer);
  return !!a && !!b && eq(a, b);
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
