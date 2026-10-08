export type Subject = "math" | "english" | "japanese" | "science";

export type Unit = {
  id: string;
  name: string;
  /** AIへの出題の指示 */
  guide: string;
};

type Curriculum = Record<number, Partial<Record<Subject, Unit[]>>>;

/** 保育園（5さい・年長）は学年 0 として扱う */
export const PRESCHOOL = 0;

/**
 * 学年×科目の単元。想定ユーザーの2年生・5年生は細かく、それ以外は大まかに定義する。
 * 保育園は 算数のかわりに「かず」、英語のかわりに「ひらがな」を出す。
 * 理科は1〜2年生には無いので、生活科の内容（いきもの・しょくぶつ・きせつ）を「りか」として出す。
 * id は成績集計に使うので変更しないこと。
 */
export const CURRICULUM: Curriculum = {
  0: {
    math: [
      { id: "m0-count", name: "かぞえよう", guide: "絵文字を1〜10こ ならべて、いくつあるか数える（例: 🍎🍎🍎 は いくつ？）" },
      { id: "m0-more", name: "どっちが おおい", guide: "2つの絵文字のならびを くらべて、おおい・すくない方をえらぶ。選択肢は くらべる2つの絵文字。数は10まで" },
      { id: "m0-number", name: "すうじ", guide: "1〜10の すうじの よみかた（「ご」は どれ？ → 5）、つぎの かず・まえの かず" },
      { id: "m0-shape", name: "かたち", guide: "まる・さんかく・しかくを 絵文字（⚪🔺🟦 など）で えらぶ、にている かたちの ものを えらぶ" },
      { id: "m0-order", name: "じゅんばん", guide: "絵文字のならびで、まえから なんばんめ・なんばんめに いるのは だれ（5ばんめまで）" },
      { id: "m0-add", name: "あわせて いくつ", guide: "絵文字で あわせて いくつ（こたえは5まで）。例: 🐶🐶 と 🐶 で なんびき？" },
    ],
    japanese: [
      { id: "j0-match", name: "おなじ もじ", guide: "「あ」と おなじ もじを えらぶ。選択肢は かたちの にている ひらがなを まぜる" },
      { id: "j0-first", name: "さいしょの もじ", guide: "絵文字と ことば（🍎 りんご）の さいしょの もじを えらぶ" },
      { id: "j0-word", name: "えと ことば", guide: "絵文字を見て、あう ことば（ひらがな2〜3もじ）を えらぶ。例: 🐶 → いぬ" },
      { id: "j0-similar", name: "にている もじ", guide: "かたちの にている もじ（さ/ち、ぬ/め、わ/ね/れ、は/ほ、る/ろ）の 見分け" },
      { id: "j0-last", name: "おわりの もじ", guide: "絵文字と ことば（🐱 ねこ）の おわりの もじを えらぶ" },
      {
        id: "j0-listen",
        name: "きいて えらぼう",
        guide: "ことば（ひらがな2〜4もじ）を読み上げて、そのことばの ひらがなを えらぶ。例: 読み上げ「いちご」→ いちご / いちこ / いしご / りんご。ことばは 毎回 ちがう 身近な ことば（たべもの・どうぶつ・のりもの など）にする",
      },
      {
        id: "j0-listen-first",
        name: "きいて さいしょの もじ",
        guide: "ことばを読み上げて、さいしょの もじを えらぶ。例: 読み上げ「うさぎ」→ う / つ / く / ら。ことばは 毎回 ちがう 身近な ことばにする",
      },
    ],
  },
  1: {
    math: [
      { id: "m1-count", name: "かずと すうじ", guide: "20までの数の数え方・大小" },
      { id: "m1-add", name: "たしざん", guide: "くり上がりのある1けたのたし算まで" },
      { id: "m1-sub", name: "ひきざん", guide: "くり下がりのある ひき算まで（答えは1けた）" },
      { id: "m1-100", name: "100までの かず", guide: "100までの数の並び・何十" },
      { id: "m1-clock", name: "とけい", guide: "何時・何時半の読み方" },
    ],
    english: [
      { id: "e1-color", name: "いろ", guide: "red, blue などの色の単語。絵文字で答えさせる" },
      { id: "e1-animal", name: "どうぶつ", guide: "dog, cat などの動物の単語。絵文字で答えさせる" },
      { id: "e1-number", name: "かず", guide: "one〜ten" },
      { id: "e1-greeting", name: "あいさつ", guide: "Hello, Good morning, Thank you など" },
    ],
    science: [
      { id: "s1-flower", name: "あさがおを そだてよう", guide: "あさがおの そだち（たね→め→はっぱ→つる→はな→たね）、水やり" },
      { id: "s1-creature", name: "みぢかな いきもの", guide: "ありや だんごむし、きんぎょ、うさぎ など みぢかな いきものの すみか・たべもの・からだ" },
      { id: "s1-season", name: "きせつ", guide: "はる・なつ・あき・ふゆの はな・むし・くだもの・てんき・ようす（🌸🌻🍁⛄ など）" },
      { id: "s1-play", name: "しぜんで あそぼう", guide: "かげ・かぜ・水・おちば・どんぐり・いろみず など、しぜんの ものを つかった あそび" },
    ],
  },
  2: {
    math: [
      { id: "m2-add-col", name: "たし算の ひっ算", guide: "2けた・3けたのたし算（くり上がりあり）" },
      { id: "m2-sub-col", name: "ひき算の ひっ算", guide: "2けた・3けたのひき算（くり下がりあり）" },
      { id: "m2-1000", name: "1000までの 数", guide: "3けたの数の しくみ・大小・何十のたし算ひき算" },
      { id: "m2-length", name: "長さ", guide: "cm・mm・m の たんい と かんたんな計算" },
      { id: "m2-volume", name: "水の かさ", guide: "L・dL・mL の たんい" },
      { id: "m2-time", name: "時こくと 時間", guide: "時こくの読み方、何分後・何分前、1時間=60分" },
      { id: "m2-kuku", name: "かけ算（九九）", guide: "九九、かけ算の文しょうだい（〜が〜こずつ）" },
      { id: "m2-shapes", name: "三角形と 四角形", guide: "三角形・四角形・長方形・正方形・直角三角形の なかま分け、へんと ちょう点の数" },
      { id: "m2-fraction", name: "分数", guide: "1/2・1/4 など、もとの大きさを同じに分けた1つ分" },
      { id: "m2-10000", name: "10000までの 数", guide: "4けたの数の読み書き・大小" },
    ],
    english: [
      { id: "e2-color", name: "いろ", guide: "red, blue, yellow などの色。読み上げを聞いて絵文字（🔴🔵🟡）を選ぶ" },
      { id: "e2-animal", name: "どうぶつ", guide: "dog, cat, bird, fish などの動物。読み上げを聞いて絵文字を選ぶ" },
      { id: "e2-food", name: "たべもの", guide: "apple, banana, milk などの食べ物・くだもの。絵文字で答えさせる" },
      { id: "e2-number", name: "かず", guide: "one〜twenty。読み上げを聞いて数字を選ぶ" },
      { id: "e2-greeting", name: "あいさつ", guide: "Hello, Good morning, Good night, Thank you, See you などの場面にあう あいさつ" },
      { id: "e2-body", name: "からだ", guide: "head, hand, eye, nose, mouth などの体のぶぶん。絵文字で答えさせる" },
      { id: "e2-alphabet", name: "アルファベット", guide: "大文字 A〜Z の読み方・形（ABCの歌の順番）" },
    ],
    science: [
      { id: "s2-vegetable", name: "やさいを そだてよう", guide: "ミニトマト・ナス・キュウリ・ピーマンの そだち（たね/なえ→はな→み）、水やり、みの いろ" },
      { id: "s2-creature", name: "生きものと なかよし", guide: "ザリガニ・ダンゴムシ・カエル・バッタ・メダカ などの すみか・食べもの・せわの しかた" },
      { id: "s2-lifecycle", name: "生きものの 大きくなりかた", guide: "たまご→おたまじゃくし→カエル、たまご→よう虫→さなぎ→チョウ、たまご→ひよこ→ニワトリ の じゅんばん" },
      { id: "s2-season", name: "きせつと しぜん", guide: "きせつごとの 生きもの・草花・天気・木の ようすの へんか" },
      { id: "s2-toy", name: "うごく おもちゃ", guide: "風・ゴム・じしゃく・水で うごく おもちゃ。じしゃくに つく もの、ゴムを 長く のばすと とおくまで とぶ など" },
    ],
  },
  3: {
    math: [
      { id: "m3-mul", name: "かけ算", guide: "2けた×1けた、2けた×2けた" },
      { id: "m3-div", name: "わり算", guide: "九九を使うわり算、あまりのあるわり算" },
      { id: "m3-addsub", name: "たし算・ひき算", guide: "3けた・4けたのたし算ひき算" },
      { id: "m3-decimal", name: "小数", guide: "1/10の位までの小数のしくみとたし算ひき算" },
      { id: "m3-fraction", name: "分数", guide: "同じ分母の分数のしくみ、たし算ひき算" },
      { id: "m3-time", name: "時こくと時間", guide: "秒、時間の計算" },
    ],
    english: [
      { id: "e3-greeting", name: "あいさつ", guide: "Hello, How are you? I'm fine." },
      { id: "e3-number", name: "かず", guide: "1〜20、How many?" },
      { id: "e3-like", name: "すきなもの", guide: "I like 〜. Do you like 〜?" },
      { id: "e3-alphabet", name: "アルファベット", guide: "大文字" },
    ],
    science: [
      { id: "s3-insect", name: "こん虫", guide: "こん虫の体（頭・むね・はら、あし6本はむねから）、たまご→よう虫→さなぎ→せい虫、クモや ダンゴムシは こん虫ではない" },
      { id: "s3-plant", name: "植物の体と育ち", guide: "根・くき・葉、たね→め→花→実、子葉" },
      { id: "s3-shadow", name: "太陽とかげ", guide: "かげは太陽の反対がわにできる、太陽は東→南→西に動く、日なたと日かげの地面の温度" },
      { id: "s3-light", name: "光", guide: "かがみで光をはね返す、光を集めると明るく あたたかくなる、虫めがね" },
      { id: "s3-magnet", name: "じしゃく", guide: "鉄はじしゃくにつく（アルミ・銅・紙はつかない）、N極とS極、同じ極は しりぞけ合う" },
      { id: "s3-circuit", name: "電気の通り道", guide: "かん電池・豆電球・回路、電気を通すもの（金ぞく）と通さないもの" },
      { id: "s3-weight", name: "ものと重さ", guide: "形を変えても重さは同じ、同じ体積でも ものによって重さがちがう" },
      { id: "s3-sound", name: "音", guide: "音が出るものは ふるえている、大きい音ほど ふるえが大きい、糸電話" },
    ],
  },
  4: {
    math: [
      { id: "m4-div", name: "わり算", guide: "2けた・3けた÷1けた、÷2けた" },
      { id: "m4-large", name: "大きい数", guide: "億・兆" },
      { id: "m4-angle", name: "角", guide: "角度・分度器" },
      { id: "m4-decimal", name: "小数", guide: "1/100の位までの小数、小数×整数、小数÷整数" },
      { id: "m4-fraction", name: "分数", guide: "真分数・仮分数・帯分数、同じ分母のたし算ひき算" },
      { id: "m4-area", name: "面積", guide: "長方形・正方形の面積" },
    ],
    english: [
      { id: "e4-day", name: "曜日", guide: "Monday〜Sunday、What day is it?" },
      { id: "e4-time", name: "時こく", guide: "What time is it? It's 〜." },
      { id: "e4-want", name: "ほしいもの", guide: "What do you want? I want 〜." },
      { id: "e4-alphabet", name: "アルファベット", guide: "小文字" },
    ],
    science: [
      { id: "s4-body", name: "人の体のつくりと運動", guide: "ほね・きん肉・関節のはたらき" },
      { id: "s4-season", name: "季節と生き物", guide: "季節による動物の活動や植物の成長のちがい（ツバメ・ヘチマ・サクラ など）" },
      { id: "s4-weather", name: "天気と気温", guide: "晴れの日と雨の日の1日の気温の変化、百葉箱、温度計の読み方" },
      { id: "s4-water", name: "水のすがた", guide: "水は0℃でこおり、約100℃でふっとうする、水・氷・水じょう気、じょう発と結ろ" },
      { id: "s4-heat", name: "もののあたたまり方", guide: "金ぞく・水・空気のあたたまり方、あたためると体積がふえる" },
      { id: "s4-current", name: "電気のはたらき", guide: "かん電池の直列つなぎ・へい列つなぎ、電流の向き、モーター" },
      { id: "s4-moon-star", name: "月と星", guide: "月の形と動き、星の明るさと色、星座、夏の大三角" },
    ],
  },
  5: {
    math: [
      { id: "m5-decimal-mul", name: "小数のかけ算", guide: "小数×小数（積の小数点の位置）" },
      { id: "m5-decimal-div", name: "小数のわり算", guide: "小数÷小数、商とあまり" },
      { id: "m5-volume", name: "体積", guide: "直方体・立方体の体積、cm³・m³" },
      { id: "m5-integer", name: "整数の性質", guide: "偶数・奇数、倍数・公倍数、約数・公約数" },
      { id: "m5-fraction", name: "分数のたし算・ひき算", guide: "通分・約分、分母がちがう分数のたし算ひき算" },
      { id: "m5-fraction-decimal", name: "分数と小数", guide: "分数と小数・整数の関係、わり算の商を分数で表す" },
      { id: "m5-average", name: "平均", guide: "平均の求め方、平均から合計を求める" },
      { id: "m5-per-unit", name: "単位量あたりの大きさ", guide: "人口密度、1mあたりのねだん など" },
      { id: "m5-speed", name: "速さ", guide: "時速・分速・秒速、道のり・時間を求める" },
      { id: "m5-area", name: "図形の面積", guide: "平行四辺形・三角形・台形・ひし形の面積" },
      { id: "m5-percent", name: "割合", guide: "割合・百分率・歩合、もとにする量・比べられる量" },
      { id: "m5-angle", name: "図形の角", guide: "三角形の内角の和180°、四角形360°、多角形" },
      { id: "m5-circle", name: "正多角形と円", guide: "円周＝直径×3.14、正多角形の性質" },
    ],
    english: [
      { id: "e5-alphabet", name: "アルファベット", guide: "大文字・小文字の対応、単語の最初の文字" },
      { id: "e5-birthday", name: "たんじょう日", guide: "When is your birthday? My birthday is 〜. 月の名前(January〜December)と序数(first〜)" },
      { id: "e5-subject", name: "教科と曜日", guide: "What do you have on Monday? I have math. 教科名と曜日" },
      { id: "e5-can", name: "できること", guide: "I can 〜. Can you 〜? swim, cook, play the piano など" },
      { id: "e5-where", name: "場所・道案内", guide: "Where is 〜? in / on / under、go straight, turn right / left" },
      { id: "e5-order", name: "注文", guide: "What would you like? I'd like 〜. How much is it?" },
      { id: "e5-person", name: "人しょうかい", guide: "He / She is 〜. He can 〜. 家族・職業の単語" },
      { id: "e5-words", name: "英単語", guide: "身の回りの単語（天気・動物・食べ物・スポーツ・色）の意味" },
    ],
    science: [
      { id: "s5-germination", name: "発芽と成長", guide: "発芽に必要な条件（水・空気・適当な温度）、子葉のでんぷん、成長に必要な日光と肥料" },
      { id: "s5-flower", name: "花から実へ", guide: "おしべ・めしべ・花粉、受粉すると実ができる、アサガオ・ヘチマ" },
      { id: "s5-medaka", name: "メダカのたんじょう", guide: "メダカのおすとめすの見分け方、受精卵の育ち、けんび鏡の使い方" },
      { id: "s5-human", name: "人のたんじょう", guide: "子宮・たいばん・へそのお・羊水、約38週で生まれる" },
      { id: "s5-weather", name: "天気の変化", guide: "雲の量と天気、天気はおよそ西から東へ変わる、台風" },
      { id: "s5-river", name: "流れる水のはたらき", guide: "しん食・運ぱん・たい積、川の上流と下流の石のちがい、曲がった所の外側と内側" },
      { id: "s5-dissolve", name: "もののとけ方", guide: "水よう液、とけたものの重さはなくならない、水の量や温度ととける量、食塩とミョウバン" },
      { id: "s5-pendulum", name: "ふりこ", guide: "ふりこが1往復する時間は ふりこの長さで決まる（おもりの重さや ふれはばでは変わらない）" },
      { id: "s5-electromagnet", name: "電磁石", guide: "コイルと鉄しん、電流を流したときだけ磁石になる、極は電流の向きで変わる、強くする方法" },
    ],
  },
  6: {
    math: [
      { id: "m6-fraction", name: "分数のかけ算・わり算", guide: "分数×分数、分数÷分数" },
      { id: "m6-ratio", name: "比", guide: "比の値、等しい比" },
      { id: "m6-proportion", name: "比例と反比例", guide: "比例・反比例の式と表" },
      { id: "m6-circle", name: "円の面積", guide: "半径×半径×3.14" },
      { id: "m6-volume", name: "角柱と円柱の体積", guide: "底面積×高さ" },
      { id: "m6-case", name: "場合の数", guide: "並べ方・組み合わせ" },
    ],
    english: [
      { id: "e6-past", name: "思い出", guide: "I went to 〜. I enjoyed 〜. It was 〜." },
      { id: "e6-want", name: "将来の夢", guide: "What do you want to be? I want to be 〜." },
      { id: "e6-country", name: "国と文化", guide: "Where do you want to go? I want to go to 〜." },
      { id: "e6-words", name: "英単語", guide: "身の回りの単語の意味とつづり" },
    ],
    science: [
      { id: "s6-combustion", name: "ものの燃え方", guide: "ものが燃えるには酸素が必要、燃えると二酸化炭素ができる、石灰水" },
      { id: "s6-body", name: "人の体のはたらき", guide: "消化（だ液・胃・小腸）、呼吸（肺）、血液のじゅんかん（心ぞう）、じん臓" },
      { id: "s6-plant", name: "植物の養分と水", guide: "葉に日光が当たるとでんぷんができる、根から吸った水は葉から出ていく（蒸散）" },
      { id: "s6-ecosystem", name: "生物とかんきょう", guide: "食べる・食べられるの関係（食物連さ）、植物が酸素を出す、水のじゅんかん" },
      { id: "s6-moon", name: "月と太陽", guide: "月の形の見え方は月と太陽の位置関係で変わる、月の光っている側に太陽がある" },
      { id: "s6-earth", name: "土地のつくりと変化", guide: "地層（れき・砂・どろ）、化石、火山のふん火や地しんによる土地の変化" },
      { id: "s6-solution", name: "水よう液の性質", guide: "酸性・中性・アルカリ性、リトマス紙、金ぞくをとかす水よう液" },
      { id: "s6-lever", name: "てこ", guide: "支点・力点・作用点、てこのつり合い（おもりの重さ×支点からのきょり）" },
      { id: "s6-electricity", name: "電気の利用", guide: "発電（手回し発電機・光電池）、コンデンサーにためる、電気を光・音・熱・運動に変える、LED" },
    ],
  },
};

