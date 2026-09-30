import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL が設定されていません");

// Supabase の Transaction pooler (ポート6543) はプリペアドステートメント非対応
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };
