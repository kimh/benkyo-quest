import { describe, expect, it } from "vitest";
import { eq, evaluate, parseAnswerNumber, rat } from "./rational";

describe("evaluate", () => {
  it("四則演算と優先順位", () => {
    expect(evaluate("2+3*4")).toEqual(rat(14n));
    expect(evaluate("(2+3)*4")).toEqual(rat(20n));
    expect(evaluate("7-2-1")).toEqual(rat(4n));
    expect(evaluate("12÷4×3")).toEqual(rat(9n));
  });
  it("小数は誤差なく計算できる", () => {
    expect(eq(evaluate("0.1+0.2")!, parseAnswerNumber("0.3")!)).toBe(true);
    expect(eq(evaluate("2.4*1.5")!, parseAnswerNumber("3.6")!)).toBe(true);
  });
  it("分数の計算", () => {
    expect(evaluate("1/2+1/3")).toEqual(rat(5n, 6n));
  });
  it("式でないもの・0除算は null", () => {
    expect(evaluate("")).toBeNull();
    expect(evaluate("2+")).toBeNull();
    expect(evaluate("3/0")).toBeNull();
    expect(evaluate("Math.pow(2,3)")).toBeNull();
    expect(evaluate("(1+2")).toBeNull();
  });
});

describe("parseAnswerNumber", () => {
  it("整数・小数・分数・帯分数・全角", () => {
    expect(parseAnswerNumber("12")).toEqual(rat(12n));
    expect(parseAnswerNumber("１２")).toEqual(rat(12n));
    expect(parseAnswerNumber("0.25")).toEqual(rat(1n, 4n));
    expect(parseAnswerNumber("3/4")).toEqual(rat(3n, 4n));
    expect(parseAnswerNumber("1と1/2")).toEqual(rat(3n, 2n));
  });
  it("数でないものは null", () => {
    expect(parseAnswerNumber("3じ")).toBeNull();
    expect(parseAnswerNumber("apple")).toBeNull();
    expect(parseAnswerNumber("1/0")).toBeNull();
  });
});
