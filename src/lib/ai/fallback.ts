import { shuffle, type Question } from "@/lib/game/question";
import type { Slot } from "./generate";

/**
 * AIが使えないとき用の問題。算数はコードで作り、英語・理科・ひらがなは固定の問題集から出す。
 * 保育園〜2年生の漢字チェックに通るよう、文章は ひらがなだけで書く。
 * 単元の成績を乱さないよう、unit は "fallback-*" にする。
 */
export function fallbackQuestion(slot: Slot, grade: number, random: () => number = Math.random): Question {
  const base = { difficulty: slot.difficulty, source: "fallback" as const, speech: "", expression: "" };
  switch (slot.subject) {
    case "math":
      return { ...base, subject: "math", unit: "fallback-math", ...mathQuestion(grade, random) };
    case "english":
      return { ...base, subject: "english", unit: "fallback-english", ...englishQuestion(grade, random) };
    case "japanese":
      return { ...base, subject: "japanese", unit: "fallback-japanese", ...hiraganaQuestion(random) };
    case "science":
      return { ...base, subject: "science", unit: "fallback-science", ...scienceQuestion(grade, random) };
  }
}

type Body = Pick<Question, "format" | "prompt" | "choices" | "answer" | "expression" | "hint" | "explanation"> &
  Partial<Pick<Question, "speech">>;

