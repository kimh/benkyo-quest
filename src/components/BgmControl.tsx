"use client";

import { useEffect, useSyncExternalStore } from "react";
import { BgmPlayer } from "@/lib/audio/bgm";
import { FIELD_SONG } from "@/lib/audio/songs";

const STORAGE_KEY = "bq_bgm";
const listeners = new Set<() => void>();
let player: BgmPlayer | null = null;

function getPlayer() {
  player ??= new BgmPlayer(FIELD_SONG);
  return player;
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // 保存できなくても、この画面の間は切り替わる
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 画面右下のBGMボタン。最初のタップで再生を始める（ブラウザの自動再生制限のため） */
export function BgmControl() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true);

  useEffect(() => {
    if (!enabled) {
      getPlayer().stop();
      return;
    }
    const startOnGesture = () => getPlayer().start();
    document.addEventListener("pointerdown", startOnGesture, { once: true });
    document.addEventListener("keydown", startOnGesture, { once: true });
    return () => {
      document.removeEventListener("pointerdown", startOnGesture);
      document.removeEventListener("keydown", startOnGesture);
    };
  }, [enabled]);

  useEffect(() => {
    const onVisibility = () => (document.hidden ? getPlayer().suspend() : getPlayer().resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !enabled;
        if (next) getPlayer().start();
        writeEnabled(next);
      }}
      aria-label={enabled ? "BGMを けす" : "BGMを ならす"}
      aria-pressed={enabled}
      className="rpg-window fixed right-3 bottom-3 z-50 flex h-12 w-12 items-center justify-center p-0 text-xl"
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
