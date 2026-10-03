"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BattleScene, type BattleAnim } from "@/components/battle/BattleScene";
import { preloadMonster } from "@/components/battle/MonsterSprite";
import { Knock, type KnockMood } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelButton, PixelLink } from "@/components/PixelButton";
import { playSe, setTrack, type SoundEffect } from "@/lib/audio/sound";
import { PRESCHOOL, subjectLabel } from "@/lib/curriculum/units";
import { hpRatio, stageCleared, stageOf, type Stage } from "@/lib/game/battle";
import { monstersForQuest, type Monster } from "@/lib/game/monsters";
import type { PublicQuestion } from "@/lib/game/question";
import type { ClearReward } from "@/lib/quests";

type Progress = { attempts: number; correct: boolean | null };
type TodayResponse = {
  date: string;
  grade: number;
  round: number;
  maxRounds: number;
  status: "in_progress" | "cleared";
  questions: PublicQuestion[];
  progress: Progress[];
  /** balance=持っているGem、earned=この回でもらったGem */
  gems: { balance: number; earned: number };
};
type AnswerResponse = (
  | { result: "correct"; firstTry: boolean; explanation: string }
  | { result: "retry"; hint: string }
  | { result: "wrong"; answer: string; explanation: string }
) & { questCleared: boolean; gems: number; clearBonus: number; balance: number; reward: ClearReward | null };
type Feedback = Exclude<AnswerResponse, { result: "retry" }>;

/** バトル演出の1コマ */
type Step = {
  anim: BattleAnim;
  mood: KnockMood;
  text: string;
  popup?: string;
  se?: SoundEffect;
  ms: number;
  /** このコマからモンスターのHPが減る */
  hit?: boolean;
  /** 次のモンスターの登場など、いまの問題とは別のモンスターを出すとき */
  stage?: Stage;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "question"; hint?: string }
  | { kind: "sending" }
  /** 演出を順に再生し、終わったら then へ（nextIndex があれば問題も切り替える） */
  | { kind: "sequence"; id: number; steps: Step[]; at: number; then: Phase; nextIndex?: number }
  | { kind: "feedback"; res: Feedback }
  | { kind: "cleared"; correctCount: number; alreadyDone: boolean; clearBonus: number; reward: ClearReward | null };

const finished = (p: Progress) => p.correct === true || p.attempts >= 2;

let sequenceId = 0;
function sequence(steps: Step[], then: Phase, nextIndex?: number): Phase {
  return { kind: "sequence", id: ++sequenceId, steps, at: 0, then, nextIndex };
}

function monsterOf(quest: TodayResponse, stage: Stage): Monster {
  const { minions, boss } = monstersForQuest(quest.date, quest.round);
  return stage.kind === "boss" ? boss : minions[stage.number];
}

/** モンスターが あらわれる演出 */
function appearSteps(quest: TodayResponse, stage: Stage): Step[] {
  const monster = monsterOf(quest, stage);
  return stage.kind === "boss"
    ? [{ anim: "appear", mood: "surprised", text: `ボスの ${monster.name}が あらわれた！`, se: "appear", ms: 1800, stage }]
    : [{ anim: "appear", mood: "neutral", text: `${monster.name}が あらわれた！`, se: "appear", ms: 1400, stage }];
}

/** 読み上げ（ブラウザの音声合成）。英語の問題は英語で、保育園の問題文は日本語で読む */
function speak(text: string, lang: "en-US" | "ja-JP" = "en-US") {
  try {
    speechSynthesis.cancel();
    // 絵文字は読むと答えがわかったり、長くなったりするので読まない
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}|️/gu, " "));
    u.lang = lang;
    u.rate = lang === "ja-JP" ? 0.9 : 0.85;
    speechSynthesis.speak(u);
  } catch {
    // 読み上げに対応していない端末では何もしない
  }
}

