import { describe, expect, it } from "vitest";
import { courseUnits, EIKEN_GRADES, EIKEN_UNITS, eikenLabel, findEikenUnit, parseEikenGrade } from "./eiken";
import { CURRICULUM, unitsFor } from "./units";

describe("parseEikenGrade", () => {
  it("決まった級だけ受け付ける", () => {
    expect(parseEikenGrade("3")).toBe("3");
    expect(parseEikenGrade("pre2")).toBe("pre2");
    expect(parseEikenGrade("1")).toBeNull();
    expect(parseEikenGrade("school")).toBeNull();
    expect(parseEikenGrade(null)).toBeNull();
  });
});

describe("eikenLabel", () => {
  it("準2級は「準」をつける", () => {
    expect(eikenLabel("5")).toBe("英検5級");
    expect(eikenLabel("pre2")).toBe("英検準2級");
  });
});

describe("courseUnits", () => {
  it("英検の級があれば英語だけ級の単元にする", () => {
    expect(courseUnits(5, "english", "3")).toBe(EIKEN_UNITS["3"]);
    expect(courseUnits(5, "math", "3")).toEqual(unitsFor(5, "math"));
    expect(courseUnits(5, "english", null)).toEqual(unitsFor(5, "english"));
  });
});

describe("EIKEN_UNITS", () => {
  it("どの級にも単元があり、id は学年の単元ともかぶらない", () => {
    const schoolIds = new Set(
      Object.values(CURRICULUM).flatMap((c) => Object.values(c).flatMap((units) => units.map((u) => u.id))),
    );
    const ids = EIKEN_GRADES.flatMap((g) => EIKEN_UNITS[g].map((u) => u.id));
    expect(EIKEN_GRADES.every((g) => EIKEN_UNITS[g].length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => schoolIds.has(id))).toEqual([]);
    expect(findEikenUnit("k3-perfect")?.name).toBe("現在完了");
  });
});
