import { beforeEach, describe, expect, it } from "vitest";
import {
  checkFamilyPasscode,
  checkParentPin,
  familyToken,
  isValidFamilyToken,
  isValidParentToken,
  PARENT_SESSION_SECONDS,
  parentToken,
  signPlayerId,
  verifyPlayerToken,
} from "./session";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret";
  process.env.FAMILY_PASSCODE = "nokku";
  process.env.PARENT_PIN = "1234";
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

describe("parent", () => {
  const now = 1_700_000_000_000;
  it("PINを照合する", () => {
    expect(checkParentPin("1234")).toBe(true);
    expect(checkParentPin("123")).toBe(false);
    delete process.env.PARENT_PIN;
    expect(checkParentPin("")).toBe(false);
  });
  it("期限内だけ有効", () => {
    const token = parentToken(now);
    expect(isValidParentToken(token, now)).toBe(true);
    expect(isValidParentToken(token, now + PARENT_SESSION_SECONDS * 1000 - 1)).toBe(true);
    expect(isValidParentToken(token, now + PARENT_SESSION_SECONDS * 1000)).toBe(false);
  });
  it("期限を書きかえたり、PINを変えたりすると無効", () => {
    const [exp, sig] = parentToken(now).split(".");
    expect(isValidParentToken(`${Number(exp) + 60_000}.${sig}`, now)).toBe(false);
    expect(isValidParentToken("abc", now)).toBe(false);
    expect(isValidParentToken(undefined, now)).toBe(false);
    const token = parentToken(now);
    process.env.PARENT_PIN = "9999";
    expect(isValidParentToken(token, now)).toBe(false);
  });
});
