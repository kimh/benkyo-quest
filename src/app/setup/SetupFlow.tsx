"use client";

import { useActionState, useState } from "react";
import { Knock, type KnockMood } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelButton } from "@/components/PixelButton";
import { gradeLabel, PRESCHOOL } from "@/lib/curriculum/units";
import { GRADES, NAME_MAX_LENGTH, validateName } from "@/lib/game/player";
import { createPlayer, linkPlayer, type SetupState } from "./actions";

type Props = {
  players: { id: number; name: string; grade: number }[];
  canCreate: boolean;
};

type Step =
  | { kind: "menu" }
  | { kind: "name" }
  | { kind: "grade" }
  | { kind: "confirm" }
  | { kind: "pick" }
  | { kind: "pickConfirm"; player: Props["players"][number] };

export function SetupFlow({ players, canCreate }: Props) {
  const [step, setStep] = useState<Step>(
    players.length === 0 ? { kind: "name" } : { kind: "menu" },
  );
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [grade, setGrade] = useState<number>();
  const [createState, create, creating] = useActionState<SetupState, FormData>(createPlayer, {});
  const [linkState, link, linking] = useActionState<SetupState, FormData>(linkPlayer, {});

  const error = createState.error ?? linkState.error;
  let mood: KnockMood = "neutral";
  let text: string;

  switch (step.kind) {
    case "menu":
      text = "ぼうけんのしょを どうする？";
      break;
    case "name":
      mood = nameError ? "confused" : "waving";
      text = nameError ?? "はじめまして！ ぼくは ノック。\nきみの なまえを おしえて！";
      break;
    case "grade":
      text = `${name}！ いい なまえだね！\nいま なんねんせい？ ほいくえんの ひとは「ほいくえん」を えらんでね。`;
      break;
    case "confirm":
      mood = error ? "confused" : "cheering";
      text = error ?? `${gradeLabel(grade ?? 1)}の ${name}だね！\nこれで ぼうけんのしょを つくるよ！`;
      break;
    case "pick":
      text = "どの ぼうけんのしょで あそぶ？";
      break;
    case "pickConfirm":
      mood = error ? "confused" : "cheering";
      text = error ?? `${step.player.name}の ぼうけんのしょで いいかな？\nこの たんまつは ${step.player.name}せんようになるよ`;
      break;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Knock mood={mood} height={192} />
      <MessageWindow speaker="ノック" text={text} />

      {step.kind === "menu" && (
        <div className="flex w-full flex-col gap-3">
          {canCreate && (
            <PixelButton variant="accent" onClick={() => setStep({ kind: "name" })}>
              ▶ あたらしく つくる
            </PixelButton>
          )}
          <PixelButton onClick={() => setStep({ kind: "pick" })}>▶ つづきの ぼうけんのしょ</PixelButton>
        </div>
      )}

      {step.kind === "name" && (
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = validateName(name);
            if (!r.ok) return setNameError(r.error);
            setName(r.name);
            setNameError(undefined);
            setStep({ kind: "grade" });
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX_LENGTH * 2}
            placeholder="なまえ"
            aria-label="なまえ"
            autoFocus
            className="rpg-window w-full px-4 py-3 text-center text-2xl outline-none placeholder:text-white/40"
          />
          <PixelButton type="submit" variant="accent">▶ けってい</PixelButton>
          {players.length > 0 && (
            <PixelButton type="button" onClick={() => setStep({ kind: "menu" })}>もどる</PixelButton>
          )}
        </form>
      )}

      {step.kind === "grade" && (
        <div className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            {GRADES.map((g) => (
              <PixelButton
                key={g}
                variant={g === grade ? "accent" : "default"}
                className={g === PRESCHOOL ? "col-span-3" : ""}
                onClick={() => {
                  setGrade(g);
                  setStep({ kind: "confirm" });
                }}
              >
                {g === PRESCHOOL ? "ほいくえん（5さい）" : `${g}ねん`}
              </PixelButton>
            ))}
          </div>
          <PixelButton onClick={() => setStep({ kind: "name" })}>もどる</PixelButton>
        </div>
      )}

      {step.kind === "confirm" && (
        <form action={create} className="flex w-full flex-col gap-3">
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="grade" value={grade} />
          <PixelButton type="submit" variant="accent" disabled={creating}>
            {creating ? "つくっています…" : "▶ はい"}
          </PixelButton>
          <PixelButton type="button" onClick={() => setStep({ kind: "name" })} disabled={creating}>
            いいえ
          </PixelButton>
        </form>
      )}

      {step.kind === "pick" && (
        <div className="flex w-full flex-col gap-3">
          {players.map((p) => (
            <PixelButton key={p.id} onClick={() => setStep({ kind: "pickConfirm", player: p })}>
              {p.name}（{gradeLabel(p.grade)}）
            </PixelButton>
          ))}
          <PixelButton onClick={() => setStep({ kind: "menu" })}>もどる</PixelButton>
        </div>
      )}

      {step.kind === "pickConfirm" && (
        <form action={link} className="flex w-full flex-col gap-3">
          <input type="hidden" name="playerId" value={step.player.id} />
          <PixelButton type="submit" variant="accent" disabled={linking}>
            {linking ? "よみこみちゅう…" : "▶ はい"}
          </PixelButton>
          <PixelButton type="button" onClick={() => setStep({ kind: "pick" })} disabled={linking}>
            いいえ
          </PixelButton>
        </form>
      )}
    </div>
  );
}
