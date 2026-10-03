import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { DEFAULT_GEM_SETTINGS, parseGemSettings, type GemSettings } from "@/lib/game/gems";

const GEMS_KEY = "gems";

/** もらえるGemの数。保存されていなければデフォルト */
export async function getGemSettings(): Promise<GemSettings> {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, GEMS_KEY));
  const value = row?.value;
  if (!value || typeof value !== "object") return DEFAULT_GEM_SETTINGS;
  return parseGemSettings(value as Record<string, unknown>) ?? DEFAULT_GEM_SETTINGS;
}

export async function saveGemSettings(settings: GemSettings): Promise<void> {
  await db
    .insert(schema.settings)
    .values({ key: GEMS_KEY, value: settings })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: settings } });
}
