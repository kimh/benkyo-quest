import { Knock } from "@/components/Knock";
import { MessageWindow } from "@/components/MessageWindow";
import { PixelButton } from "@/components/PixelButton";

export default function Title() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-center text-5xl text-accent drop-shadow-[4px_4px_0_#000]">勉強クエスト</h1>
      <Knock mood="waving" height={256} />
      <MessageWindow speaker="ノック" text="ワン！ いっしょに ぼうけんに でかけよう！" />
      <PixelButton variant="accent" className="w-full">
        ▶ はじめる
      </PixelButton>
    </main>
  );
}
