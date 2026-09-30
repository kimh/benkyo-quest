import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  mathLevel: integer("math_level").notNull().default(1),
  englishLevel: integer("english_level").notNull().default(1),
  /** 保育園の「ひらがな」のレベル */
  japaneseLevel: integer("japanese_level").notNull().default(3),
  playerLevel: integer("player_level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastClearedDate: date("last_cleared_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quests = pgTable(
  "quests",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    /** JSTの日付 */
    date: date("date").notNull(),
    /** その日の何回目のクエストか（1〜MAX_QUESTS_PER_DAY） */
    round: integer("round").notNull().default(1),
    status: text("status", { enum: ["in_progress", "cleared"] })
      .notNull()
      .default("in_progress"),
    /** 生成済みの問題（正解を含むのでクライアントに直接返さない） */
    questions: jsonb("questions").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("quests_player_date_round").on(t.playerId, t.date, t.round)],
);

export const answers = pgTable(
  "answers",
  {
    id: serial("id").primaryKey(),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    questionIndex: integer("question_index").notNull(),
    subject: text("subject", { enum: ["math", "english", "japanese"] }).notNull(),
    unit: text("unit").notNull(),
    difficulty: integer("difficulty").notNull(),
    attempts: integer("attempts").notNull().default(0),
    correct: boolean("correct"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("answers_quest_question").on(t.questId, t.questionIndex)],
);

export const gemTransactions = pgTable("gem_transactions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: text("reason", { enum: ["correct", "clear_bonus", "redeem", "adjust"] }).notNull(),
  /** 二重付与防止用。例: "answer:12", "quest:3", "redeem:5" */
  refId: text("ref_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redemptionRequests = pgTable("redemption_requests", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  note: text("note").notNull().default(""),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
