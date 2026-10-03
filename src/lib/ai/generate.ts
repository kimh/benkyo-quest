import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { describeEikenLevel, EIKEN_SCOPE, eikenLabel, type EikenGrade } from "@/lib/curriculum/eiken";
import { describeLevel, PRESCHOOL, subjectName, subjectsFor, type Subject, type Unit } from "@/lib/curriculum/units";
import { shuffle, validateQuestion, type Question } from "@/lib/game/question";
import { fallbackQuestion } from "./fallback";

export const QUESTION_MODEL = "claude-sonnet-5-5";

/** 1問ぶんの出題枠。どの科目・単元・難しさで作るかはコード側で決める */
export type Slot = { subject: Subject; unit: Unit; difficulty: number };

export type GenerateInput = {
  grade: number;
  levels: Record<Subject, number>;
  /** 英語を英検の級で出すときの級。null なら学年どおり */
  eiken: EikenGrade | null;
  slots: Slot[];
  /** 直近に出した問題文（重複を避ける） */
  recentPrompts: string[];
};

export type GenerateResult = {
  questions: Question[];
  /** AIで作れた問題数（残りはフォールバック） */
  aiCount: number;
  /** AIへのリクエスト回数 */
  requests: number;
  /** 検証で落ちた問題の理由（品質確認用） */
  rejected: { slot: number; prompt: string; errors: string[] }[];
  /** API呼び出しの失敗（品質確認用） */
  failures: string[];
};

const OutputSchema = z.object({
  questions: z.array(
    z.object({
      slot: z.number().int(),
      format: z.enum(["choice", "number"]),
      prompt: z.string(),
      choices: z.array(z.string()),
      answer: z.string(),
      expression: z.string(),
      hint: z.string(),
      explanation: z.string(),
      speech: z.string(),
    }),
  ),
});

type RawQuestion = z.infer<typeof OutputSchema>["questions"][number];

