import type { NextRequest } from "next/server";
import { parseSpeechRequest } from "@/lib/audio/speech-request";
import { synthesize } from "@/lib/tts";

/**
 * 文を読み上げた音声を返す。端末の音声合成が使えない（Fire タブレットの Silk など）ので、サーバーで作る。
 * 家族パスコードのチェックは proxy で行う。同じ文は CDN にキャッシュして作り直さない。
 */
export async function GET(request: NextRequest) {
  const req = parseSpeechRequest(request.nextUrl.searchParams);
  if (!req) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    const { data, mediaType } = await synthesize(req.text, req.lang);
    return new Response(new Blob([new Uint8Array(data)], { type: mediaType }), {
      headers: {
        "Content-Type": mediaType,
        "Cache-Control": "public, max-age=604800, s-maxage=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("tts: 読み上げを作れませんでした", e);
    return Response.json({ error: "tts_failed" }, { status: 502 });
  }
}
