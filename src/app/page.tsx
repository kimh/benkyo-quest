import { Knock } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelLink } from "@/components/PixelButton";
import { currentPlayer } from "@/lib/players";

export default async function Title() {
  const player = await currentPlayer();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-center text-5xl text-accent drop-shadow-[4px_4px_0_#000]">勉強クエスト</h1>
      <Knock mood="waving" height={256} />
      <MessageWindow
        speaker="ノック"
        text={
          player
            ? `${player.name}！ きょうも いっしょに ぼうけんしよう！`
            : "ワン！ いっしょに ぼうけんに でかけよう！"
        }
      />
      {player ? (
        <PixelLink href="/home" variant="accent" className="w-full">
          ▶ つづきから
        </PixelLink>
      ) : (
        <PixelLink href="/setup" variant="accent" className="w-full">
          ▶ はじめる
        </PixelLink>
      )}
    </main>
  );
}
