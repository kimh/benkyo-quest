import { currentPlayer } from "@/lib/players";
import { QuestError, submitAnswer } from "@/lib/quests";

const MAX_VALUE_LENGTH = 50;

/** 1問に答える。body: { index: number, value: string } */
export async function POST(request: Request) {
  const player = await currentPlayer();
  if (!player) return Response.json({ error: "no_player" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const { index, value } = (body ?? {}) as { index?: unknown; value?: unknown };
  if (!Number.isInteger(index) || typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    return Response.json(await submitAnswer(player, index as number, value));
  } catch (e) {
    if (e instanceof QuestError) {
      return Response.json({ error: e.code }, { status: e.code === "no_quest" ? 404 : 400 });
    }
    throw e;
  }
}
