"use client";

import { useActionState, useState } from "react";
import { PixelButton } from "@/components/PixelButton";
import { REDEEM_NOTE_MAX } from "@/lib/game/gems";
import { redeem, type RedeemState } from "./actions";

const STEPS = [-10, -1, 1, 10];

/** わたす Gem の数を ボタンで えらんで、こうかんを おねがいする */
export function RedeemForm({ available }: { available: number }) {
  const [picked, setAmount] = useState(Math.min(10, available));
  // おねがいしたあと、つかえる Gem が へったときは その中に おさめる
  const amount = Math.min(picked, available);
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeem, {});

  return (
    <form action={action} className="rpg-window flex flex-col gap-3 p-4">
      <div className="text-center text-4xl text-gem">💎 {amount}</div>
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((d) => (
          <PixelButton
            key={d}
            type="button"
            className="min-h-12 px-1 py-1 text-lg"
            disabled={amount + d < 1 || amount + d > available}
            onClick={() => setAmount(amount + d)}
          >
            {d > 0 ? `+${d}` : d}
          </PixelButton>
        ))}
      </div>
      <input type="hidden" name="amount" value={amount} />
      <input
        name="note"
        maxLength={REDEEM_NOTE_MAX}
        placeholder="なにと こうかんしたい？（なくてもOK）"
        aria-label="なにと こうかんしたい？"
        className="rpg-window w-full px-3 py-2 text-lg outline-none placeholder:text-white/40"
      />
      {state.error && <p className="text-danger">{state.error}</p>}
      {state.done && <p className="text-ok">おうちの人に おねがいしたよ！</p>}
      <PixelButton type="submit" variant="accent" disabled={pending}>
        {pending ? "おくっています…" : "▶ おねがいする"}
      </PixelButton>
    </form>
  );
}
