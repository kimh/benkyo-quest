"use client";

import { Knock, type KnockMood } from "@/components/Knock";
import type { Monster, MonsterPose } from "@/lib/game/monsters";
import { MonsterSprite } from "./MonsterSprite";

/** いま再生中の演出 */
export type BattleAnim = "idle" | "appear" | "knockAttack" | "monsterAttack" | "defeat";

type Props = {
  monster: Monster;
  boss: boolean;
  /** 残りHP（0〜1） */
  hp: number;
  knockMood: KnockMood;
  anim: BattleAnim;
  /** 攻撃が当たったときに出す文字（「かいしん！」など） */
  popup?: string | null;
  /** 演出をやり直すためのキー（同じ演出が続くときも再生させる） */
  animKey: number;
};

/**
 * ファイナルファンタジー風の横向きバトル画面。左にノック、右にモンスター。
 */
export function BattleScene({ monster, boss, hp, knockMood, anim, popup, animKey }: Props) {
  const monsterHeight = boss ? 130 : 100;
  const pose: MonsterPose =
    anim === "monsterAttack" ? "attack" : anim === "knockAttack" || anim === "defeat" ? "damage" : "idle";
  const knockClass = anim === "knockAttack" ? "battle-lunge-right" : anim === "monsterAttack" ? "battle-shake" : "";
  const monsterClass =
    anim === "knockAttack"
      ? "battle-hit"
      : anim === "monsterAttack"
        ? "battle-lunge-left"
        : anim === "defeat"
          ? "battle-defeat"
          : anim === "appear"
            ? "battle-appear"
            : "battle-float";

  return (
    <div className="battle-field relative h-52 w-full overflow-hidden rounded-lg border-4 border-white">
      {/* モンスターの名前とHP */}
      <div className="rpg-window absolute top-2 right-2 z-10 min-w-36 px-3 py-1 text-sm">
        <div className={boss ? "text-danger" : ""}>
          {boss && "ボス "}
          {monster.name}
        </div>
        <div className="mt-1 h-2.5 border-2 border-white">
          <div
            className="h-full transition-[width] duration-500"
            style={{ width: `${hp * 100}%`, background: hp > 0.5 ? "var(--ok)" : hp > 0.2 ? "var(--accent)" : "var(--danger)" }}
          />
        </div>
      </div>

      {/* ノック（左） */}
      <div key={`k${animKey}`} className={`absolute bottom-3 left-4 z-10 ${knockClass}`}>
        <Knock mood={knockMood} height={120} />
      </div>

      {/* モンスター（右） */}
      <div key={`m${animKey}`} className={`absolute right-2 bottom-4 flex items-end justify-end ${monsterClass}`}>
        <MonsterSprite monster={monster} pose={pose} height={monsterHeight} />
      </div>

      {popup && (
        <div
          key={`p${animKey}`}
          className="battle-popup absolute right-10 bottom-20 z-20 text-2xl text-accent drop-shadow-[2px_2px_0_#000]"
        >
          {popup}
        </div>
      )}
    </div>
  );
}
