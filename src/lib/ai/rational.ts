/**
 * 算数の答え合わせ用の、分数による厳密計算。
 * 浮動小数の誤差(0.1+0.2 など)を避けるため BigInt の分数で計算する。
 */
export type Rational = { n: bigint; d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function rat(n: bigint, d: bigint = 1n): Rational {
  if (d === 0n) throw new Error("0で割っています");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export const add = (a: Rational, b: Rational) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational) => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational) => rat(a.n * b.d, a.d * b.n);
export const eq = (a: Rational, b: Rational) => a.n === b.n && a.d === b.d;

/** "12" "-3" "0.25" を分数に。それ以外は null */
export function parseDecimal(s: string): Rational | null {
  const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return null;
  const frac = m[3] ?? "";
  const r = rat(BigInt(m[2] + frac), 10n ** BigInt(frac.length));
  return m[1] ? rat(-r.n, r.d) : r;
}

/** 数値の答えとして読める文字列（小数・分数・帯分数）を分数に。読めなければ null */
export function parseAnswerNumber(input: string): Rational | null {
  const s = normalize(input);
  const dec = parseDecimal(s);
  if (dec) return dec;
  // 帯分数 "1と2/3"、分数 "3/4"
  const m = /^(?:(\d+)と)?(\d+)\/(\d+)$/.exec(s);
  if (m && m[3] !== "0") {
    const f = rat(BigInt(m[2]), BigInt(m[3]));
    return m[1] ? add(rat(BigInt(m[1])), f) : f;
  }
  return null;
}

function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[×＊]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−ー–]/g, "-");
}

/** 四則演算とかっこだけの式を計算する。式として読めなければ null */
export function evaluate(expression: string): Rational | null {
  const s = normalize(expression);
  let i = 0;

  const number = (): Rational | null => {
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return parseDecimal(m[0]);
  };
  const factor = (): Rational | null => {
    if (s[i] === "-") {
      i++;
      const f = factor();
      return f && rat(-f.n, f.d);
    }
    if (s[i] === "(") {
      i++;
      const e = expr();
      if (s[i] !== ")") return null;
      i++;
      return e;
    }
    return number();
  };
  const term = (): Rational | null => {
    let left = factor();
    while (left && (s[i] === "*" || s[i] === "/")) {
      const op = s[i++];
      const right = factor();
      if (!right) return null;
      if (op === "/" && right.n === 0n) return null;
      left = op === "*" ? mul(left, right) : div(left, right);
    }
    return left;
  };
  const expr = (): Rational | null => {
    let left = term();
    while (left && (s[i] === "+" || s[i] === "-")) {
      const op = s[i++];
      const right = term();
      if (!right) return null;
      left = op === "+" ? add(left, right) : sub(left, right);
    }
    return left;
  };

  if (!s) return null;
  const result = expr();
  return result && i === s.length ? result : null;
}