const int = (random: () => number, min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T,>(random: () => number, items: T[]) => items[Math.floor(random() * items.length)];

/** 正解とかぶらない、それらしい まちがいの数を3つ作る */
function numberChoices(answer: number, candidates: number[], random: () => number): string[] {
  const wrong = [...new Set(candidates.filter((n) => n !== answer && n >= 0 && Number.isInteger(n)))];
  for (let d = 1; wrong.length < 3; d++) {
    for (const n of [answer + d, answer - d]) if (n >= 0 && !wrong.includes(n) && wrong.length < 3) wrong.push(n);
  }
  return shuffle([answer, ...shuffle(wrong, random).slice(0, 3)].map(String), random);
}

function mathQuestion(grade: number, random: () => number): Body {
  if (grade === 0) return random() < 0.6 ? countEmoji(random) : addEmoji(random);
  if (grade <= 1) return random() < 0.5 ? addition(random, 1, 9) : subtraction(random, 11, 18, 1, 9);
  if (grade === 2) {
    const r = random();
    if (r < 0.35) return addition(random, 12, 69);
    if (r < 0.7) return subtraction(random, 30, 99, 11, 29);
    return kuku(random);
  }
  if (grade <= 4) return random() < 0.5 ? multiply2x1(random) : division(random);
  return random() < 0.5 ? decimalTimes(random) : percent(random);
}

const COUNT_EMOJI = ["🍎", "🐶", "⭐", "🚗", "🌷", "🐟", "🍙", "🎈"];

/** 絵文字を数える（保育園） */
function countEmoji(random: () => number): Body {
  const e = pick(random, COUNT_EMOJI);
  const n = int(random, 2, 9);
  return {
    format: "choice",
    prompt: `${e.repeat(n)}\nいくつ あるかな？ ワン！`,
    choices: numberChoices(n, [n - 1, n + 1, n + 2], random),
    answer: String(n),
    expression: String(n),
    hint: "ゆびで ひとつずつ さしながら かぞえてみよう！",
    explanation: `ぜんぶで ${n}こ だよ。`,
  };
}

/** 絵文字で あわせて いくつ（保育園・こたえは5まで） */
function addEmoji(random: () => number): Body {
  const e = pick(random, COUNT_EMOJI);
  const a = int(random, 1, 3);
  const b = int(random, 1, 5 - a);
  return {
    format: "choice",
    prompt: `${e.repeat(a)} と ${e.repeat(b)}\nあわせて いくつ？`,
    choices: numberChoices(a + b, [a, b, a + b + 1], random),
    answer: String(a + b),
    expression: `${a}+${b}`,
    hint: "ぜんぶ まとめて、はじめから かぞえてみよう！",
    explanation: `${a}こ と ${b}こ で、あわせて ${a + b}こ だよ。`,
  };
}

function addition(random: () => number, min: number, max: number): Body {
  const a = int(random, min, max);
  const b = int(random, min, max);
  return {
    format: "number",
    prompt: `${a} + ${b} は いくつ？ ワン！`,
    choices: [],
    answer: String(a + b),
    expression: `${a}+${b}`,
    hint: "一のくらいから じゅんばんに たしてみよう！",
    explanation: `${a} + ${b} = ${a + b} だよ。`,
  };
}

function subtraction(random: () => number, aMin: number, aMax: number, bMin: number, bMax: number): Body {
  const a = int(random, aMin, aMax);
  const b = int(random, bMin, Math.min(bMax, a));
  return {
    format: "number",
    prompt: `${a} − ${b} は いくつ？`,
    choices: [],
    answer: String(a - b),
    expression: `${a}-${b}`,
    hint: "たりない ときは となりの くらいから かりてこよう！",
    explanation: `${a} − ${b} = ${a - b} だよ。`,
  };
}

function kuku(random: () => number): Body {
  const a = int(random, 2, 9);
  const b = int(random, 2, 9);
  return {
    format: "choice",
    prompt: `${a} × ${b} は いくつかな？`,
    choices: numberChoices(a * b, [a * (b + 1), a * (b - 1), (a + 1) * b, a + b], random),
    answer: String(a * b),
    expression: `${a}*${b}`,
    hint: `${a}の だんの くくを となえてみよう！`,
    explanation: `${a} × ${b} = ${a * b} だよ。`,
  };
}

function multiply2x1(random: () => number): Body {
  const a = int(random, 12, 49);
  const b = int(random, 3, 9);
  return {
    format: "number",
    prompt: `${a} × ${b} を けいさんしてね！`,
    choices: [],
    answer: String(a * b),
    expression: `${a}*${b}`,
    hint: "十のくらいと 一のくらいに わけて かけてみよう！",
    explanation: `${a} × ${b} = ${a * b} だよ。`,
  };
}

function division(random: () => number): Body {
  const b = int(random, 3, 9);
  const q = int(random, 4, 12);
  return {
    format: "number",
    prompt: `${b * q} ÷ ${b} は いくつ？`,
    choices: [],
    answer: String(q),
    expression: `${b * q}/${b}`,
    hint: `${b}の だんの くくで、こたえが ${b * q}に なるのは？`,
    explanation: `${b} × ${q} = ${b * q} だから、${b * q} ÷ ${b} = ${q} だよ。`,
  };
}

function decimalTimes(random: () => number): Body {
  const tenths = int(random, 12, 49);
  const b = int(random, 3, 8);
  const a = tenths / 10;
  const answer = (tenths * b) / 10;
  return {
    format: "number",
    prompt: `${a} × ${b} を けいさんしてね！`,
    choices: [],
    answer: String(answer),
    expression: `${a}*${b}`,
    hint: "小数点を ないものとして かけてから、小数点を うとう！",
    explanation: `${tenths} × ${b} = ${tenths * b} だから、${a} × ${b} = ${answer} だよ。`,
  };
}

function percent(random: () => number): Body {
  const whole = pick(random, [200, 300, 400, 500, 600, 800, 1000]);
  const rate = pick(random, [10, 20, 25, 30, 50]);
  const answer = (whole * rate) / 100;
  return {
    format: "choice",
    prompt: `${whole}円の ${rate}% は 何円かな？`,
    choices: numberChoices(answer, [whole * rate, whole / rate, whole - answer, answer * 10], random),
    answer: String(answer),
    expression: `${whole}*${rate}/100`,
    hint: `${rate}% は、小数で あらわすと いくつかな？`,
    explanation: `${rate}% = ${rate / 100} だから、${whole} × ${rate / 100} = ${answer}円 だよ。`,
  };
}

/** 読み上げを聞いて絵文字を選ぶ（低学年） */
const LISTENING: { group: string; items: [word: string, emoji: string][] }[] = [
  {
    group: "animal",
    items: [["dog", "🐶"], ["cat", "🐱"], ["bird", "🐦"], ["fish", "🐟"], ["rabbit", "🐰"], ["bear", "🐻"], ["lion", "🦁"], ["pig", "🐷"]],
  },
  {
    group: "food",
    items: [["apple", "🍎"], ["banana", "🍌"], ["grapes", "🍇"], ["milk", "🥛"], ["bread", "🍞"], ["egg", "🥚"], ["cake", "🍰"]],
  },
  {
    group: "color",
    items: [["red", "🔴"], ["blue", "🔵"], ["yellow", "🟡"], ["green", "🟢"], ["purple", "🟣"], ["orange", "🟠"]],
  },
];

/** 英単語の意味を選ぶ（高学年） */
const MEANINGS: [word: string, meaning: string][] = [
  ["morning", "あさ"],
  ["teacher", "せんせい"],
  ["library", "としょかん"],
  ["Monday", "げつようび"],
  ["swim", "およぐ"],
  ["delicious", "おいしい"],
  ["birthday", "たんじょうび"],
  ["sunny", "はれ"],
  ["music", "おんがく"],
  ["kitchen", "だいどころ"],
  ["summer", "なつ"],
  ["station", "えき"],
];

function englishQuestion(grade: number, random: () => number): Body {
  if (grade <= 3) {
    const { items } = pick(random, LISTENING);
    const [word, emoji] = pick(random, items);
    const others = shuffle(items.filter(([w]) => w !== word), random).slice(0, 3).map(([, e]) => e);
    return {
      format: "choice",
      prompt: "よみあげを きいてね！ どれの ことかな？",
      choices: shuffle([emoji, ...others], random),
      answer: emoji,
      expression: "",
      speech: word,
      hint: "スピーカーの ボタンで もういちど きけるよ！",
      explanation: `「${word}」は ${emoji} の ことだよ。`,
    };
  }
  const [word, meaning] = pick(random, MEANINGS);
  const others = shuffle(MEANINGS.filter(([w]) => w !== word), random).slice(0, 3).map(([, m]) => m);
  return {
    format: "choice",
    prompt: `「${word}」は どういう いみかな？`,
    choices: shuffle([meaning, ...others], random),
    answer: meaning,
    expression: "",
    speech: word,
    hint: "その ことばを どんな ときに つかうか そうぞうしてみよう！",
    explanation: `「${word}」は「${meaning}」という いみだよ。`,
  };
}

/** かたちの にている ひらがな（保育園の「おなじ もじ」） */
const SIMILAR_KANA = [
  ["あ", "お", "め", "ぬ"],
  ["さ", "ち", "き", "そ"],
  ["わ", "ね", "れ", "ぬ"],
  ["は", "ほ", "け", "に"],
  ["る", "ろ", "そ", "ら"],
  ["い", "こ", "り", "け"],
];

/** 絵とことば（保育園の「えと ことば」） */
const PICTURE_WORDS: [emoji: string, word: string][] = [
  ["🐶", "いぬ"],
  ["🐱", "ねこ"],
  ["🐟", "さかな"],
  ["🍎", "りんご"],
  ["🐘", "ぞう"],
  ["🚗", "くるま"],
  ["🌙", "つき"],
  ["🍓", "いちご"],
];

function hiraganaQuestion(random: () => number): Body {
  if (random() < 0.5) {
    const group = pick(random, SIMILAR_KANA);
    const kana = pick(random, group);
    return {
      format: "choice",
      prompt: `「${kana}」と おなじ もじは どれかな？`,
      choices: shuffle(group, random),
      answer: kana,
      expression: "",
      hint: "かたちを よーく みて、くらべてみよう！",
      explanation: `「${kana}」と おなじ かたちの もじは「${kana}」だよ。`,
    };
  }
  const [emoji, word] = pick(random, PICTURE_WORDS);
  const others = shuffle(PICTURE_WORDS.filter(([, w]) => w !== word), random).slice(0, 3).map(([, w]) => w);
  return {
    format: "choice",
    prompt: `${emoji} これは なあに？`,
    choices: shuffle([word, ...others], random),
    answer: word,
    expression: "",
    hint: "さいしょの もじの おとを かんがえてみよう！",
    explanation: `${emoji} は「${word}」だよ。`,
  };
}

type Quiz = { prompt: string; answer: string; wrong: [string, string, string]; hint: string; explanation: string };

/** 1〜2年生（生活科）の理科 */
const SCIENCE_LOWER: Quiz[] = [
  {
    prompt: "🌻 ひまわりの はなが さくのは どの きせつかな？",
    answer: "なつ",
    wrong: ["はる", "あき", "ふゆ"],
    hint: "あつい ひに おおきな はなを みたことが あるかな？",
    explanation: "ひまわりは あつい なつに さく はなだよ。",
  },
  {
    prompt: "🌸 さくらの はなが さくのは どの きせつかな？",
    answer: "はる",
    wrong: ["なつ", "あき", "ふゆ"],
    hint: "にゅうがくしきの ころを おもいだしてみよう！",
    explanation: "さくらは あたたかく なる はるに さくよ。",
  },
  {
    prompt: "おたまじゃくしは おおきく なると なにに なるかな？",
    answer: "🐸",
    wrong: ["🐟", "🐢", "🦆"],
    hint: "あしが はえて、しっぽが なくなるよ！",
    explanation: "おたまじゃくしは カエルの こどもだよ。",
  },
  {
    prompt: "あおむしは さなぎに なった あと なにに なるかな？",
    answer: "🦋",
    wrong: ["🐝", "🐞", "🐜"],
    hint: "はねを ひらいて ひらひら とぶよ！",
    explanation: "あおむしは さなぎに なって、そのあと チョウに なるよ。",
  },
  {
    prompt: "じしゃくに くっつく ものは どれかな？",
    answer: "てつの クリップ",
    wrong: ["けしゴム", "かみの ノート", "ガラスの コップ"],
    hint: "じしゃくは てつで できた ものが すきだよ！",
    explanation: "じしゃくは てつで できた ものに くっつくよ。",
  },
  {
    prompt: "あさがおの たねを まくと、さいしょに でてくるのは どれかな？",
    answer: "め",
    wrong: ["はな", "み", "つる"],
    hint: "つちの なかから ちいさく でてくるよ！",
    explanation: "たねから さいしょに めが でて、だんだん おおきく なるよ。",
  },
  {
    prompt: "🍁 はっぱが あかや きいろに なるのは どの きせつかな？",
    answer: "あき",
    wrong: ["はる", "なつ", "ふゆ"],
    hint: "どんぐりが おちている ころだよ！",
    explanation: "あきに なると はっぱが あかや きいろに なるよ。",
  },
  {
    prompt: "ダンゴムシを さわると どう なるかな？",
    answer: "まるく なる",
    wrong: ["そらを とぶ", "おおきく なる", "いろが かわる"],
    hint: "なまえに ヒントが あるよ！",
    explanation: "ダンゴムシは びっくりすると まるく なって からだを まもるよ。",
  },
];

/** 3〜6年生の理科 */
const SCIENCE_UPPER: Quiz[] = [
  {
    prompt: "こん虫の あしは なん本かな？",
    answer: "6本",
    wrong: ["4本", "8本", "10本"],
    hint: "アリや チョウの あしを おもいだしてみよう！",
    explanation: "こん虫の あしは 6本で、むねから でているよ。",
  },
  {
    prompt: "こん虫の からだは いくつの ぶぶんに わかれているかな？",
    answer: "3つ",
    wrong: ["2つ", "4つ", "5つ"],
    hint: "あたま・むね・…あと ひとつは？",
    explanation: "こん虫の からだは あたま・むね・はらの 3つに わかれているよ。",
  },
  {
    prompt: "じしゃくに つくのは どれかな？",
    answer: "てつ",
    wrong: ["アルミニウム", "どう", "ガラス"],
    hint: "きんぞくでも じしゃくに つかない ものが あるよ！",
    explanation: "じしゃくに つくのは てつだよ。アルミニウムや どうは つかないよ。",
  },
  {
    prompt: "水が こおりに なるのは なん ℃ かな？",
    answer: "0℃",
    wrong: ["10℃", "50℃", "100℃"],
    hint: "ふゆの さむい あさの いけを おもいだしてみよう！",
    explanation: "水は 0℃で こおりに なるよ。100℃は ふっとうする おんどだよ。",
  },
  {
    prompt: "かげが できるのは、たいようから みて どちら がわかな？",
    answer: "はんたいがわ",
    wrong: ["おなじ がわ", "まうえ", "どこにも できない"],
    hint: "ひかりが さえぎられた ところが かげに なるよ！",
    explanation: "かげは たいようの はんたいがわに できるよ。",
  },
  {
    prompt: "ものが もえる ときに ひつような ものは どれかな？",
    answer: "さんそ",
    wrong: ["ちっそ", "にさんかたんそ", "水じょうき"],
    hint: "わたしたちが いきを するときにも つかう ものだよ！",
    explanation: "ものが もえるには さんそが ひつようだよ。",
  },
  {
    prompt: "ふりこが 1おうふく する じかんを かえるには、なにを かえると いいかな？",
    answer: "ふりこの ながさ",
    wrong: ["おもりの おもさ", "ふれはば", "おもりの いろ"],
    hint: "ブランコの くさりが ながいと、ゆっくり ゆれるね！",
    explanation: "ふりこが 1おうふく する じかんは、ふりこの ながさで きまるよ。",
  },
  {
    prompt: "でんきを とおす ものは どれかな？",
    answer: "アルミはく",
    wrong: ["わりばし", "ゴム", "プラスチック"],
    hint: "きんぞくで できた ものを さがそう！",
    explanation: "アルミはくは きんぞくなので でんきを とおすよ。",
  },
];

function scienceQuestion(grade: number, random: () => number): Body {
  const quiz = pick(random, grade <= 2 ? SCIENCE_LOWER : SCIENCE_UPPER);
  return {
    format: "choice",
    prompt: quiz.prompt,
    choices: shuffle([quiz.answer, ...quiz.wrong], random),
    answer: quiz.answer,
    expression: "",
    hint: quiz.hint,
    explanation: quiz.explanation,
  };
}
