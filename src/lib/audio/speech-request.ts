/** 読み上げの言語。英語の問題は英語で、保育園の問題文は日本語で読む */
export type SpeechLang = "ja" | "en";

/** 1回に読み上げる文の最大文字数（英検の読解の問題文が入る長さ） */
export const MAX_SPEECH_TEXT = 400;

/** 読むと答えがわかったり長くなったりするので、絵文字は読まない */
export function speechText(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}|️/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** /api/tts の URL。同じ文なら同じ URL になるので、ブラウザと CDN にキャッシュされる */
export function speechUrl(text: string, lang: SpeechLang): string {
  return `/api/tts?${new URLSearchParams({ lang, text: speechText(text) })}`;
}

/** /api/tts のパラメータを確かめる。おかしければ null */
export function parseSpeechRequest(params: URLSearchParams): { text: string; lang: SpeechLang } | null {
  const lang = params.get("lang");
  if (lang !== "ja" && lang !== "en") return null;
  const text = speechText(params.get("text") ?? "");
  if (!text || [...text].length > MAX_SPEECH_TEXT) return null;
  return { text, lang };
}
