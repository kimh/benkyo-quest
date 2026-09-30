"use server";

import { count } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { INITIAL_SUBJECT_LEVEL, MAX_PLAYERS, parseGrade, validateName } from "@/lib/game/player";
import { currentPlayer, getPlayer } from "@/lib/players";
import { cookieOptions, PLAYER_COOKIE, signPlayerId } from "@/lib/session";

export type SetupState = { error?: string };

async function bindDevice(playerId: number) {
  (await cookies()).set(PLAYER_COOKIE, signPlayerId(playerId), cookieOptions);
}

export async function createPlayer(_prev: SetupState, formData: FormData): Promise<SetupState> {
  // 端末の切り替えは保護者画面から行う
  if (await currentPlayer()) redirect("/home");

  const name = validateName(formData.get("name"));
  if (!name.ok) return { error: name.error };
  const grade = parseGrade(formData.get("grade"));
  if (!grade) return { error: "がくねんを えらんでね" };

  const [{ n }] = await db.select({ n: count() }).from(schema.players);
  if (n >= MAX_PLAYERS) return { error: "ぼうけんのしょが いっぱいだよ。おうちの人に きいてね" };

  const [player] = await db
    .insert(schema.players)
    .values({
      name: name.name,
      grade,
      mathLevel: INITIAL_SUBJECT_LEVEL,
      englishLevel: INITIAL_SUBJECT_LEVEL,
    })
    .returning({ id: schema.players.id });

  await bindDevice(player.id);
  redirect("/home");
}

export async function linkPlayer(_prev: SetupState, formData: FormData): Promise<SetupState> {
  if (await currentPlayer()) redirect("/home");

  const player = await getPlayer(Number(formData.get("playerId")));
  if (!player) return { error: "ぼうけんのしょが みつからないよ" };

  await bindDevice(player.id);
  redirect("/home");
}
