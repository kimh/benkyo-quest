import { frequency, length, type Note, type Song } from "./songs";

const LOOKAHEAD_SEC = 0.15;
const TICK_MS = 25;
const MASTER_VOLUME = 0.07;

/** 25%パルス波（ファミコン風の音色） */
function pulseWave(ctx: AudioContext, duty = 0.25): PeriodicWave {
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

type Voice = {
  notes: Note[];
  /** 次に鳴らす音の位置 */
  index: number;
  /** 次の音を鳴らす時刻 */
  time: number;
  play: (freq: number, start: number, dur: number) => void;
};

/**
 * Web Audio でループ再生するシンプルなBGMプレイヤー。
 * ブラウザの制限で、ユーザーが一度タップした後でないと音は出ない。
 */
export class BgmPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private voices: Voice[] = [];

  constructor(private song: Song) {}

  get playing() {
    return this.timer !== null;
  }

  start() {
    if (this.playing) return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.reset();
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    // 鳴っている音をすぐ止める
    if (this.ctx && this.master) {
      this.master.disconnect();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    }
  }

  /** タブが裏に回ったら一時停止する */
  suspend() {
    void this.ctx?.suspend();
  }

  resume() {
    if (this.playing) void this.ctx?.resume();
  }

  private reset() {
    const ctx = this.ctx!;
    const wave = pulseWave(ctx);
    const start = ctx.currentTime + 0.05;
    this.voices = [
      { notes: this.song.melody, index: 0, time: start, play: (f, t, d) => this.tone(f, t, d, wave, 0.9) },
      { notes: this.song.bass, index: 0, time: start, play: (f, t, d) => this.tone(f, t, d, "triangle", 1.6) },
    ];
    if (length(this.song.melody) !== length(this.song.bass)) console.warn("BGM: パートの長さが違います");
  }

  private schedule() {
    const ctx = this.ctx!;
    const eighth = 60 / this.song.bpm / 2;
    for (const v of this.voices) {
      while (v.time < ctx.currentTime + LOOKAHEAD_SEC) {
        const [pitch, len] = v.notes[v.index];
        const freq = frequency(pitch);
        if (freq) v.play(freq, v.time, len * eighth);
        v.time += len * eighth;
        v.index = (v.index + 1) % v.notes.length;
      }
    }
  }

  private tone(freq: number, start: number, dur: number, wave: PeriodicWave | OscillatorType, volume: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    if (wave instanceof PeriodicWave) osc.setPeriodicWave(wave);
    else osc.type = wave;
    osc.frequency.value = freq;

    // 少し短く切ってはずむ感じにする
    const end = start + dur * 0.85;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.linearRampToValueAtTime(volume * 0.6, start + 0.08);
    gain.gain.setValueAtTime(volume * 0.6, Math.max(start + 0.08, end - 0.03));
    gain.gain.linearRampToValueAtTime(0, end);

    osc.connect(gain).connect(this.master!);
    osc.start(start);
    osc.stop(end + 0.01);
  }
}
