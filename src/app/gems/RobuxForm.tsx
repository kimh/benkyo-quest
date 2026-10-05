"use client";

import { useActionState, useState } from "react";
import { PixelButton } from "@/components/PixelButton";
import { ROBUX_GEM_STEP, robuxFor } from "@/lib/game/gems";
import { redeem, type RedeemState } from "./actions";

/** Robux と こうかんする Gem の数を ROBUX_GEM_STEP ずつ えらんで、おねがいする */
export function RobuxForm({ available }: { available: number }) {
  const max = Math.floor(available / ROBUX_GEM_STEP) * ROBUX_GEM_STEP;
  const [picked, setAmount] = useState(ROBUX_GEM_STEP);
  // おねがいしたあと、つかえる Gem が へったときは その中に おさめる
  const amount = Math.min(picked, max);
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeem, {});

  if (max === 0) {
    return (
      <p className="rpg-window p-4 text-center">
        あと 💎 {ROBUX_GEM_STEP - available} で Robux と こうかん できるよ！
      </p>
    );
  }

  return (
    <form action={action} className="rpg-window flex flex-col gap-3 p-4">
      <div className="text-center text-3xl">
        <span className="text-gem">💎 {amount}</span>
        <span className="mx-2">→</span>
        <span className="text-ok">{robuxFor(amount)} Robux</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[-ROBUX_GEM_STEP, ROBUX_GEM_STEP].map((d) => (
          <PixelButton
            key={d}
            type="button"
            className="min-h-12 px-1 py-1 text-lg"
            disabled={amount + d < ROBUX_GEM_STEP || amount + d > max}
            onClick={() => setAmount(amount + d)}
          >
            {d > 0 ? `+${d}` : d}
          </PixelButton>
        ))}
      </div>
      <input type="hidden" name="kind" value="robux" />
      <input type="hidden" name="amount" value={amount} />
      {state.error && <p className="text-danger">{state.error}</p>}
      {state.done && <p className="text-ok">おうちの人に おねがいしたよ！</p>}
      <PixelButton type="submit" variant="accent" disabled={pending}>
        {pending ? "おくっています…" : "▶ Robux に こうかん"}
      </PixelButton>
    </form>
  );
}
