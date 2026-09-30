import { redirect } from "next/navigation";
import { Knock } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelButton, PixelLink } from "@/components/PixelButton";
import { MAX_PENDING_REDEEMS } from "@/lib/game/gems";
import { currentPlayer } from "@/lib/players";
import { redeemSummary } from "@/lib/redemptions";
import { cancel } from "./actions";
import { RedeemForm } from "./RedeemForm";

const STATUS = {
  pending: { label: "おねがいちゅう", color: "text-accent" },
  approved: { label: "こうかん できた！", color: "text-ok" },
  rejected: { label: "こんかいは ダメだった", color: "text-white/60" },
} as const;

const dateFormat = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" });

export default async function GemsPage() {
  const player = await currentPlayer();
  if (!player) redirect("/setup");
  const { balance, pending, available, pendingCount, requests } = await redeemSummary(player.id);
  const canRequest = available > 0 && pendingCount < MAX_PENDING_REDEEMS;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
      <PixelLink href="/home" className="self-start px-3 py-1 text-base">◀ ホーム</PixelLink>

      <div className="flex flex-col items-center gap-3">
        <Knock mood={canRequest ? "love" : "neutral"} height={130} />
        <MessageWindow
          speaker="ノック"
          text={
            canRequest
              ? "Gem を おうちの人に わたして、ごほうびと こうかん しよう！\nいくつ わたすか えらんでね。"
              : balance === 0
                ? "まだ Gem が ないよ。クエストで あつめよう！"
                : "いまは おねがいちゅう だよ。おうちの人の へんじを まとうね。"
          }
        />
      </div>

      <section className="rpg-window grid grid-cols-[1fr_auto] gap-1 p-3 text-lg">
        <span>もっている Gem</span>
        <span className="text-right text-gem">💎 {balance}</span>
        {pending > 0 && (
          <>
            <span>おねがいちゅう</span>
            <span className="text-right text-accent">💎 {pending}</span>
          </>
        )}
        <span>こうかんに つかえる</span>
        <span className="text-right text-gem">💎 {available}</span>
      </section>

      {canRequest && <RedeemForm available={available} />}

      {requests.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg text-accent">こうかんの きろく</h2>
          {requests.map((r) => (
            <div key={r.id} className="rpg-window flex items-center justify-between gap-2 p-3">
              <div>
                <div>
                  {dateFormat.format(r.createdAt)}　💎 {r.amount}
                  {r.note && `　${r.note}`}
                </div>
                <div className={STATUS[r.status].color}>{STATUS[r.status].label}</div>
              </div>
              {r.status === "pending" && (
                <form action={cancel}>
                  <input type="hidden" name="id" value={r.id} />
                  <PixelButton type="submit" className="min-h-10 px-3 py-1 text-base">とりけす</PixelButton>
                </form>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
