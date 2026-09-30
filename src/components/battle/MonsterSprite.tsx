"use client";

import { useState } from "react";
import type { Monster, MonsterPose } from "@/lib/game/monsters";

/** 画像の比率（212×140） */
const ASPECT = 212 / 140;

/** 画像が無かったモンスター（演出で作り直しても、もう一度読みにいかない） */
const missing = new Set<string>();

/** モンスターの画像。読めなければ絵文字で代用する */
export function MonsterSprite({ monster, pose, height }: { monster: Monster; pose: MonsterPose; height: number }) {
  const [, rerender] = useState(0);
  const src = `/assets/monsters/${monster.id}-${pose}.png`;

  if (missing.has(src)) {
    return (
      <span role="img" aria-label={monster.name} style={{ fontSize: height * 0.8, lineHeight: 1 }}>
        {monster.emoji}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={monster.name}
      width={Math.round(height * ASPECT)}
      height={height}
      className="select-none"
      draggable={false}
      onError={() => {
        missing.add(src);
        rerender((n) => n + 1);
      }}
    />
  );
}

/** 3つのポーズを先に読んでおき、切り替えたときに一瞬消えないようにする */
export function preloadMonster(monster: Monster) {
  for (const pose of ["idle", "attack", "damage"] as const) {
    const img = new Image();
    img.src = `/assets/monsters/${monster.id}-${pose}.png`;
  }
}
