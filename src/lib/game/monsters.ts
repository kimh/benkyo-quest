/**
 * モンスターの一覧。画像は public/assets/monsters/{id}-{pose}.png（idle / attack / damage）。
 * 画像は左向き（ノックの方）・212×140 の透過PNG で、体を右下にそろえてある。
 * 画像が読めないときは emoji を大きく表示する。
 * 名前は保育園の子にも読み上げられるよう、ひらがな・カタカナだけにする。
 */
export type Monster = { id: string; name: string; emoji: string };

export type MonsterPose = "idle" | "attack" | "damage";

export const MINIONS: Monster[] = [
  { id: "pururin", name: "ぷるりん", emoji: "💧" },
  { id: "kinokoro", name: "キノコロ", emoji: "🍄" },
  { id: "barun", name: "バルン", emoji: "🦇" },
  { id: "hororu", name: "ホロル", emoji: "👻" },
  { id: "bunga", name: "ブンガ", emoji: "🐝" },
  { id: "merago", name: "メラゴ", emoji: "🔥" },
  { id: "bogora", name: "ボゴラ", emoji: "👺" },
];

export const BOSSES: Monster[] = [
  { id: "oruga", name: "オルガ", emoji: "👹" },
  { id: "garuga", name: "ガルガ", emoji: "🐺" },
  { id: "honekku", name: "ホネック", emoji: "💀" },
];

function hash(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0)!, 16777619);
  return h >>> 0;
}

/**
 * そのクエストに出るモンスター（雑魚3体＋ボス）。
 * 日付と回から決めるので、リロードしても同じモンスターが出る。
 */
export function monstersForQuest(date: string, round: number, minionCount = 3): { minions: Monster[]; boss: Monster } {
  let seed = hash(`${date}#${round}`);
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  const pool = [...MINIONS];
  const minions: Monster[] = [];
  for (let i = 0; i < minionCount && pool.length; i++) minions.push(pool.splice(next() % pool.length, 1)[0]);
  return { minions, boss: BOSSES[next() % BOSSES.length] };
}
