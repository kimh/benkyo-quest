import Link from "next/link";
import { PixelButton } from "@/components/PixelButton";
import { eikenLabel } from "@/lib/curriculum/eiken";
import { gradeLabel } from "@/lib/curriculum/units";
import { jstDate } from "@/lib/date";
import { currentStreak } from "@/lib/game/player";
import { listChildren, listPendingRedemptions, requireParent } from "@/lib/parent";
import { getGemSettings } from "@/lib/settings";
import { approve, logout, reject } from "./actions";
import { GemSettingsForm } from "./GemSettingsForm";

const APPROVE_ERRORS: Record<string, string> = {
  not_pending: "この申請はもう処理されています",
  short: "Gemが足りないため承認できません",
};

const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ParentPage({ searchParams }: PageProps<"/parent">) {
  await requireParent();
  const { error } = await searchParams;
  const today = jstDate();

  const [pending, settings, players] = await Promise.all([
    listPendingRedemptions(),
    getGemSettings(),
    listChildren(),
  ]);
  const errorMessage = typeof error === "string" ? APPROVE_ERRORS[error] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl text-accent">保護者画面</h1>
        <form action={logout}>
          <PixelButton type="submit" className="min-h-10 px-3 py-1 text-base">ログアウト</PixelButton>
        </form>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg text-accent">Gemこうかんの申請</h2>
        {errorMessage && <p className="text-accent">{errorMessage}</p>}
        {pending.length === 0 ? (
          <p className="rpg-window p-3 text-white/70">申請はありません</p>
        ) : (
          pending.map((r) => (
            <div key={r.id} className="rpg-window flex flex-col gap-2 p-3">
              <div>
                {r.playerName}　<span className="text-gem">💎 {r.amount}</span>
                <span className="ml-2 text-sm text-white/60">{dateTimeFormat.format(r.createdAt)}</span>
              </div>
              {r.note && <div>「{r.note}」</div>}
              <div className="flex gap-2">
                <form action={approve} className="flex-1">
                  <input type="hidden" name="id" value={r.id} />
                  <PixelButton type="submit" variant="accent" className="min-h-10 w-full py-1 text-base">承認</PixelButton>
                </form>
                <form action={reject} className="flex-1">
                  <input type="hidden" name="id" value={r.id} />
                  <PixelButton type="submit" className="min-h-10 w-full py-1 text-base">却下</PixelButton>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg text-accent">子ども</h2>
        {players.length === 0 && <p className="rpg-window p-3 text-white/70">冒険の書はまだありません</p>}
        {players.map((p) => (
          <Link key={p.id} href={`/parent/players/${p.id}`} className="rpg-window grid grid-cols-[1fr_auto] gap-1 p-3">
            <span className="text-lg">{p.name}</span>
            <span className="text-right">{gradeLabel(p.grade)}</span>
            <span>
              Lv {p.playerLevel}　🔥 {currentStreak(p.streakDays, p.lastClearedDate, today)}日
              {p.eikenGrade && <span className="ml-2 text-sm text-white/70">英語: {eikenLabel(p.eikenGrade)}</span>}
            </span>
            <span className="text-right text-gem">💎 {p.gems}</span>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg text-accent">もらえるGemの数</h2>
        <GemSettingsForm settings={settings} />
      </section>
    </main>
  );
}
