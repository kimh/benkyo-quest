import { bgm } from "./sound";
import { speechText, speechUrl, type SpeechLang } from "./speech-request";

/**
 * 読み上げ。サーバーで作った音声（/api/tts）を鳴らす。
 * Fire タブレットの Silk のように、ブラウザの音声合成が鳴らない端末があるため。
 * サーバーの音声が使えなかったときだけ、ブラウザの音声合成で読む。
 * 読んでいるあいだは、声が聞こえるようにBGMを小さくする。
 */

let current: HTMLAudioElement | null = null;
const preloaded = new Set<string>();

/** 読み上げ中の音を止める */
export function stopSpeaking() {
  current?.pause();
  current = null;
  bgm().setDucked(false);
  try {
    speechSynthesis.cancel();
  } catch {
    // 音声合成に対応していない端末では何もしない
  }
}

export function speak(text: string, lang: SpeechLang = "en") {
  stopSpeaking();
  if (!speechText(text)) return;
  const audio = new Audio(speechUrl(text, lang));
  current = audio;
  const fallback = () => {
    if (current === audio) browserSpeak(text, lang);
  };
  const done = () => {
    if (current === audio) bgm().setDucked(false);
  };
  audio.addEventListener("playing", () => current === audio && bgm().setDucked(true));
  audio.addEventListener("ended", done);
  audio.addEventListener("error", fallback, { once: true });
  audio.play().catch((e: unknown) => {
    // まだ画面をタップしていなくて自動再生が止められたときは、ボタンで聞いてもらう
    if (e instanceof DOMException && e.name === "NotAllowedError") return done();
    fallback();
  });
}

/** 次に読む文の音声を先に取っておく（作るのに1〜2秒かかるため） */
export function preloadSpeech(text: string, lang: SpeechLang = "en") {
  if (!speechText(text)) return;
  const url = speechUrl(text, lang);
  if (preloaded.has(url)) return;
  preloaded.add(url);
  fetch(url).catch(() => preloaded.delete(url));
}

function browserSpeak(text: string, lang: SpeechLang) {
  try {
    const u = new SpeechSynthesisUtterance(speechText(text));
    u.lang = lang === "ja" ? "ja-JP" : "en-US";
    u.rate = lang === "ja" ? 0.9 : 0.85;
    u.onstart = () => bgm().setDucked(true);
    u.onend = u.onerror = () => bgm().setDucked(false);
    speechSynthesis.speak(u);
  } catch {
    // 音声合成に対応していない端末では何もしない
  }
}
