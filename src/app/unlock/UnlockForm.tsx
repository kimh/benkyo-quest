"use client";

import { useActionState } from "react";
import { Knock } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelButton } from "@/components/PixelButton";
import { unlock, type UnlockState } from "./actions";

export function UnlockForm() {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlock, {});

  return (
    <form action={action} className="flex w-full flex-col items-center gap-6">
      <Knock mood={state.error ? "confused" : "neutral"} height={192} />
      <MessageWindow
        speaker="ノック"
        text={state.error ?? "ここは かぞくの ひみつきち。\nあいことばを おしえて！"}
      />
      <input
        name="passcode"
        type="password"
        autoComplete="off"
        required
        aria-label="あいことば"
        className="rpg-window w-full px-4 py-3 text-center text-2xl tracking-widest outline-none"
      />
      <PixelButton type="submit" variant="accent" className="w-full" disabled={pending}>
        {pending ? "たしかめちゅう…" : "▶ けってい"}
      </PixelButton>
    </form>
  );
}
