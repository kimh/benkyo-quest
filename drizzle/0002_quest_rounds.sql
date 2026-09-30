DROP INDEX "quests_player_date";--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "round" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "quests_player_date_round" ON "quests" USING btree ("player_id","date","round");