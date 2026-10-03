import { notFound } from "next/navigation";
import { PixelButton, PixelLink } from "@/components/PixelButton";
import { findEikenUnit } from "@/lib/curriculum/eiken";
import { findUnit, gradeLabel, subjectsFor, type Subject } from "@/lib/curriculum/units";
import { jstDate } from "@/lib/date";
import { MAX_SUBJECT_LEVEL, MIN_SUBJECT_LEVEL } from "@/lib/game/level";
import { MAX_QUESTS_PER_DAY, maxRoundsToday } from "@/lib/game/quest";
import { playerStats, requireParent, todayRounds } from "@/lib/parent";
import { getPlayer } from "@/lib/players";
import { subjectLevels } from "@/lib/quests";
import { redeemSummary } from "@/lib/redemptions";
import { resetRounds, updateLevel } from "../../actions";
import { EnglishCourseForm } from "./EnglishCourseForm";

const SUBJECT_NAME: Record<Subject, string> = { math: "算数", english: "英語", japanese: "ひらがな" };

const STATUS = {
  pending: { label: "申請中", color: "text-accent" },
  approved: { label: "承認", color: "text-ok" },
  rejected: { label: "却下", color: "text-white/60" },
} as const;

const LEVELS = Array.from({ length: MAX_SUBJECT_LEVEL - MIN_SUBJECT_LEVEL + 1 }, (_, i) => MIN_SUBJECT_LEVEL + i);

const dateFormat = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" });

/** 予備の問題（AIが使えなかったとき）は単元を持たないのでまとめて表示する */
const unitName = (grade: number, subject: Subject, unit: string) =>
  unit.startsWith("fallback-") ? "予備の問題" : (findUnit(grade, subject, unit)?.name ?? findEikenUnit(unit)?.name ?? unit);

const percent = (n: number, total: number) => (total === 0 ? "-" : `${Math.round((n / total) * 100)}%`);

export default async function ParentPlayerPage({ params }: PageProps<"/parent/players/[id]">) {
  await requireParent();
  const { id } = await params;
  const player = await getPlayer(Number(id));
  if (!player) notFound();

  const [stats, { balance, requests }, played] = await Promise.all([
    playerStats(player.id),
    redeemSummary(player.id),
    todayRounds(player.id),
  ]);
  const maxRounds = maxRoundsToday(player, jstDate());
  const levels = subjectLevels(player);
  const subjects = subjectsFor(player.grade);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4">
      <PixelLink href="/parent" className="self-start px-3 py-1 text-base">◀ 保護者画面</PixelLink>

      <section className="rpg-window grid grid-cols-[1fr_auto] gap-1 p-4">
        <span className="text-2xl text-accent">{player.name}</span>
        <span className="text-right">{gradeLabel(player.grade)}</span>
        <span>Lv {player.playerLevel}</span>
        <span className="text-right text-gem">💎 {balance}</span>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg text-accent">きょうのクエスト</h2>
        <form action={resetRounds} className="rpg-window flex items-center justify-between gap-3 p-3">
          <input type="hidden" name="playerId" value={player.id} />
          <span>
            {played} / {maxRounds} 回
          </span>
          <PixelButton type="submit" className="min-h-10 px-3 py-1 text-base" disabled={played < maxRounds}>
            回数をリセット
          </PixelButton>
        </form>
        <p className="text-sm text-white/70">リセットすると、きょうはあと{MAX_QUESTS_PER_DAY}回遊べます。これまでの記録は消えません。</p>
      </section>

      {subjects.includes("english") && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg text-accent">英語のコース</h2>
          {/* 保存後に React がフォームをリセットして古い値に戻すので、値が変わったら作り直す */}
          <EnglishCourseForm
            key={player.eikenGrade ?? "school"}
            playerId={player.id}
            saved={player.eikenGrade}
            gradeName={gradeLabel(player.grade)}
          />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg text-accent">難しさのレベル</h2>
        <p className="text-sm text-white/70">
          {MIN_SUBJECT_LEVEL}〜{MAX_SUBJECT_LEVEL}。クエストのたびに正答率で自動で上下します。
        </p>
        {subjects.map((subject) => (
          <form key={`${subject}-${levels[subject]}`} action={updateLevel} className="rpg-window flex items-center justify-between gap-3 p-3">
            <input type="hidden" name="playerId" value={player.id} />
            <input type="hidden" name="subject" value={subject} />
            <span>{SUBJECT_NAME[subject]}</span>
            <span className="flex items-center gap-2">
              <select
                name="level"
                defaultValue={levels[subject]}
                aria-label={`${SUBJECT_NAME[subject]}のレベル`}
                className="border-2 border-white bg-black px-2 py-1"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    Lv {l}
                  </option>
                ))}
              </select>
              <PixelButton type="submit" className="min-h-10 px-3 py-1 text-base">変更</PixelButton>
            </span>
          </form>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg text-accent">成績</h2>
        {stats.length === 0 && <p className="rpg-window p-3 text-white/70">まだ解いた問題がありません</p>}
        {subjects.map((subject) => {
          const rows = stats.filter((s) => s.subject === subject);
          if (rows.length === 0) return null;
          const total = rows.reduce((n, r) => n + r.total, 0);
          const correct = rows.reduce((n, r) => n + r.correct, 0);
          return (
            <div key={subject} className="rpg-window p-3">
              <div className="mb-2 flex justify-between">
                <span>{SUBJECT_NAME[subject]}</span>
                <span>
                  {percent(correct, total)}（{correct}/{total}問）
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-white/60">
                  <tr>
                    <th className="text-left font-normal">単元</th>
                    <th className="text-right font-normal">正答率</th>
                    <th className="text-right font-normal">1回目で正解</th>
                    <th className="text-right font-normal">問題数</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .toSorted((a, b) => a.correct / a.total - b.correct / b.total)
                    .map((r) => (
                      <tr key={r.unit}>
                        <td>{unitName(player.grade, subject, r.unit)}</td>
                        <td className="text-right">{percent(r.correct, r.total)}</td>
                        <td className="text-right">{percent(r.firstTry, r.total)}</td>
                        <td className="text-right">{r.total}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>

      {requests.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg text-accent">Gemこうかんの履歴</h2>
          <div className="rpg-window flex flex-col gap-1 p-3">
            {requests.map((r) => (
              <div key={r.id} className="flex justify-between gap-2">
                <span>
                  {dateFormat.format(r.createdAt)}　💎 {r.amount}
                  {r.note && `　${r.note}`}
                </span>
                <span className={STATUS[r.status].color}>{STATUS[r.status].label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
