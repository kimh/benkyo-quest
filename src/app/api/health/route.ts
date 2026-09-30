import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "ANTHROPIC_API_KEY",
  "FAMILY_PASSCODE",
  "PARENT_PIN",
  "SESSION_SECRET",
] as const;

/** デプロイ後の動作確認用。環境変数の有無（値は返さない）とDB接続を確認する */
export async function GET() {
  const env = Object.fromEntries(REQUIRED_ENV.map((k) => [k, Boolean(process.env[k])]));

  let database: "ok" | "error" = "ok";
  try {
    await db.execute(sql`select 1`);
  } catch (e) {
    console.error("health: db error", e);
    database = "error";
  }

  const ok = database === "ok" && Object.values(env).every(Boolean);
  return Response.json({ ok, database, env }, { status: ok ? 200 : 500 });
}
