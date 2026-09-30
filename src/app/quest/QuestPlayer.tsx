"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Knock, type KnockMood } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelButton, PixelLink } from "@/components/PixelButton";
import type { PublicQuestion } from "@/lib/game/question";

type Progress = { attempts: number; correct: boolean | null };
type TodayResponse = {
  round: number;
  maxRounds: number;
  status: "in_progress" | "cleared";
  questions: PublicQuestion[];
  progress: Progress[];
};
type AnswerResponse = (
  | { result: "correct"; firstTry: boolean; explanation: string }
  | { result: "retry"; hint: string }
  | { result: "wrong"; answer: string; explanation: string }
) & { questCleared: boolean };

type Phase =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "question"; hint?: string }
  | { kind: "sending" }
  | { kind: "feedback"; res: Exclude<AnswerResponse, { result: "retry" }> }
  | { kind: "cleared"; correctCount: number; alreadyDone: boolean };

const finished = (p: Progress) => p.correct === true || p.attempts >= 2;

/** 英語の読み上げ（ブラウザの音声合成） */
function speak(text: string) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch {
    // 読み上げに対応していない端末では何もしない
  }
}

/**
 * きょうのクエスト（バトル演出なしの問題画面）。
 * 問題の作成・採点はサーバーで行い、ここでは表示と入力だけをする。
 */
