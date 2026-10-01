/** 1位・2位・3位のメダル */
export const MEDALS = [
  { icon: "💎", label: "ダイアモンド" },
  { icon: "🥇", label: "ゴールド" },
  { icon: "🥈", label: "シルバー" },
] as const;

/** ランキングに出す上位の順位 */
export const RANKING_TOP = MEDALS.length;

export type PlayerScore = { playerId: number; name: string; answered: number; correct: number };
export type RankRow = { playerId: number; name: string; value: number; rank: number };

/** 多い順にならべる。同じ数は同じ順位（1,1,3）、同じ順位の中は id 順。0 の人は のせない */
export function rankBy(scores: PlayerScore[], key: "answered" | "correct"): RankRow[] {
  const sorted = scores
    .filter((s) => s[key] > 0)
    .toSorted((a, b) => b[key] - a[key] || a.playerId - b.playerId);
  let rank = 0;
  return sorted.map((s, i) => {
    if (i === 0 || s[key] !== sorted[i - 1][key]) rank = i + 1;
    return { playerId: s.playerId, name: s.name, value: s[key], rank };
  });
}

/** 上位（同じ順位の人もふくむ）と、圏外なら自分の行 */
export function topWithSelf(
  ranked: RankRow[],
  selfId: number,
  top = RANKING_TOP,
): { top: RankRow[]; self: RankRow | null } {
  const shown = ranked.filter((r) => r.rank <= top);
  const self = shown.some((r) => r.playerId === selfId)
    ? null
    : (ranked.find((r) => r.playerId === selfId) ?? null);
  return { top: shown, self };
}

export function medalFor(rank: number): (typeof MEDALS)[number] | null {
  return MEDALS[rank - 1] ?? null;
}
