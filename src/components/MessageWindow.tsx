"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  speaker?: string;
  /** 1文字ずつ表示する速さ(ms)。0で即時表示 */
  speed?: number;
  onDone?: () => void;
  children?: React.ReactNode;
};

/** RPG風のメッセージウィンドウ。テキストを1文字ずつ表示する */
export function MessageWindow({ text, speaker, speed = 40, onDone, children }: Props) {
  const [shown, setShown] = useState(speed === 0 ? text.length : 0);
  const [prevText, setPrevText] = useState(text);

  // テキストが変わったら最初から表示し直す
  if (text !== prevText) {
    setPrevText(text);
    setShown(speed === 0 ? text.length : 0);
  }

  useEffect(() => {
    if (shown >= text.length) {
      onDone?.();
      return;
    }
    const id = setTimeout(() => setShown((n) => n + 1), speed);
    return () => clearTimeout(id);
  }, [shown, text, speed, onDone]);

  const finished = shown >= text.length;

  return (
    <div
      className="rpg-window relative w-full p-4 text-lg leading-relaxed"
      onClick={() => setShown(text.length)}
    >
      {speaker && <div className="mb-1 text-accent">{speaker}</div>}
      <p className="min-h-[3.5em] whitespace-pre-wrap">{text.slice(0, shown)}</p>
      {finished && !children && <span className="blink absolute right-4 bottom-2">▼</span>}
      {finished && children}
    </div>
  );
}
