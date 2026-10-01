import { medalFor, type RankRow } from "@/lib/game/ranking";
import type { Ranking, RankingBoard } from "@/lib/ranking";

function Row({ row, selfId }: { row: RankRow; selfId: number }) {
  const medal = medalFor(row.rank);
  return (
    <li className={`flex items-baseline gap-1 ${row.playerId === selfId ? "text-accent" : ""}`}>
      <span className="w-7 shrink-0 text-center" title={medal?.label}>
        {medal ? medal.icon : `${row.rank}い`}
      </span>
      <span className="min-w-0 flex-1 truncate">{row.name}</span>
      <span className="shrink-0">{row.value}もん</span>
    </li>
  );
}

function Board({ title, board, selfId }: { title: string; board: RankingBoard; selfId: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="text-sm text-white/70">{title}</div>
      <ol className="flex flex-col gap-1">
        {board.top.map((r) => (
          <Row key={r.playerId} row={r} selfId={selfId} />
        ))}
      </ol>
      {board.self && (
        <div className="border-t-2 border-white/30 pt-1">
          <Row row={board.self} selfId={selfId} />
        </div>
      )}
    </div>
  );
}

/** ホームの ミニランキング。だれも答えていなければ出さない */
export function RankingWindow({ ranking, selfId }: { ranking: Ranking; selfId: number }) {
  if (ranking.answered.top.length === 0) return null;
  return (
    <section className="rpg-window flex flex-col gap-2 p-4">
      <div className="text-lg text-accent">🏆 ランキング</div>
      <div className="grid grid-cols-2 gap-4">
        <Board title="せいかい" board={ranking.correct} selfId={selfId} />
        <Board title="かいとう" board={ranking.answered} selfId={selfId} />
      </div>
    </section>
  );
}
