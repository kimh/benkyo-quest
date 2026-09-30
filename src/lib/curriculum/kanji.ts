/**
 * 学年別漢字配当表（2020年度〜）。低学年の問題文チェックに使う。
 * 3年生以上は範囲が広くAIの指示だけで十分なので、チェックは2年生までに限る。
 */
const KANJI_BY_GRADE: Record<number, string> = {
  1: "一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六",
  2: "引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話",
};

export const KANJI_CHECK_MAX_GRADE = 2;

const KANJI = /\p{Script=Han}/gu;

/** その学年までに習う漢字以外を返す。チェック対象外の学年なら常に空 */
export function unlearnedKanji(text: string, grade: number): string[] {
  if (grade > KANJI_CHECK_MAX_GRADE) return [];
  let allowed = "";
  for (let g = 1; g <= grade; g++) allowed += KANJI_BY_GRADE[g];
  const found = text.match(KANJI) ?? [];
  return [...new Set(found.filter((c) => !allowed.includes(c)))];
}
