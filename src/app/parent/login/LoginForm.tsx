"use client";

import { useActionState } from "react";
import { PixelButton } from "@/components/PixelButton";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span>保護者PIN</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          className="rpg-window w-full px-4 py-3 text-center text-2xl tracking-widest outline-none"
        />
      </label>
      {state.error && <p className="text-accent">{state.error}</p>}
      <PixelButton type="submit" variant="accent" disabled={pending}>
        {pending ? "確認中…" : "ログイン"}
      </PixelButton>
    </form>
  );
}
