const JST_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** JSTの日付を "YYYY-MM-DD" で返す */
export function jstDate(at: Date = new Date()): string {
  return JST_FORMAT.format(at);
}

/** "YYYY-MM-DD" 同士の日数差 (b - a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
