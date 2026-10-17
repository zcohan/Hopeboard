// Turns figures.json into the numbers each card shows. Nothing here is typed in:
// every return and required growth comes from src/formula.ts.
import {
  INDEX_RETURN, NORMAL_YEARS,
  annualReturn, annualReturnFromProfit, decadeChange, requiredGrowth, requiredProfit,
} from './formula';
import type { Basis, Company, Fig, Figures, NowFigures, PastEra, Scenario } from './types';

export interface Parsed {
  v: number | null; // value used in sums
  text: string; // as shown: "≈180", "35–38", "346"
  loss: boolean; // no profit to price
}

export function parseFig(f: Fig): Parsed {
  if (f === null || f === undefined) return { v: null, text: '', loss: false };
  if (typeof f === 'number') return { v: f, text: f >= 1000 ? f.toLocaleString('en-US') : String(f), loss: false };
  if (f === 'loss') return { v: null, text: 'loss', loss: true };
  const range = /^(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)$/.exec(f);
  if (range) return { v: (Number(range[1]) + Number(range[2])) / 2, text: f, loss: false };
  const n = Number(f.replace(/^[≈~]/, ''));
  if (Number.isNaN(n)) throw new Error(`Unreadable figure: ${f}`);
  return { v: n, text: f, loss: false };
}

export type Section = 'pricey' | 'normal' | 'bargain' | 'loss';

/** Pricey at 14% or more, Normal from 10%, Bargain under 10%, on the rounded figure as shown.
 * No profit to price goes to Losing money: it can't be ranked by the growth its price needs. */
export function sectionOf(req: number | null): Section {
  if (req === null) return 'loss';
  const r = Math.round(req * 100);
  return r >= 14 ? 'pricey' : r >= 10 ? 'normal' : 'bargain';
}

export const isDollarCard = (n: NowFigures) => n.value !== undefined || n.yearsOfRevenue !== undefined;

/** Today's value in $ billions for a dollar card, one or two sources. */
export function dollarValues(n: NowFigures): number[] {
  if (n.value !== undefined) return Array.isArray(n.value) ? n.value : [n.value];
  const yrs = parseFig(n.yearsOfRevenue ?? null).v;
  const revenue = n.profits?.revenue;
  if (yrs === null || revenue === undefined) throw new Error('Dollar card needs value or years of revenue and revenue');
  return [yrs * revenue];
}

export interface NowModel {
  pe: Parsed; // years of last year's profit
  pef: Parsed; // years of next year's forecast
  /** Which basis the top-right figure shows; falls back when one is missing. */
  shown: (b: Basis) => { years: Parsed; basis: Basis } | null;
  req: (b: Basis) => number | null;
  /** The required growth that decides the section (last year's profit when there is one). */
  sectionReq: number | null;
  section: Section;
  y: number;
  last: number | null;
  industry: number | null;
  /** Scenario growth per year. */
  g: (s: Scenario) => number;
  /** Scenario return per year; two values when sources disagree on a dollar card's value. */
  r: (s: Scenario) => number[];
  reqProfit: number[] | null;
}

export function nowModel(co: { now: NowFigures; industry?: string }, F: Figures): NowModel {
  const n = co.now;
  const pe = parseFig(n.pe), pef = parseFig(n.pef);
  const req = (b: Basis) => {
    const p = b === 't' && pe.v !== null ? pe : pef.v !== null ? pef : pe;
    return p.v === null ? null : requiredGrowth(n.y, p.v);
  };
  const dollar = isDollarCard(n);
  // lost money last year: the section is set by last year's profit, so a forecast profit doesn't move it
  // lost money, or barely profitable (earning under 0.5% of its price: more than 200 years of profit)
  const lostMoney = pe.loss || (n.profits?.last ?? 0) < 0 || (pe.v !== null && pe.v > 200);
  const sectionReq = dollar && pe.v === null && pef.v === null ? null : req('t');
  const industry = co.industry ? F.industries[co.industry]?.growth ?? null : null;
  const last = n.last ?? null;
  const g = (s: Scenario): number => {
    switch (s.anchor) {
      case 'industry':
        if (industry === null) throw new Error('Industry scenario on a card with no industry');
        return industry;
      case 'none': return 0;
      case 'last':
        if (last === null) throw new Error('Last-decade scenario on a card with no decade of profit');
        return last;
      // the average big US company: the S&P 500's profit growth over the last decade, computed from data
      case 'average': return F.eras.now.spx.last ?? (() => { throw new Error('S&P last-decade growth missing'); })();
      case 'endsAt': return Math.pow(s.factor, 1 / 10) - 1;
      case 'unanchored': return s.g;
      case 'profit': return NaN; // dollar scenario, see r()
    }
  };
  const r = (s: Scenario): number[] => {
    if (s.anchor === 'profit') {
      const p = n.profits?.[s.key];
      if (p === undefined) throw new Error(`No profit figure "${s.key}"`);
      return dollarValues(n).map((v) => annualReturnFromProfit(p, v, n.y));
    }
    const base = pe.v ?? pef.v;
    if (base === null) throw new Error('No years of profit to compute a return from');
    return [annualReturn(g(s), n.y, base)];
  };
  return {
    pe, pef,
    shown: (b) => {
      if (b === 'f' && pef.v !== null) return { years: pef, basis: 'f' };
      if (pe.v !== null) return { years: pe, basis: 't' };
      if (pef.v !== null) return { years: pef, basis: 'f' };
      return null;
    },
    req, sectionReq, section: lostMoney ? 'loss' : sectionOf(sectionReq), y: n.y, last, industry, g, r,
    reqProfit: dollar ? dollarValues(n).map((v) => requiredProfit(v, n.y)) : null,
  };
}

export interface PastModel {
  pe: Parsed;
  req: number | null;
  section: Section;
  profit?: number;
  stock?: number;
}

export function pastModel(co: Company, era: PastEra): PastModel | null {
  const p = co.past[era];
  if (!p) return null;
  const pe = parseFig(p.pe);
  const req = pe.v === null ? null : requiredGrowth(p.y ?? co.now.y, pe.v);
  return { pe, req, section: sectionOf(req), profit: p.profit, stock: p.stock };
}

export { INDEX_RETURN, NORMAL_YEARS, decadeChange };
