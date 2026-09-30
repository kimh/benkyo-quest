import { redirect } from "next/navigation";
import { MAX_PLAYERS } from "@/lib/game/player";
import { currentPlayer, listPlayers } from "@/lib/players";
import { SetupFlow } from "./SetupFlow";

export default async function SetupPage() {
  if (await currentPlayer()) redirect("/home");
  const players = await listPlayers();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-4">
      <SetupFlow players={players} canCreate={players.length < MAX_PLAYERS} />
    </main>
  );
}