export function unitsFor(grade: number, subject: Subject): Unit[] {
  return CURRICULUM[grade]?.[subject] ?? CURRICULUM[2][subject] ?? CURRICULUM[PRESCHOOL][subject] ?? [];
}

/** その学年で出す科目。保育園は「かず」と「ひらがな」、小学生は算数・英語・理科 */
export function subjectsFor(grade: number): Subject[] {
  return grade === PRESCHOOL ? ["math", "japanese"] : ["math", "english", "science"];
}

/** 画面に出す科目名 */
export function subjectLabel(subject: Subject, grade: number): string {
  if (subject === "math") return grade === PRESCHOOL ? "かず" : "さんすう";
  if (subject === "science") return "りか";
  return subject === "english" ? "えいご" : "ひらがな";
}

/** AIへの指示に使う科目名 */
export function subjectName(subject: Subject, grade: number): string {
  if (subject === "math") return grade === PRESCHOOL ? "かず（数の学習）" : "算数";
  if (subject === "science") return grade <= 2 ? "理科（生活科の内容）" : "理科";
  return subject === "english" ? "英語" : "ひらがな";
}

/** 画面に出す学年名 */
export function gradeLabel(grade: number): string {
  return grade === PRESCHOOL ? "ほいくえん" : `${grade}ねんせい`;
}

export function findUnit(grade: number, subject: Subject, id: string): Unit | undefined {
  return unitsFor(grade, subject).find((u) => u.id === id);
}

/** 科目レベル(1〜10)を学年内の難しさの目安に言いかえる（AIへの指示用） */
export function describeLevel(level: number): string {
  if (level <= 2) return "やさしめ（前の学年のふく習〜その学年の入り口）";
  if (level <= 4) return "その学年の基本";
  if (level <= 7) return "その学年の標準〜少し応用";
  return "発展（その学年の応用問題〜次の学年の入り口）";
}
