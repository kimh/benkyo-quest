ALTER TABLE "players" ADD COLUMN "robux_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "redemption_requests" ADD COLUMN "kind" text DEFAULT 'reward' NOT NULL;