/**
 * マスコットのノックの表情。public/assets/knock/{mood}.png（308×429・足元を下中央にそろえた透過PNG）に対応する。
 *
 * ゲーム内での使い分け:
 * - neutral   … 出題
 * - waving    … あいさつ・ホーム画面
 * - cheering  … 正解
 * - love      … ボス撃破・レベルアップ
 * - winking   … ヒントを出すとき
 * - confused  … 問題を考え中（生成待ち）
 * - surprised … ボス登場
 * - angry     … モンスターの攻撃を受けたとき
 * - crying    … 再挑戦も不正解のとき（はげまし）
 * - sleepy    … 今日のクエストは終わり、また明日
 */
export type KnockMood =
  | "neutral"
  | "waving"
  | "cheering"
  | "love"
  | "winking"
  | "confused"
  | "surprised"
  | "angry"
  | "crying"
  | "sleepy";

type Props = {
  mood?: KnockMood;
  /** 表示する高さ(px)。幅は元画像の比率(308:429)に合わせる */
  height?: number;
  className?: string;
};

const ASPECT = 308 / 429;

export function Knock({ mood = "neutral", height = 192, className = "" }: Props) {
  return (
    // 表情の切り替えで一瞬消えないよう、最適化なしの <img> で直接読む
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/knock/${mood}.png`}
      alt="ノック"
      width={Math.round(height * ASPECT)}
      height={height}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
