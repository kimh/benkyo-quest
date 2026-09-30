import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** 家族パスコードを入力済みの端末に付けるCookie */
export const FAMILY_COOKIE = "bq_family";
/** 端末にひもづいた冒険の書(player)のCookie */
export const PLAYER_COOKIE = "bq_player";

/** ブラウザが許す最大(400日) */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET が設定されていません");
  return s;
}

function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** 長さに関係なく一定時間で比較する */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/**
 * 家族Cookieのトークン。パスコード自体のハッシュを混ぜるので、
 * パスコードを変更すると既存の端末はすべて再入力が必要になる。
 */
export function familyToken(): string {
  const passcode = process.env.FAMILY_PASSCODE ?? "";
  return hmac(`family:${sha256(passcode).toString("base64url")}`);
}

export function isValidFamilyToken(token: string | undefined): boolean {
  return !!token && safeEqual(token, familyToken());
}

export function checkFamilyPasscode(input: string): boolean {
  const passcode = process.env.FAMILY_PASSCODE;
  return !!passcode && safeEqual(input, passcode);
}

export function signPlayerId(id: number): string {
  return `${id}.${hmac(`player:${id}`)}`;
}

export function verifyPlayerToken(token: string | undefined): number | null {
  if (!token) return null;
  const [idPart, sig] = token.split(".");
  const id = Number(idPart);
  if (!Number.isInteger(id) || id <= 0 || !sig) return null;
  return safeEqual(sig, hmac(`player:${id}`)) ? id : null;
}