const SYSTEM_PROMPT = `あなたは、日本の子ども（保育園の年長〜小学6年生）向けの学習ゲーム「勉強クエスト」の問題作成係です。
ゲームはドット絵のRPG風で、マスコットの犬「ノック」が子どもに問題を出します。子どもは問題に答えてモンスターをたおします。
指定された出題枠ごとに、算数・英語・かず・ひらがな のどれかの問題を1問ずつ作ってください。

# 問題文 (prompt)
- ノックが子どもに話しかける台詞として書く。明るく やさしい口調で、ときどき語尾に「ワン！」をつけてよい。
- 子どもの名前は書かない（「きみ」と呼ぶのはよい）。
- 1〜2文で短く。図や絵は表示できないので、図形は言葉で説明する。絵文字は使ってよい。

# 学年にあわせた文字
- 保育園（5さい）: 漢字は1つも使わない。ひらがなだけで書く（カタカナは「ノック」「ワン」だけ）。字が読めない子もいるので、問題文は声で読み上げられる。耳で聞いてわかる、とても短い文にする。
- 1〜2年生: 文節ごとにスペースを入れる（分かち書き）。ほとんど ひらがなで書き、漢字は1年生の漢字と かんたんな2年生の漢字だけにする。カタカナは使ってよい。
- 3年生以上: その学年までに習う漢字を使ってよい。むずかしい漢字は ひらがなにする。
- この文字のルールは prompt・choices・hint・explanation のすべてに当てはまる。

# 形式 (format)
- "number": 答えが整数か小数になる算数の問題で、数字を入力して答える。choices は空の配列にする。算数の約半分をこの形式にする。
- "choice": 4択。choices は ちょうど4つ、重複なし。answer は choices のどれか1つと完全に同じ文字列にする。まちがいの選択肢は、よくある まちがい（くり上がりわすれ、けたのずれ など）から作る。
- 英語・ひらがな・保育園の問題は必ず "choice" にする。

# 算数の答えと式 (expression)
- 答えが数（整数・小数・分数）になるときは、必ず答えを計算する式を expression に書く。答えが分数 1/4 なら expression も "1/4" のように書く。数の読み書きのように計算がない問題でも、答えの数をそのまま書く（答え 3520 なら expression は "3520"）。使えるのは数字・小数点・+ - * / ( ) だけ（×や÷は使わない）。式を計算した結果は answer とぴったり同じ値にする。
- 数を答える選択肢と answer は数字だけにする（「こ」「cm」などの単位は問題文に書く）。分数は 3/4 のように書く。
- 時こくや図形の名前など、答えが数でないときは expression を空文字列にする。
- 英語・ひらがなの問題の expression は必ず空文字列にする。

# 英語
- 1〜2年生: 読み上げを聞いて答える問題にする。speech に読み上げる英語（単語や短い文）を書き、choices は絵文字にする（例: speech "dog"、choices ["🐶","🐱","🐦","🐟"]）。prompt には答えの英語を書かない（「よみあげを きいてね！ どれかな？」のように書く）。
- 3〜4年生: 読み上げ問題と、かんたんな単語の意味の問題をまぜる。
- 5〜6年生: 単語の意味、文の空らんうめ、読み上げを聞いて答える問題をまぜる。
- speech は英語の半角文字だけで書く。読み上げがいらない問題では空文字列にする。

# 英語を英検の級で出すとき
「英語: 英検○級」と指定されたら、英語の問題は学年ではなく その級の出題範囲で作る（上の学年別の英語のルールは使わない）。
- 英検の問題の形にあわせて、4択にする: 語い・文法の空らん（英文の ( ) に入るものを選ぶ）、会話文の空らん、短い読解、リスニング。
- 英文の単語・文法は その級のレベルにする。かんたんにしすぎない。
- 空らんは ( ) で書く。英文は prompt に書き、そのあとに改行して日本語で何をするか短く書く（例: 1行目 "My sister ( ) tennis every Sunday."、2行目 "( )に 入るのは どれ？"）。
- 読解は英文3文まで。prompt は全体で300文字以内にする。
- 選択肢は英語（語い・文法なら単語や語句、会話文なら短い文）。1つ60文字以内。
- リスニングの単元では、speech に読み上げる英文を書き、prompt には英文を書かない（「よみあげを きいて、こたえを えらんでね」のように書く）。それ以外の単元では speech は空文字列にする。
- 日本語の部分（指示・ヒント・解説）は、学年にあわせた文字のルールにしたがう。

# 保育園（5さい・年長）
- 「かず」: 絵文字を並べて数えたり（🍎🍎🍎 は いくつ？）、くらべたりする。数は10まで。答えが数のときは expression に答えの数（または 2+1 のような式）を書く。選択肢は数字だけ。
- 「ひらがな」: 1もじの ひらがな・短い ことば・絵文字を選択肢にする。まちがいの選択肢には、かたちや音の にている もじを入れる。speech と expression は空文字列にする。
- 「どっちが おおい」のように、くらべる2つから えらぶ問題は choices を2つにしてよい（それ以外は4つ）。「わからない」のような つなぎの選択肢は入れない。
- 絵文字の数は子どもが数えやすいように、10こまでにする。問題文で絵文字の並びを先に書き、改行してから質問を書いてよい。
- ほめる、はげます言葉を多めにする。

# ヒントと解説
- hint: 答えは書かずに、考え方の手がかりをノックの口調で1文で書く。
- explanation: なぜその答えになるかを1〜2文で書く。
- hint と explanation には「speech」「prompt」などの項目名を書かない（子どもにそのまま見せる文章なので、「よみあげでは〜」のように書く）。
- 読み上げの問題では、問題文・読み上げ・答えの内容を一致させる（例:「すきな教科は？」と聞くなら、読み上げも好きな教科を言う文にする）。

# 難しさ
- 出題枠ごとに、単元と難しさの目安を指定する。その学年の学習指導要領の範囲で、目安にあわせた問題にする。
- 同じ回の中や、「最近出した問題」と同じ問題を出さない。

出題枠の番号 (slot) は、指定された番号をそのまま使うこと。`;

