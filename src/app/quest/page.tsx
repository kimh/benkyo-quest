import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/players";
import { QuestPlayer } from "./QuestPlayer";

export default async function QuestPage() {
  const player = await currentPlayer();
  if (!player) redirect("/setup");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
      <QuestPlayer />
    </main>
  );
}