/** 保育園の問題で読み上げる文。「きいて」の問題は、問題文のあとに ことばを2回読む */
function preschoolReading(q: PublicQuestion): string {
  return q.speech ? `${q.prompt}。${q.speech}。${q.speech}` : q.prompt;
}

/**
 * きょうのクエスト。ファイナルファンタジー風の横向きバトルで、1問ごとにモンスターと戦う。
 * 問題の作成・採点はサーバーで行い、ここでは表示と入力と演出だけをする。
 */
export function QuestPlayer() {
  const [quest, setQuest] = useState<TodayResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [input, setInput] = useState("");
  /** HPバーに反映ずみの問題（攻撃の演出に合わせて減らすため、採点結果とは別に持つ） */
  const [hits, setHits] = useState<boolean[]>([]);
  const loadStarted = useRef(false);

  /** startNext=true なら、クリアしたあとに次の回を始める */
  const load = useCallback(async (startNext = false) => {
    setPhase({ kind: "loading" });
    try {
      const res = startNext ? await fetch("/api/quest/next", { method: "POST" }) : await fetch("/api/quest/today");
      if (!res.ok) throw new Error(String(res.status));
      const data: TodayResponse = await res.json();
      setQuest(data);
      const { minions, boss } = monstersForQuest(data.date, data.round);
      [...minions, boss].forEach(preloadMonster);
      setHits(data.progress.map(finished));
      const next = data.progress.findIndex((p) => !finished(p));
      if (data.status === "cleared" || next === -1) {
        setPhase({
          kind: "cleared",
          correctCount: data.progress.filter((p) => p.correct).length,
          alreadyDone: true,
          clearBonus: 0,
          reward: null,
        });
      } else {
        setIndex(next);
        setPhase(sequence(appearSteps(data, stageOf(next)), { kind: "question" }));
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
  const step = phase.kind === "sequence" ? phase.steps[phase.at] : null;
  // 画面に出すモンスター（登場の演出中は次のモンスター）
  const stage = step?.stage ?? stageOf(index);

  // 字が読めない保育園の子には、問題文・ヒントを日本語で読み上げる
  const readAloud = quest?.grade === PRESCHOOL;

  // バトル中はバトル曲（ボスはボス曲）、それ以外はフィールド曲
  const inBattle = phase.kind !== "loading" && phase.kind !== "error" && phase.kind !== "cleared";
  useEffect(() => {
    setTrack(inBattle ? (stage.kind === "boss" ? "boss" : "battle") : "field");
  }, [inBattle, stage.kind]);
  useEffect(() => () => setTrack("field"), []);

  // 演出のコマを順に進める
  useEffect(() => {
    if (phase.kind !== "sequence") return;
    const current = phase.steps[phase.at];
    if (current.se) playSe(current.se);
    if (readAloud) speak(current.text, "ja-JP");
    const id = setTimeout(() => {
      if (phase.at + 1 < phase.steps.length) {
        setPhase({ ...phase, at: phase.at + 1 });
        return;
      }
      if (phase.steps.some((s) => s.hit)) setHits((h) => h.map((v, i) => v || i === index));
      if (phase.nextIndex !== undefined) setIndex(phase.nextIndex);
      setPhase(phase.then);
    }, current.ms);
    return () => clearTimeout(id);
  }, [phase, index, readAloud]);

  // クリアしたらファンファーレ
  useEffect(() => {
    if (phase.kind === "cleared" && !phase.alreadyDone) playSe("fanfare");
  }, [phase]);

  // 英語の読み上げ問題・保育園の問題は、表示したときに一度読む
  useEffect(() => {
    if (phase.kind === "feedback" && readAloud) {
      const r = phase.res;
      speak(r.result === "correct" ? "せいかい！ すごいね！" : `ざんねん。こたえは ${r.answer} だよ。`, "ja-JP");
      return;
    }
    if (phase.kind !== "question" || !q) return;
    if (readAloud) speak(phase.hint ? `ヒントだよ。${phase.hint}` : preschoolReading(q), "ja-JP");
    else if (!phase.hint && q.speech) speak(q.speech);
  }, [phase, q, readAloud]);

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
      const name = monsterOf(quest, stageOf(index)).name;
      const monsterAttack: Step = { anim: "monsterAttack", mood: "angry", text: `${name}の こうげき！`, se: "damage", ms: 1000 };
      if (data.result === "retry") {
        setPhase(sequence([monsterAttack], { kind: "question", hint: data.hint }));
        return;
      }
      const progress = [...quest.progress];
      progress[index] = { attempts: progress[index].attempts + 1, correct: data.result === "correct" };
      const gems = { balance: data.balance, earned: quest.gems.earned + data.gems + data.clearBonus };
      setQuest({ ...quest, progress, gems });
      const steps: Step[] =
        data.result === "correct"
          ? [
              {
                anim: "knockAttack",
                mood: "cheering",
                text: data.firstTry ? "ノックの こうげき！ かいしんの いちげき！" : "ノックの こうげき！",
                popup: data.firstTry ? "かいしん！" : "ヒット！",
                se: data.firstTry ? "critical" : "attack",
                ms: 1100,
                hit: true,
              },
            ]
          : [
              monsterAttack,
              { anim: "knockAttack", mood: "neutral", text: "ノックの はんげき！", popup: "たいあたり！", se: "attack", ms: 1000, hit: true },
            ];
      setPhase(sequence(steps, { kind: "feedback", res: data }));
    } catch {
      setPhase({ kind: "question" });
      alert("つうしんに しっぱいしたよ。もういちど おしてね");
    }
  }

  function next() {
    if (!quest || phase.kind !== "feedback") return;
    const done = quest.progress.map(finished);
    const current = stageOf(index);
    const allDone = phase.res.questCleared || done.every(Boolean);
    const n = quest.progress.findIndex((p, i) => i > index && !finished(p));
    const nextIndex = n === -1 ? quest.progress.findIndex((p) => !finished(p)) : n;

    if (!allDone && !stageCleared(current, done)) {
      setIndex(nextIndex);
      setPhase({ kind: "question" });
      return;
    }
    // このモンスターを たおした → クリア、または次のモンスターが あらわれる
    const defeat: Step = {
      anim: "defeat",
      mood: current.kind === "boss" ? "love" : "cheering",
      text: `${monsterOf(quest, current).name}を たおした！`,
      se: "defeat",
      ms: 1400,
    };
    if (allDone) {
      const correctCount = quest.progress.filter((p) => p.correct).length;
      setPhase(
        sequence([defeat], {
          kind: "cleared",
          correctCount,
          alreadyDone: false,
          clearBonus: phase.res.clearBonus,
          reward: phase.res.reward,
        }),
      );
      return;
    }
    setPhase(sequence([defeat, ...appearSteps(quest, stageOf(nextIndex))], { kind: "question" }, nextIndex));
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
    const reward = phase.reward;
    const score = `${total}もん中 ${phase.correctCount}もん せいかい`;
    const lines = phase.alreadyDone
      ? [`${quest.round}かいめの クエストは もう おわったよ！ ${score}。`]
      : [
          `クエスト クリア！ やったね！ ${score}だよ！`,
          reward?.levelUp ? `レベルアップ！ Lv ${reward.level} に なった！` : "",
          ...(reward?.subjectUps ?? []).map((s) => `${subjectLabel(s, quest.grade)}の もんだいが すこし むずかしく なるよ！`),
        ];
    lines.push(left > 0 ? `きょうは あと ${left}かい あそべるよ。` : "きょうの クエストは ぜんぶ おわり！ また あした あそぼうね。");
    return (
      <Screen
        mood={left > 0 ? (phase.alreadyDone ? "waving" : "love") : "sleepy"}
        text={lines.filter(Boolean).join("\n")}
      >
        <div className="rpg-window grid grid-cols-[1fr_auto] gap-1 p-3 text-lg">
          {!phase.alreadyDone && phase.clearBonus > 0 && (
            <>
              <span>クリアボーナス</span>
              <span className="text-right text-gem">💎 {phase.clearBonus}</span>
            </>
          )}
          <span>もらった Gem</span>
          <span className="text-right text-gem">💎 {quest.gems.earned}</span>
          <span>もっている Gem</span>
          <span className="text-right text-gem">💎 {quest.gems.balance}</span>
          {reward && (
            <>
              <span>もらった EXP</span>
              <span className="text-right text-ok">+{reward.exp}</span>
              <span>れんぞく</span>
              <span className="text-right">🔥 {reward.streakDays}にち</span>
            </>
          )}
        </div>
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

  const hint = phase.kind === "question" ? phase.hint : undefined;
  const sending = phase.kind === "sending";
  // 英検の会話文のような長い選択肢は1列にする
  const longChoices = q.choices.some((c) => c.length > 12);

  let mood: KnockMood = hint ? "winking" : "neutral";
  let text = hint ? `ヒントだよ！ ${hint}\nもういちど かんがえてみて！` : q.prompt;
  if (step) {
    mood = step.mood;
    text = step.text;
  } else if (phase.kind === "feedback") {
    const r = phase.res;
    mood = r.result === "correct" ? "cheering" : "crying";
    text =
      r.result === "correct"
        ? `せいかい！ ${r.firstTry ? "すごい！" : "よく がんばったね！"}${r.gems ? ` 💎+${r.gems}` : ""}\n${r.explanation}`
        : `ざんねん… こたえは「${r.answer}」だよ。\n${r.explanation}`;
  }

  // 攻撃が当たったコマからHPバーを減らす
  const hitNow = phase.kind === "sequence" && phase.steps.slice(0, phase.at + 1).some((s) => s.hit) && !step?.stage;
  const shownHits = hitNow ? hits.map((v, i) => v || i === index) : hits;

  return (
    <>
      <div className="flex items-center justify-between text-lg">
        <Link href="/home" className="text-white/70">◀ ホーム</Link>
        <span>
          {quest.round}かいめ　{subjectLabel(q.subject, quest.grade)}　{index + 1} / {quest.questions.length}
        </span>
        <span className="text-gem">💎 {quest.gems.balance}</span>
      </div>

      <BattleScene
        monster={monsterOf(quest, stage)}
        boss={stage.kind === "boss"}
        hp={hpRatio(stage, shownHits)}
        knockMood={mood}
        anim={step?.anim ?? "idle"}
        popup={step?.popup}
        animKey={phase.kind === "sequence" ? phase.id * 100 + phase.at : 0}
      />

      <MessageWindow speaker={step ? undefined : "ノック"} text={text} speed={step ? 20 : 30} />
      {hint && <p className="rpg-window p-3 text-lg">{q.prompt}</p>}

      {phase.kind === "feedback" && (
        <PixelButton variant="accent" onClick={next}>▶ つぎへ</PixelButton>
      )}

      {(phase.kind === "question" || sending) && (
        <>
          {(q.speech || readAloud) && (
            <PixelButton
              onClick={() => (readAloud ? speak(hint ?? preschoolReading(q), "ja-JP") : speak(q.speech))}
              disabled={sending}
            >
              🔈 もういちど きく
            </PixelButton>
          )}
          {q.format === "choice" ? (
            <div className={`grid gap-3 ${longChoices ? "grid-cols-1" : "grid-cols-2"}`}>
              {q.choices.map((c) => (
                <PixelButton
                  key={c}
                  onClick={() => void answer(c)}
                  disabled={sending}
                  className={longChoices ? "min-h-12 text-left text-lg" : "min-h-14 text-2xl"}
                >
                  {c}
                </PixelButton>
              ))}
            </div>
          ) : (
            <NumberPad value={input} onChange={setInput} onSubmit={() => void answer(input)} disabled={sending} />
          )}
        </>
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
