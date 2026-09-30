import { describe, expect, it } from "vitest";
import { daysBetween, jstDate } from "./date";

describe("jstDate", () => {
  it("UTC 15:00 以降はJSTでは翌日", () => {
    expect(jstDate(new Date("2026-09-30T14:59:59Z"))).toBe("2026-09-30");
    expect(jstDate(new Date("2026-09-30T15:00:00Z"))).toBe("2026-10-01");
  });
});

describe("daysBetween", () => {
  it("月をまたいでも数えられる", () => {
    expect(daysBetween("2026-09-30", "2026-10-01")).toBe(1);
    expect(daysBetween("2026-10-01", "2026-10-01")).toBe(0);
  });
});
