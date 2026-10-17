// The placeholder values each kind of card offers its wording.
import { approx, outcome, type OutcomeRef, type Tokens } from './copy';
import { nowModel, parseFig, type NowModel, type Parsed } from './engine';
import { INDEX_RETURN, NORMAL_YEARS, requiredGrowth } from './formula';
import { billions, decPct, halfPct, pct, range } from './format';
import type { Basis, Company, CopyEntry, EraFigures, Figures, PastEra, Scenario } from './types';

const need = <T>(v: T | null | undefined, what: string): T => {
  if (v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))) throw new Error(`Missing figure: ${what}`);
  return v;
};

const years = (p: Parsed, args: string[]) => (args.includes('bare') ? p.text.replace(/^[≈~]/, '') : p.text.replace(/^~/, ''));

/** "up from", "down from" or "the same as", comparing the figures as shown. */
export function compare(req: number, last: number): string {
  const a = Math.round(req * 100), b = Math.round(last * 100);
  return a > b ? 'up from' : a < b ? 'down from' : 'the same as';
}

function common(F: Figures): Tokens {
  return {
    index: (a) => approx(INDEX_RETURN, a),
    normalYears: () => String(NORMAL_YEARS),
    bond: (a) => approx(F.eras.now.bond, a, decPct),
  };
}

/** Tokens shared by every card that has a now-model: company cards and the S&P 500. */
function nowTokens(m: NowModel, basis: Basis, F: Figures, scenario: Scenario | undefined, extra: { peNow?: Parsed } = {}): Tokens {
  const scn = () => need(scenario, 'scenario');
  const req = () => need(m.req(basis), 'required growth');
  return {
    ...common(F),
    opening: () => (m.section === 'pricey' || m.section === 'loss' ? 'Only if' : 'If'),
    req: (a) => approx(req(), a),
    cmp: () => compare(req(), need(m.last, 'last-decade growth')),
    /** "— up from the ~15%/year of the last decade", or "— the same rate as over the last decade" (no repeated figure). */
    vsLast: () => {
      const c = compare(req(), need(m.last, 'last-decade growth'));
      return c === 'the same as' ? '— the same rate as over the last decade' : `— ${c} the ${approx(m.last!, [])}/year of the last decade`;
    },
    last: (a) => approx(need(m.last, 'last-decade growth'), a),
    industry: (a) => approx(need(m.industry, 'industry growth'), a),
    g: (a) => approx(m.g(scn()), ['bare', ...a]),
    outcome: (a) => {
      const ref: OutcomeRef = a[0] === 'index' || a[0] === 'its' ? a[0] : 'bond';
      return outcome(m.r(scn()), F.eras.now.bond, ref, a[0] === 'r');
    },
    r: () => `${range(m.r(scn()), halfPct)}`,
    vsBond: () => {
      const gaps = m.r(scn()).map((r) => r - F.eras.now.bond);
      const mean = gaps.reduce((x, y) => x + y, 0) / gaps.length;
      return `${range(gaps.map(Math.abs), halfPct)}/year ${mean >= 0 ? 'more' : 'less'}`;
    },
    pe: (a) => years(m.pe, a),
    pef: (a) => years(m.pef, a),
    peNow: (a) => years(extra.peNow ?? m.pe, a),
    reqProfit: () => `${range(need(m.reqProfit, 'required profit'), billions)}`,
  };
}

/** "~3.5% more than", "~4.5% less than" or "the same as": a yearly figure against the safe US bond. */
function vsBondPhrase(x: number, bond: number): string {
  const gap = halfPct(Math.abs(x - bond));
  return gap === '0%' ? 'the same as' : `${gap} ${x > bond ? 'more' : 'less'} than`;
}

export function companyNowTokens(co: Company, basis: Basis, F: Figures, entry: CopyEntry): Tokens {
  const m = nowModel(co, F);
  // what the business earns each year as a share of its price: Buffett's farm, in percent
  const earns = () => {
    const shown = need(m.shown(basis), 'years of profit');
    return 1 / need(shown.years.v, 'years of profit');
  };
  return {
    ...nowTokens(m, basis, F, entry.scenario as Scenario | undefined),
    earns: () => `${decPct(earns())}`,
    earnsVsBond: () => vsBondPhrase(earns(), F.eras.now.bond),
    pays: () => (co.now.y >= 0.01 ? `\n${decPct(co.now.y)} of it paid to you as dividends` : ''),
    fcast: () => {
      const g = need(co.now.forecast, 'forecast');
      const p = pct(Math.abs(g));
      return p === '0%' ? 'stay the same' : `${g > 0 ? 'grow' : 'fall'} ${p}`;
    },
    /** "~107% profit growth", "~27% fall in profit": the forecast as a value under its label. */
    fcastValue: () => {
      const g = need(co.now.forecast, 'forecast');
      const p = pct(Math.abs(g));
      return p === '0%' ? 'Profit flat' : g > 0 ? `${p} profit growth` : `${p} fall in profit`;
    },
    p: ([key, ...a]) => {
      const v = need(co.now.profits?.[key], `profit figure ${key}`);
      const n = a.includes('abs') ? Math.abs(v) : v;
      return (n < 0 ? '−' : '') + `$${Math.abs(n).toLocaleString('en-US')} billion`;
    },
  };
}

export function spxNowTokens(F: Figures, basis: Basis, entry: CopyEntry): Tokens {
  const s = F.eras.now.spx;
  const m = nowModel({ now: { pe: s.pe, pef: s.pef ?? null, y: s.y, last: s.last } }, F);
  return nowTokens(m, basis, F, entry.scenario as Scenario | undefined);
}

export function eraTokens(F: Figures, E: EraFigures): Tokens {
  const pe = parseFig(E.spx.pe);
  return {
    ...common(F),
    bond: (a) => approx(E.bond, a, decPct),
    goldReturn: (a) => approx(need(E.goldReturn, 'gold return'), a),
    req: (a) => approx(requiredGrowth(E.spx.y, need(pe.v, 'S&P years of profit')), a),
    pe: (a) => years(pe, a),
    peNow: (a) => years(parseFig(F.eras.now.spx.pe), a),
    profit: (a) => approx(need(E.spx.profit, 'S&P profit growth'), a),
    stock: (a) => approx(need(E.spx.stock, 'S&P return'), a),
    era: () => E.label,
    highSince: () => need(E.bondHighSince, 'year the bond was last this high'),
  };
}

export function companyPastTokens(co: Company, era: PastEra, F: Figures): Tokens {
  const p = need(co.past[era], `${co.id} ${era}`);
  const pe = parseFig(p.pe);
  return {
    ...common(F),
    req: (a) => approx(requiredGrowth(p.y ?? co.now.y, need(pe.v, 'years of profit')), a),
    pe: (a) => years(pe, a),
    peNow: (a) => years(parseFig(co.now.pe), a),
    profit: (a) => approx(need(p.profit, `${co.id} ${era} profit growth`), a),
    stock: (a) => approx(need(p.stock, `${co.id} ${era} stock return`), a),
  };
}
