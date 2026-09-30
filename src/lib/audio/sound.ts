import { BgmPlayer } from "./bgm";
import { soundEnabled } from "./prefs";
import { BATTLE_SONG, BOSS_SONG, FIELD_SONG } from "./songs";

export type Track = "field" | "battle" | "boss";

const SONGS = { field: FIELD_SONG, battle: BATTLE_SONG, boss: BOSS_SONG };

let player: BgmPlayer | null = null;

/** アプリ全体で1つのBGMプレイヤー */
export function bgm(): BgmPlayer {
  player ??= new BgmPlayer(FIELD_SONG);
  return player;
}

/** 画面に合わせてBGMを切り替える */
export function setTrack(track: Track) {
  bgm().setSong(SONGS[track]);
}

export type SoundEffect = "attack" | "critical" | "damage" | "defeat" | "appear" | "fanfare" | "select";

type Tone = { freq: number; at: number; dur: number; type?: OscillatorType; slide?: number; volume?: number };

/** 効果音の音の並び（秒） */
const EFFECTS: Record<SoundEffect, Tone[]> = {
  select: [{ freq: 880, at: 0, dur: 0.05, type: "square", volume: 0.5 }],
  attack: [
    { freq: 900, at: 0, dur: 0.12, type: "square", slide: 200 },
    { freq: 300, at: 0.1, dur: 0.1, type: "square", slide: 80 },
  ],
  critical: [
    { freq: 1200, at: 0, dur: 0.1, type: "square", slide: 300 },
    { freq: 1500, at: 0.1, dur: 0.1, type: "square", slide: 400 },
    { freq: 300, at: 0.2, dur: 0.15, type: "square", slide: 60 },
  ],
  damage: [
    { freq: 180, at: 0, dur: 0.18, type: "sawtooth", slide: 60 },
    { freq: 140, at: 0.15, dur: 0.18, type: "sawtooth", slide: 50 },
  ],
  defeat: [
    { freq: 660, at: 0, dur: 0.08, type: "square" },
    { freq: 520, at: 0.08, dur: 0.08, type: "square" },
    { freq: 390, at: 0.16, dur: 0.08, type: "square" },
    { freq: 260, at: 0.24, dur: 0.3, type: "square", slide: 60 },
  ],
  appear: [
    { freq: 110, at: 0, dur: 0.35, type: "triangle", slide: 220, volume: 1.4 },
    { freq: 220, at: 0.3, dur: 0.2, type: "square", slide: 110 },
  ],
  fanfare: [
    { freq: 523, at: 0, dur: 0.12, type: "square" },
    { freq: 523, at: 0.14, dur: 0.12, type: "square" },
    { freq: 523, at: 0.28, dur: 0.12, type: "square" },
    { freq: 523, at: 0.42, dur: 0.3, type: "square" },
    { freq: 415, at: 0.75, dur: 0.3, type: "square" },
    { freq: 466, at: 1.08, dur: 0.3, type: "square" },
    { freq: 523, at: 1.4, dur: 0.12, type: "square" },
    { freq: 466, at: 1.56, dur: 0.12, type: "square" },
    { freq: 523, at: 1.7, dur: 0.6, type: "square" },
  ],
};

const EFFECT_VOLUME = 0.12;

/** 効果音を鳴らす。音がOFFのとき・まだ一度もタップしていないときは鳴らさない */
export function playSe(effect: SoundEffect) {
  if (!soundEnabled()) return;
  const ctx = bgm().context;
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime + 0.01;
  for (const t of EFFECTS[effect]) {
    const osc = ctx.createOscillator();
    osc.type = t.type ?? "square";
    osc.frequency.setValueAtTime(t.freq, now + t.at);
    if (t.slide) osc.frequency.exponentialRampToValueAtTime(t.slide, now + t.at + t.dur);
    const gain = ctx.createGain();
    const v = EFFECT_VOLUME * (t.volume ?? 1);
    gain.gain.setValueAtTime(v, now + t.at);
    gain.gain.linearRampToValueAtTime(0, now + t.at + t.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + t.at);
    osc.stop(now + t.at + t.dur + 0.02);
  }
}
