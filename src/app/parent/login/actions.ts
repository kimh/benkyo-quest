"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkParentPin, PARENT_COOKIE, parentCookieOptions, parentToken } from "@/lib/session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const input = String(formData.get("pin") ?? "").trim();
  if (!checkParentPin(input)) {
    // 総当たりを遅くする
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "PINが違います" };
  }
  (await cookies()).set(PARENT_COOKIE, parentToken(), parentCookieOptions);
  redirect("/parent");
}
