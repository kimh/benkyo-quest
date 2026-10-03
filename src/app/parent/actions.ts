"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Subject } from "@/lib/curriculum/units";
import { parseGemSettings } from "@/lib/game/gems";
import { parseSubjectLevel } from "@/lib/game/level";
import { approveRedemption, rejectRedemption, requireParent, setSubjectLevel } from "@/lib/parent";
import { getPlayer } from "@/lib/players";
import { PARENT_COOKIE } from "@/lib/session";
import { saveGemSettings } from "@/lib/settings";

export async function approve(formData: FormData): Promise<void> {
  await requireParent();
  const error = await approveRedemption(Number(formData.get("id")));
  revalidatePath("/parent", "layout");
  if (error) redirect(`/parent?error=${error}`);
}

export async function reject(formData: FormData): Promise<void> {
  await requireParent();
  await rejectRedemption(Number(formData.get("id")));
  revalidatePath("/parent", "layout");
}

export type GemSettingsState = { error?: string; done?: boolean };

export async function updateGemSettings(_prev: GemSettingsState, formData: FormData): Promise<GemSettingsState> {
  await requireParent();
  const settings = parseGemSettings(Object.fromEntries(formData));
  if (!settings) return { error: "0〜100の整数を入れてください" };
  await saveGemSettings(settings);
  revalidatePath("/parent");
  return { done: true };
}

const SUBJECTS: readonly Subject[] = ["math", "english", "japanese"];

export async function updateLevel(formData: FormData): Promise<void> {
  await requireParent();
  const player = await getPlayer(Number(formData.get("playerId")));
  const subject = SUBJECTS.find((s) => s === formData.get("subject"));
  const level = parseSubjectLevel(formData.get("level"));
  if (!player || !subject || level === null) return;
  await setSubjectLevel(player.id, subject, level);
  revalidatePath(`/parent/players/${player.id}`);
}

export async function logout(): Promise<void> {
  (await cookies()).delete(PARENT_COOKIE);
  redirect("/parent/login");
}
