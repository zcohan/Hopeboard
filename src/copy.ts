// Fills card wording from data/cards.json with computed numbers.
//
// Wording is plain text with **bold** and {placeholders}. A placeholder is a name
// plus optional arguments: {req}, {req:bare}, {outcome:index}, {p:last:abs}.
// Unknown placeholders throw, so a typo never reaches the board.
import { INDEX_RETURN, decadeChange } from './formula';
import { halfPct, pct, range } from './format';

export type Tokens = Record<string, (args: string[]) => string>;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class CopyError extends Error {}

export function fill(template: string, tokens: Tokens, where: string): string {
  const html = template
    .split(/(\{[^}]+\})/)
    .map((part) => {
      if (!/^\{[^}]+\}$/.test(part)) return esc(part);
      const [name, ...args] = part.slice(1, -1).split(':');
      const fn = tokens[name];
      if (!fn) throw new CopyError(`${where}: unknown placeholder ${part}`);
      return fn(args);
    })
    .join('');
  return html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/** Placeholders a template uses, for checks. */
export const placeholders = (template: string) => [...template.matchAll(/\{([^}:]+)[^}]*\}/g)].map((m) => m[1]);

/** "~48%" or, with :bare, "48%"; :abs drops the sign. */
export function approx(x: number, args: string[], f: (x: number) => string = pct): string {
  const v = args.includes('abs') ? Math.abs(x) : x;
  return f(v); // figures are rounded; the footer says so once instead of a ~ on each
}

export type OutcomeRef = 'bond' | 'index' | 'its';

/**
 * The consequence: what you'd make or lose at the scenario's return.
 * Losses read "you may lose X% of your investment" (red). Otherwise the
 * gap to the safe US bond (or the index), with "still" only when it beats it.
 * withReturn adds the return itself: "you'd still make ~8%/year, ~3%/year more than…".
 */
export function outcome(rs: number[], bond: number, ref: OutcomeRef, withReturn: boolean): string {
  const changes = rs.map(decadeChange);
  if (changes.every((c) => c < 0))
    return `you may lose <b class="loss">${range(changes.map((c) => -c), pct)} of your investment</b>`;
  const base = ref === 'bond' ? bond : INDEX_RETURN;
  const what = ref === 'bond' ? 'the safe US bond' : ref === 'index' ? 'the index’s 10% average' : 'its 10% average';
  const gaps = rs.map((r) => r - base);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const ret = withReturn ? `${range(rs, halfPct)}/year, ` : '';
  if (halfPct(Math.abs(mean)) === '0%') return `you’d make ${ret}<b>the same</b> as ${what}`;
  const gap = range(gaps.map(Math.abs), halfPct);
  return mean > 0
    ? `you’d still make ${ret}<b>${gap}/year more</b> than ${what}`
    : `you’d make ${ret}<b>${gap}/year less</b> than ${what}`;
}
