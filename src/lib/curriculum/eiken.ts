import { unitsFor, type Subject, type Unit } from "./units";

/** 英語を学年ではなく英検の級で出すときの級 */
export const EIKEN_GRADES = ["5", "4", "3", "pre2", "2"] as const;
export type EikenGrade = (typeof EIKEN_GRADES)[number];

export function parseEikenGrade(input: unknown): EikenGrade | null {
  return EIKEN_GRADES.find((g) => g === input) ?? null;
}

/** 画面とAIへの指示に使う級の名前 */
export function eikenLabel(grade: EikenGrade): string {
  return grade === "pre2" ? "英検準2級" : `英検${grade}級`;
}

/** AIへの指示に使う、その級のレベルの目安 */
export const EIKEN_SCOPE: Record<EikenGrade, string> = {
  "5": "中学1年程度。語いは約600語。be動詞・一般動詞・can・現在進行形・疑問詞",
  "4": "中学2年程度。語いは約1300語。過去形・未来・比較・不定詞・動名詞",
  "3": "中学卒業程度。語いは約2100語。現在完了・受け身・関係代名詞・間接疑問",
  pre2: "高校中級程度。語いは約3600語。分詞・関係副詞・仮定法・熟語",
  "2": "高校卒業程度。語いは約5000語。分詞構文・仮定法・やや難しい熟語・社会的な話題",
};

/**
 * 級ごとの単元。英検の筆記（語い・文法・会話文・読解）とリスニングに合わせる。
 * id は成績集計に使うので変更しないこと。
 */
export const EIKEN_UNITS: Record<EikenGrade, Unit[]> = {
  "5": [
    { id: "k5-words", name: "語い", guide: "身の回りの単語（家族・学校・食べ物・時間・曜日・月）を空らんに入れる" },
    { id: "k5-be-do", name: "be動詞と一般動詞", guide: "am / is / are と do / does の使い分け、否定文・疑問文" },
    { id: "k5-wh", name: "疑問詞", guide: "what / who / where / when / how many / what time の疑問文と答え" },
    { id: "k5-can-ing", name: "canと現在進行形", guide: "I can 〜. Can you 〜? / I am 〜ing." },
    { id: "k5-talk", name: "会話文", guide: "2人の短い会話の空らんに合う応答を選ぶ" },
    { id: "k5-listen", name: "リスニング", guide: "読み上げた短い文や質問を聞いて、合う答えを選ぶ" },
  ],
  "4": [
    { id: "k4-words", name: "語い・熟語", guide: "中学2年までの単語と、get up / look for のような熟語" },
    { id: "k4-past", name: "過去形", guide: "規則・不規則動詞の過去形、was / were、過去進行形" },
    { id: "k4-future", name: "未来", guide: "will と be going to" },
    { id: "k4-compare", name: "比較", guide: "-er / -est、more / most、as 〜 as" },
    { id: "k4-to-ing", name: "不定詞・動名詞", guide: "want to 〜、enjoy 〜ing、to 〜 の3用法" },
    { id: "k4-talk", name: "会話文", guide: "2人の会話の空らんに合う応答を選ぶ" },
    { id: "k4-read", name: "読解", guide: "2〜3文の短いお知らせやメモを読んで答える" },
    { id: "k4-listen", name: "リスニング", guide: "読み上げた会話や文を聞いて、合う答えを選ぶ" },
  ],
  "3": [
    { id: "k3-words", name: "語い・熟語", guide: "中学卒業までの単語と熟語" },
    { id: "k3-perfect", name: "現在完了", guide: "経験・継続・完了、have been to、for / since" },
    { id: "k3-passive", name: "受け身", guide: "be + 過去分詞、by 〜" },
    { id: "k3-relative", name: "関係代名詞", guide: "who / which / that" },
    { id: "k3-indirect", name: "間接疑問・不定詞の発展", guide: "I know where he lives. / It is 〜 for A to 〜. / tell A to 〜" },
    { id: "k3-talk", name: "会話文", guide: "会話の空らんに合う文を選ぶ" },
    { id: "k3-read", name: "読解", guide: "3文くらいのEメールや説明文を読んで答える" },
    { id: "k3-listen", name: "リスニング", guide: "読み上げた会話や文を聞いて、合う答えを選ぶ" },
  ],
  pre2: [
    { id: "kp2-words", name: "語い", guide: "高校中級の単語（名詞・動詞・形容詞）を空らんに入れる" },
    { id: "kp2-idioms", name: "熟語", guide: "take part in / put off / make sure のような熟語" },
    { id: "kp2-participle", name: "分詞・関係副詞", guide: "名詞を修飾する分詞、where / when / why" },
    { id: "kp2-subjunctive", name: "仮定法", guide: "If I were 〜, I would 〜. / I wish 〜." },
    { id: "kp2-talk", name: "会話文", guide: "会話の空らんに合う文を選ぶ" },
    { id: "kp2-read", name: "読解", guide: "3文くらいの説明文を読んで、内容に合うものを選ぶ" },
    { id: "kp2-listen", name: "リスニング", guide: "読み上げた会話や文を聞いて、合う答えを選ぶ" },
  ],
  "2": [
    { id: "k2-words", name: "語い", guide: "高校卒業程度の単語。社会・科学・環境の話題も" },
    { id: "k2-idioms", name: "熟語", guide: "come up with / be likely to / in terms of のような熟語" },
    { id: "k2-grammar", name: "文法", guide: "分詞構文・仮定法過去完了・強調構文・倒置" },
    { id: "k2-talk", name: "会話文", guide: "会話の空らんに合う文を選ぶ" },
    { id: "k2-read", name: "読解", guide: "3文くらいの説明文を読んで、内容に合うものを選ぶ" },
    { id: "k2-listen", name: "リスニング", guide: "読み上げた文を聞いて、内容に合うものを選ぶ" },
  ],
};

/** 科目レベル(1〜10)を級の中の難しさの目安に言いかえる（AIへの指示用） */
export function describeEikenLevel(level: number): string {
  if (level <= 2) return "その級の やさしめ（1つ下の級のふく習〜その級の入り口）";
  if (level <= 4) return "その級の基本";
  if (level <= 7) return "その級の標準（合格ラインくらい）";
  return "その級の難しめ（合格ラインより上〜1つ上の級の入り口）";
}

/** 出題に使う単元。英検の級が決まっていれば、英語は級の単元にする */
export function courseUnits(grade: number, subject: Subject, eiken: EikenGrade | null): Unit[] {
  return subject === "english" && eiken ? EIKEN_UNITS[eiken] : unitsFor(grade, subject);
}

export function findEikenUnit(id: string): Unit | undefined {
  return Object.values(EIKEN_UNITS)
    .flat()
    .find((u) => u.id === id);
}
