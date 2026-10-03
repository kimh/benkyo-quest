import { describe, expect, it } from "vitest";
import { MAX_SPEECH_TEXT, parseSpeechRequest, speechText, speechUrl } from "./speech-request";

describe("speechText", () => {
  it("絵文字は読まない", () => {
    expect(speechText("🍎🍎🍎\nいくつ かな？")).toBe("いくつ かな？");
    expect(speechText("❤️ すき")).toBe("すき");
  });
});

describe("parseSpeechRequest", () => {
  const parse = (url: string) => parseSpeechRequest(new URL(url, "http://x").searchParams);
  it("speechUrl で作った URL を受け付ける", () => {
    expect(parse(speechUrl("🐶 ひこうき", "ja"))).toEqual({ text: "ひこうき", lang: "ja" });
    expect(parse(speechUrl("apple", "en"))).toEqual({ text: "apple", lang: "en" });
  });
  it("言語がおかしい・空・長すぎるとだめ", () => {
    expect(parse("/api/tts?lang=fr&text=bonjour")).toBeNull();
    expect(parse("/api/tts?lang=ja&text=")).toBeNull();
    expect(parse("/api/tts?lang=ja&text=%F0%9F%8D%8E")).toBeNull();
    expect(parse(speechUrl("あ".repeat(MAX_SPEECH_TEXT), "ja"))).not.toBeNull();
    expect(parse(speechUrl("あ".repeat(MAX_SPEECH_TEXT + 1), "ja"))).toBeNull();
  });
});
