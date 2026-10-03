import "server-only";
import { gateway, generateSpeech } from "ai";
import type { SpeechLang } from "@/lib/audio/speech-request";

/** 日本語・英語の両方を読める読み上げモデル（AI Gateway 経由） */
export const SPEECH_MODEL = "openai/tts-1";
const VOICE = "nova";
/** 子どもが聞き取りやすいよう、少しゆっくり読む */
const SPEED: Record<SpeechLang, number> = { ja: 0.9, en: 0.85 };

/** 文を読み上げた mp3 を作る */
export async function synthesize(text: string, lang: SpeechLang): Promise<{ data: Uint8Array; mediaType: string }> {
  const { audio } = await generateSpeech({
    model: gateway.speech(SPEECH_MODEL),
    text,
    voice: VOICE,
    speed: SPEED[lang],
    outputFormat: "mp3",
  });
  return { data: audio.uint8Array, mediaType: audio.mediaType || "audio/mpeg" };
}