function userMessage(input: GenerateInput, slotIndexes: number[]): string {
  const { grade } = input;
  const lines = [
    `学年: ${grade === PRESCHOOL ? "保育園の年長（5さい）" : `小学${grade}年生`}`,
    ...subjectsFor(grade).map((s) =>
      s === "english" && input.eiken
        ? `英語: ${eikenLabel(input.eiken)}（${EIKEN_SCOPE[input.eiken]}）、難しさ: ${describeEikenLevel(input.levels[s])}`
        : `${subjectName(s, grade)}の難しさ: ${describeLevel(input.levels[s])}`,
    ),
    "",
    "出題枠:",
    ...slotIndexes.map((i) => {
      const s = input.slots[i];
      return `- slot ${i}: ${subjectName(s.subject, grade)}「${s.unit.name}」（${s.unit.guide}）`;
    }),
  ];
  if (input.recentPrompts.length) {
    lines.push("", "最近出した問題（同じものは出さない）:", ...input.recentPrompts.map((p) => `- ${p}`));
  }
  return lines.join("\n");
}

function toQuestion(raw: RawQuestion, slot: Slot, random: () => number): Question {
  const answer = raw.answer.trim();
  const choices = raw.format === "choice" ? shuffle(raw.choices.map((c) => c.trim()), random) : [];
  return {
    subject: slot.subject,
    unit: slot.unit.id,
    difficulty: slot.difficulty,
    format: raw.format,
    prompt: raw.prompt.trim(),
    choices,
    answer,
    expression: slot.subject === "math" ? raw.expression.trim() : "",
    hint: raw.hint.trim(),
    explanation: raw.explanation.trim(),
    speech: raw.speech.trim(),
    source: "ai",
  };
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

/** 指定した枠の問題をClaudeに作らせる。失敗したら理由を投げる */
async function requestQuestions(input: GenerateInput, slotIndexes: number[]): Promise<RawQuestion[]> {
  const response = await anthropic().beta.messages.parse({
    model: QUESTION_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(OutputSchema) },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMessage(input, slotIndexes) }],
  });
  if (response.stop_reason === "refusal") throw new Error(`refusal: ${response.stop_details?.category ?? "unknown"}`);
  if (response.stop_reason === "max_tokens") throw new Error("max_tokens に達しました");
  if (!response.parsed_output) throw new Error("出力を読み取れませんでした");
  return response.parsed_output.questions;
}

function describeError(e: unknown): string {
  if (e instanceof Anthropic.RateLimitError) return "rate limit";
  if (e instanceof Anthropic.AuthenticationError) return "APIキーが無効";
  if (e instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (e instanceof Anthropic.APIConnectionError) return "接続エラー";
  if (e instanceof Anthropic.APIError) return `API error ${e.status}: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}

/**
 * 出題枠ぶんの問題を作る。検証で落ちた枠だけ1回作り直し、それでもダメな枠はフォールバック問題にする。
 * API障害でも例外は投げず、必ず枠の数だけ問題を返す。
 */
export async function generateQuestions(
  input: GenerateInput,
  random: () => number = Math.random,
): Promise<GenerateResult> {
  const result: (Question | null)[] = input.slots.map(() => null);
  const rejected: GenerateResult["rejected"] = [];
  const failures: string[] = [];
  const prompts = new Set(input.recentPrompts);
  let pending = input.slots.map((_, i) => i);
  let requests = 0;

  for (let attempt = 0; attempt < 2 && pending.length > 0; attempt++) {
    requests++;
    let raws: RawQuestion[];
    try {
      raws = await requestQuestions(input, pending);
    } catch (e) {
      failures.push(describeError(e));
      // API自体が使えないときは作り直さずフォールバックへ
      if (!(e instanceof Error) || e instanceof Anthropic.APIError) break;
      continue;
    }
    for (const raw of raws) {
      if (!pending.includes(raw.slot) || result[raw.slot]) continue;
      const q = toQuestion(raw, input.slots[raw.slot], random);
      const errors = validateQuestion(q, input.grade);
      if (prompts.has(q.prompt)) errors.push("同じ問題文がある");
      if (errors.length) {
        rejected.push({ slot: raw.slot, prompt: q.prompt, errors });
        continue;
      }
      prompts.add(q.prompt);
      result[raw.slot] = q;
    }
    pending = pending.filter((i) => !result[i]);
  }

  const aiCount = result.filter(Boolean).length;
  const questions = result.map(
    (q, i) => q ?? fallbackQuestion(input.slots[i], input.grade, random),
  );
  return { questions, aiCount, requests, rejected, failures };
}
