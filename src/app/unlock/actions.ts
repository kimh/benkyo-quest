"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkFamilyPasscode, cookieOptions, FAMILY_COOKIE, familyToken } from "@/lib/session";

export type UnlockState = { error?: string };

export async function unlock(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const input = String(formData.get("passcode") ?? "").trim();
  if (!checkFamilyPasscode(input)) {
    // 総当たりを遅くする
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "あいことばが ちがうみたい…" };
  }
  (await cookies()).set(FAMILY_COOKIE, familyToken(), cookieOptions);
  redirect("/");
}
