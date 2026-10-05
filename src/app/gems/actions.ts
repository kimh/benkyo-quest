"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/players";
import { cancelRedeem, requestRedeem } from "@/lib/redemptions";

export type RedeemState = { error?: string; done?: boolean };

const MESSAGES = {
  bad_amount: "その かずは えらべないよ。つかえる Gem の なかで えらんでね",
  bad_note: "メモは 30もじまでで かいてね",
  too_many: "おねがいちゅうが いっぱいだよ。おうちの人の へんじを まってね",
  robux_off: "Robux の こうかんは まだ できないよ。おうちの人に きいてみてね",
} as const;

export async function redeem(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const player = await currentPlayer();
  if (!player) return { error: "ぼうけんのしょが みつからないよ" };
  const kind = formData.get("kind") === "robux" ? "robux" : "reward";
  const error = await requestRedeem(player.id, kind, formData.get("amount"), formData.get("note"));
  if (error) return { error: MESSAGES[error] };
  revalidatePath("/gems");
  return { done: true };
}

export async function cancel(formData: FormData): Promise<void> {
  const player = await currentPlayer();
  if (!player) return;
  await cancelRedeem(player.id, Number(formData.get("id")));
  revalidatePath("/gems");
}
