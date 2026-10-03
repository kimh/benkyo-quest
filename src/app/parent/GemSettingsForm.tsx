"use client";

import { useActionState } from "react";
import { PixelButton } from "@/components/PixelButton";
import { MAX_GEM_SETTING, type GemSettings } from "@/lib/game/gems";
import { updateGemSettings, type GemSettingsState } from "./actions";

const FIELDS: { name: keyof GemSettings; label: string }[] = [
  { name: "correctFirstTry", label: "1回目で正解" },
  { name: "correctRetry", label: "ヒントのあと正解" },
  { name: "questClear", label: "クエストクリア" },
];

export function GemSettingsForm({ settings }: { settings: GemSettings }) {
  const [state, action, pending] = useActionState<GemSettingsState, FormData>(updateGemSettings, {});

  return (
    <form action={action} className="rpg-window flex flex-col gap-3 p-4">
      {FIELDS.map((f) => (
        <label key={f.name} className="flex items-center justify-between gap-4">
          <span>{f.label}</span>
          <span className="flex items-center gap-2">
            <input
              name={f.name}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_GEM_SETTING}
              step={1}
              required
              defaultValue={settings[f.name]}
              className="w-20 border-2 border-white bg-transparent px-2 py-1 text-right"
            />
            <span className="text-gem">Gem</span>
          </span>
        </label>
      ))}
      {state.error && <p className="text-accent">{state.error}</p>}
      {state.done && !pending && <p className="text-ok">保存しました</p>}
      <PixelButton type="submit" className="min-h-10 py-1 text-base" disabled={pending}>
        {pending ? "保存中…" : "保存"}
      </PixelButton>
    </form>
  );
}
