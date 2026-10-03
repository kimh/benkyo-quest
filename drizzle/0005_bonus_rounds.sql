ALTER TABLE "players" ADD COLUMN "bonus_rounds_date" date;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "bonus_rounds" integer DEFAULT 0 NOT NULL;