-- Supabase の Data API（anon / publishable key）からテーブルに触れないようにする。
-- ポリシーは作らない＝anon/authenticated は全拒否。サーバーは postgres ロールで接続するので影響なし。
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gem_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "redemption_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
