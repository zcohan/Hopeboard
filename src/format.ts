// How numbers read on the board.

const MINUS = '−';

const sign = (n: number, s: string) => (n < 0 ? MINUS + s : s);
const trim = (n: number) => String(n).replace(/\.0$/, '');

/** Whole percent: 0.4785 → "48%", −0.032 → "−3%". */
export const pct = (x: number) => {
  const n = Math.round(x * 100);
  return sign(n, `${Math.abs(n)}%`);
};

/** Nearest half percent, for gaps against the bond or the index: 0.0355 → "3.5%". */
export const halfPct = (x: number) => {
  const n = Math.round(x * 200) / 2;
  return sign(n, `${trim(Math.abs(n))}%`);
};

/** One decimal, for the bond: 0.053 → "5.3%", 0.04 → "4%". */
export const decPct = (x: number) => {
  const n = Math.round(x * 1000) / 10;
  return sign(n, `${trim(Math.abs(n))}%`);
};

/** One decimal always, for the bond's top-right figure: 0.04 → "4.0%". */
export const decPctFixed = (x: number) => `${(x * 100).toFixed(1)}%`;

/** $ billions, to the nearest 1 under 10, 5 under 100 and 10 above: 6.05 → "$6 billion", 67.7 → "$70 billion". */
export const billions = (x: number) => {
  const a = Math.abs(x);
  const step = a < 10 ? 1 : a < 100 ? 5 : 10;
  const n = Math.round(a / step) * step;
  return n >= 1000 ? `$${trim(Math.round(n / 100) / 10)} trillion` : `$${n} billion`;
};

/** Two values from disagreeing sources: "20–42%" when they differ after rounding, else one value. */
export function range(xs: number[], f: (x: number) => string): string {
  const parts = [...new Set(xs.map(f))];
  if (parts.length === 1) return parts[0];
  // "$70 billion–$95 billion" → "$70–95 billion"; "20%–42%" → "20–42%"
  const [a, b] = parts;
  const unit = /[^\d.−]+$/.exec(a)?.[0] ?? '';
  return unit && b.endsWith(unit) ? `${a.slice(0, -unit.length)}–${b.replace(/^\$/, '')}` : `${a}–${b}`;
}

export const usd = (x: number) => `$${x.toLocaleString('en-US')}`;
