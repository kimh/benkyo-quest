import { beforeEach, describe, expect, it } from "vitest";
import { checkFamilyPasscode, familyToken, isValidFamilyToken, signPlayerId, verifyPlayerToken } from "./session";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret";
  process.env.FAMILY_PASSCODE = "nokku";
});

describe("family", () => {
  it("パスコードを照合する", () => {
    expect(checkFamilyPasscode("nokku")).toBe(true);
    expect(checkFamilyPasscode("nokk")).toBe(false);
  });
  it("パスコードを変えると古いトークンは無効になる", () => {
    const token = familyToken();
    expect(isValidFamilyToken(token)).toBe(true);
    process.env.FAMILY_PASSCODE = "changed";
    expect(isValidFamilyToken(token)).toBe(false);
  });
  it("パスコード未設定なら誰も通さない", () => {
    delete process.env.FAMILY_PASSCODE;
    expect(checkFamilyPasscode("")).toBe(false);
  });
});

describe("player token", () => {
  it("署名したIDだけ受け付ける", () => {
    expect(verifyPlayerToken(signPlayerId(3))).toBe(3);
    const [, sig] = signPlayerId(3).split(".");
    expect(verifyPlayerToken(`4.${sig}`)).toBeNull();
    expect(verifyPlayerToken("3")).toBeNull();
    expect(verifyPlayerToken(undefined)).toBeNull();
  });
});
