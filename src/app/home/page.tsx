import Link from "next/link";
import { redirect } from "next/navigation";
import { Knock } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelLink } from "@/components/PixelButton";
import { RankingWindow } from "@/components/RankingWindow";
import { gradeLabel } from "@/lib/curriculum/units";
import { jstDate } from "@/lib/date";
import { currentStreak, expToNextLevel } from "@/lib/game/player";
import { currentPlayer, gemBalance } from "@/lib/players";
import { getRanking } from "@/lib/ranking";

export default async function HomePage() {
  const player = await currentPlayer();
  if (!player) redirect("/setup");

  const [gems, ranking] = await Promise.all([gemBalance(player.id), getRanking(player.id)]);
  const streak = currentStreak(player.streakDays, player.lastClearedDate, jstDate());
  const nextExp = expToNextLevel(player.playerLevel);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4">
      <section className="rpg-window grid grid-cols-2 gap-x-4 gap-y-1 p-4 text-lg">
        <div className="col-span-2 text-2xl text-accent">{player.name}</div>
        <div>Lv {player.playerLevel}</div>
        <div className="text-right">{gradeLabel(player.grade)}</div>
        <div className="col-span-2">
          <div className="flex justify-between text-sm">
            <span>EXP</span>
            <span>
              {player.exp} / {nextExp}
            </span>
          </div>
          <div className="h-3 border-2 border-white">
            <div className="h-full bg-ok" style={{ width: `${Math.min(100, (player.exp / nextExp) * 100)}%` }} />
          </div>
        </div>
        <div className="mt-2 text-gem">💎 {gems} Gem</div>
        <div className="mt-2 text-right">🔥 {streak}にち れんぞく</div>
      </section>

      <RankingWindow ranking={ranking} selfId={player.id} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Knock mood="waving" height={192} />
        <MessageWindow speaker="ノック" text={`${player.name}、きょうの クエストに いこう！`} />
      </div>

      <nav className="flex flex-col gap-3">
        <PixelLink href="/quest" variant="accent">
          ⚔ きょうの クエスト
        </PixelLink>
        <PixelLink href="/gems">💎 Gem こうかん</PixelLink>
      </nav>

      <Link href="/parent" className="self-center text-sm text-white/50 underline">
        おうちの人へ
      </Link>
    </main>
  );
}