export function QuestPlayer() {
  const [quest, setQuest] = useState<TodayResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [input, setInput] = useState("");
  const loadStarted = useRef(false);

  /** startNext=true なら、クリアしたあとに次の回を始める */
  const load = useCallback(async (startNext = false) => {
    setPhase({ kind: "loading" });
    try {
      const res = startNext ? await fetch("/api/quest/next", { method: "POST" }) : await fetch("/api/quest/today");
      if (!res.ok) throw new Error(String(res.status));
      const data: TodayResponse = await res.json();
      setQuest(data);
      const next = data.progress.findIndex((p) => !finished(p));
      if (data.status === "cleared" || next === -1) {
        setPhase({ kind: "cleared", correctCount: data.progress.filter((p) => p.correct).length, alreadyDone: true });
      } else {
        setIndex(next);
        setPhase({ kind: "question" });
      }
    } catch {
      setPhase({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    // 開発時の二重実行でも問題を2回作らないように1回だけ読む
    if (loadStarted.current) return;
    loadStarted.current = true;
    void load();
  }, [load]);

  const q = quest?.questions[index];

  // 英語の読み上げ問題は、表示したときに一度読む
  useEffect(() => {
    if (phase.kind === "question" && !phase.hint && q?.speech) speak(q.speech);
  }, [phase, q]);

  async function answer(value: string) {
    if (!quest || phase.kind !== "question") return;
    setPhase({ kind: "sending" });
    try {
      const res = await fetch("/api/quest/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ index, value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data: AnswerResponse = await res.json();
      setInput("");
      if (data.result === "retry") {
        setPhase({ kind: "question", hint: data.hint });
        return;
      }
      const progress = [...quest.progress];
      progress[index] = { attempts: progress[index].attempts + 1, correct: data.result === "correct" };
      setQuest({ ...quest, progress });
      setPhase({ kind: "feedback", res: data });
    } catch {
      setPhase({ kind: "question" });
      alert("つうしんに しっぱいしたよ。もういちど おしてね");
    }
  }

  function next() {
    if (!quest || phase.kind !== "feedback") return;
    if (phase.res.questCleared || quest.progress.every(finished)) {
      setPhase({ kind: "cleared", correctCount: quest.progress.filter((p) => p.correct).length, alreadyDone: false });
      return;
    }
    const n = quest.progress.findIndex((p, i) => i > index && !finished(p));
    setIndex(n === -1 ? quest.progress.findIndex((p) => !finished(p)) : n);
    setPhase({ kind: "question" });
  }

  if (phase.kind === "loading") {
    return (
      <Screen mood="confused" text={"ノックが きょうの もんだいを かんがえているよ…\nちょっと まってね！"}>
        <p className="blink text-center text-xl">・・・</p>
      </Screen>
    );
  }

  if (phase.kind === "error" || !quest || !q) {
    return (
      <Screen mood="crying" text="もんだいを よみこめなかったよ…">
        <PixelButton variant="accent" onClick={() => void load()}>▶ もういちど</PixelButton>
        <PixelLink href="/home">ホームに もどる</PixelLink>
      </Screen>
    );
  }

  if (phase.kind === "cleared") {
    const total = quest.questions.length;
    const left = quest.maxRounds - quest.round;
    const score = `${total}もん中 ${phase.correctCount}もん せいかい`;
    const text = phase.alreadyDone
      ? `${quest.round}かいめの クエストは もう おわったよ！ ${score}。`
      : `クエスト クリア！ やったね！\n${score}だよ！`;
    return (
      <Screen
        mood={left > 0 ? (phase.alreadyDone ? "waving" : "love") : "sleepy"}
        text={left > 0 ? `${text}\nきょうは あと ${left}かい あそべるよ。` : `${text}\nきょうの クエストは ぜんぶ おわり！ また あした あそぼうね。`}
      >
        {left > 0 && (
          <PixelButton variant="accent" onClick={() => void load(true)}>
            ▶ つぎの クエストへ（{quest.round + 1}かいめ）
          </PixelButton>
        )}
        <PixelLink href="/home" variant={left > 0 ? "default" : "accent"}>
          ホームに もどる
        </PixelLink>
      </Screen>
    );
  }

  const header = (
    <div className="flex items-center justify-between text-lg">
      <Link href="/home" className="text-white/70">◀ ホーム</Link>
      <span>
        {quest.round}かいめ　{q.subject === "math" ? "さんすう" : "えいご"}　{index + 1} / {quest.questions.length}
      </span>
    </div>
  );

  if (phase.kind === "feedback") {
    const r = phase.res;
    const text =
      r.result === "correct"
        ? `せいかい！ ${r.firstTry ? "すごい！" : "よく がんばったね！"}\n${r.explanation}`
        : `ざんねん… こたえは「${r.answer}」だよ。\n${r.explanation}`;
    return (
      <>
        {header}
        <Screen mood={r.result === "correct" ? "cheering" : "crying"} text={text} speed={25}>
          <PixelButton variant="accent" onClick={next}>▶ つぎへ</PixelButton>
        </Screen>
      </>
    );
  }

  const sending = phase.kind === "sending";
  const hint = phase.kind === "question" ? phase.hint : undefined;

  return (
    <>
      {header}
      <Screen
        compact
        mood={hint ? "winking" : "neutral"}
        text={hint ? `ヒントだよ！ ${hint}\nもういちど かんがえてみて！` : q.prompt}
        speed={hint ? 25 : 30}
      />
      {hint && <p className="rpg-window p-3 text-lg">{q.prompt}</p>}

      {q.speech && (
        <PixelButton onClick={() => speak(q.speech)} disabled={sending}>
          🔈 もういちど きく
        </PixelButton>
      )}

      {q.format === "choice" ? (
        <div className="grid grid-cols-2 gap-3">
          {q.choices.map((c) => (
            <PixelButton key={c} onClick={() => void answer(c)} disabled={sending} className="min-h-16 text-2xl">
              {c}
            </PixelButton>
          ))}
        </div>
      ) : (
        <NumberPad value={input} onChange={setInput} onSubmit={() => void answer(input)} disabled={sending} />
      )}
    </>
  );
}

function Screen({
  mood,
  text,
  speed = 30,
  compact = false,
  children,
}: {
  mood: KnockMood;
  text: string;
  speed?: number;
  /** 入力欄を出す画面ではノックを小さくする */
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Knock mood={mood} height={compact ? 110 : 160} />
      <MessageWindow speaker="ノック" text={text} speed={speed} />
      {children && <div className="flex w-full flex-col gap-3">{children}</div>}
    </div>
  );
}

const PAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "けす"];

function NumberPad({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const press = (k: string) => {
    if (k === "けす") return onChange(value.slice(0, -1));
    if (k === "." && (value.includes(".") || value === "")) return;
    if (value.length >= 8) return;
    onChange(value === "0" && k !== "." ? k : value + k);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="rpg-window min-h-12 px-4 py-1 text-right text-3xl tracking-widest" aria-live="polite">
        {value || <span className="text-white/30">?</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PAD_KEYS.map((k) => (
          <PixelButton key={k} onClick={() => press(k)} disabled={disabled} className="min-h-12 py-1 text-2xl">
            {k}
          </PixelButton>
        ))}
      </div>
      <PixelButton variant="accent" onClick={onSubmit} disabled={disabled || value === ""}>
        ▶ けってい
      </PixelButton>
    </div>
  );
}
