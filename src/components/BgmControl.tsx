"use client";

import { useEffect, useSyncExternalStore } from "react";
import { setSoundEnabled, soundEnabled, subscribeSound } from "@/lib/audio/prefs";
import { bgm } from "@/lib/audio/sound";

/** 画面右下のBGM・効果音ボタン。最初のタップで再生を始める（ブラウザの自動再生制限のため） */
export function BgmControl() {
  const enabled = useSyncExternalStore(subscribeSound, soundEnabled, () => true);

  useEffect(() => {
    if (!enabled) {
      bgm().stop();
      return;
    }
    const startOnGesture = () => bgm().start();
    document.addEventListener("pointerdown", startOnGesture, { once: true });
    document.addEventListener("keydown", startOnGesture, { once: true });
    return () => {
      document.removeEventListener("pointerdown", startOnGesture);
      document.removeEventListener("keydown", startOnGesture);
    };
  }, [enabled]);

  useEffect(() => {
    const onVisibility = () => (document.hidden ? bgm().suspend() : bgm().resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !enabled;
        if (next) bgm().start();
        setSoundEnabled(next);
      }}
      aria-label={enabled ? "おとを けす" : "おとを ならす"}
      aria-pressed={enabled}
      className="rpg-window fixed right-3 bottom-3 z-50 flex h-12 w-12 items-center justify-center p-0 text-xl"
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
