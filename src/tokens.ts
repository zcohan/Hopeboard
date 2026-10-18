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

/** "up 143%" or "down 25%". */
const move = (x: number) => `${x >= 0 ? 'up' : 'down'} ${pct(Math.abs(x))}`;

const years = (p: Parsed, args: string[]) => (args.includes('bare') ? p.text.replace(/^[≈~]/, '') : p.text.replace(/^~/, ''));

/** "grew 11%/year", "fell 5%/year" or "barely changed" (one year: no "/year"), compared as printed */
const moved = (g: number, perYear: boolean, up = 'grew', down = 'fell') => {
  const p = pct(Math.abs(g));
  return p === '0%' ? 'barely changed' : `${g > 0 ? up : down} ${p}${perYear ? '/year' : ''}`;
};

/** "more than", "less than" or "the same as", comparing the figures as shown. */
export function compare(req: number, last: number): string {
  const a = Math.round(req * 100), b = Math.round(last * 100);
  return a > b ? 'more than' : a < b ? 'less than' : 'the same as';
}

/** "+47%" or "−1%": a required growth with its sign, as a headline */
const signed = (g: number) => { const p = pct(g); return p.startsWith('−') || p === '0%' ? p : `+${p}`; };

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
    /** " & the stock corrects" on Pricey cards, where buyers going back to ordinary years of profit drives the loss */
    /** " & the stock corrects" on Pricey cards, where buyers going back to ordinary years of profit drives the loss */
    corrects: () => (m.section === 'pricey' ? ' & the stock corrects' : ''),
    /** " (5.5x today’s profit by 2036)": the requirement as the profit it adds up to, from 4%/year */
    reqTimes: () => {
      // on the forecast view the growth starts from next year's profit, so "times today's" wouldn't hold
      if (basis === 'f') return '';
      // from the growth as the headline shows it, so equal headlines give equal multiples
      const g = Math.round(req() * 100) / 100;
      if (g < 0.04) return '';
      const x = Math.pow(1 + g, 10);
      const t = x >= 10 ? String(Math.round(x)) : String(Math.round(x * 2) / 2);
      return ` (${t}x today’s profit by ${+(F.asOf.match(/\d{4}/)?.[0] ?? NaN) + 10})`;
    },
    req: (a) => approx(req(), a),
    /** "+47%" or "−1%": the required growth with its sign, as a headline */
    reqSigned: () => signed(req()),
    cmp: () => compare(req(), need(m.last, 'last-decade growth')),
    /** "More than the 15%/year of the last decade", or "The same rate as over the last decade": a note under the requirement */
    vsLastNote: () => {
      const c = compare(req(), need(m.last, 'last-decade growth'));
      return c === 'the same as' ? 'The same rate as over the last decade' : `${c[0].toUpperCase()}${c.slice(1)} the ${approx(m.last!, [])}/year of the last decade`;
    },
    /** "— more than the 15%/year of the last decade", or "— the same rate as over the last decade" (no repeated figure). */
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
  return gap === '0%' ? 'The same as' : `${gap} ${x > bond ? 'more' : 'less'} than`;
}

/** What the business earns each year as a share of its price (Buffett's farm, in percent), against the bond, and the dividend share. */
function farmTokens(m: ReturnType<typeof nowModel>, basis: Basis, F: Figures, y: number): Tokens {
  const earns = () => {
    const shown = need(m.shown(basis), 'years of profit');
    return 1 / need(shown.years.v, 'years of profit');
  };
  return {
    earns: () => (earns() < 0.001 ? 'Under 0.1%' : decPct(earns())),
    earnsVsBond: () => vsBondPhrase(earns(), F.eras.now.bond),
    // shown only when it changes the story (3% or more); smaller dividends still count in Priced for
    pays: () => (y >= 0.03 ? `\n${decPct(y)} of it paid to you as dividends` : ''),
  };
}

export function companyNowTokens(co: Company, basis: Basis, F: Figures, entry: CopyEntry): Tokens {
  const m = nowModel(co, F, basis);
  return {
    ...nowTokens(m, basis, F, entry.scenario as Scenario | undefined),
    ...farmTokens(m, basis, F, co.now.y),
    fcast: () => {
      const g = need(co.now.forecast, 'forecast');
      const p = pct(Math.abs(g));
      return p === '0%' ? 'stay the same' : `${g > 0 ? 'grow' : 'fall'} ${p}`;
    },
    ytd: () => move(need(co.now.ytd, 'change this year')),
    fromHigh: () => pct(need(co.now.fromHigh, 'year high').below),
    highMonth: () => need(co.now.fromHigh, 'year high').month,
    rev: () => pct(need(co.now.revenueGrowth, 'revenue growth')),
    capex: () => `$${need(co.now.capex, 'spending on buildings and equipment')} billion`,
    listLow: () => pct(Math.abs(need(co.now.listing, 'listing range').low)),
    listHigh: () => pct(need(co.now.listing, 'listing range').high),
    listMonth: () => need(co.now.listing, 'listing range').month,
    /** last year's change in profit per share: "rose 32%" or "fell 18%" */
    profit1y: () => { const g = need(co.past.y1?.profit, 'profit change over the last year'); return `${g >= 0 ? 'rose' : 'fell'} ${pct(Math.abs(g))}`; },
    oil: () => `$${need(F.eras.now.oil, 'oil price')}`,
    /** "~107% profit growth", "~27% fall in profit": the forecast as a value under its label. */
    fcastValue: () => {
      const g = need(co.now.forecast, 'forecast');
      const p = pct(Math.abs(g));
      // "an 8% fall", "an 18% fall", "a 27% fall": the article goes by how the number is said
      const an = /^(8|11|18)/.test(p) ? 'an' : 'a';
      return p === '0%' ? 'Profit flat' : g > 0 ? `${p} profit growth` : `${an} ${p} fall in profit`;
    },
    /** cash beyond debt (or debt beyond cash) in years of the card's own profit: "8 years", "1 year", "half a year" */
    netYears: () => {
      const b = need(co.now.balance, 'cash and debt');
      const v = Math.abs(b.cash - b.debt) / need(b.profit, 'a year of profit');
      return v >= 1.5 ? `${Math.round(v)} years` : v >= 0.75 ? '1 year' : 'half a year';
    },
    /** stakes in other companies in years of the card's own profit, worded like netYears */
    stakeYears: () => {
      const b = need(co.now.balance, 'cash and debt');
      const v = need(b.stakes, 'stakes') / need(b.profit, 'a year of profit');
      return v >= 1.5 ? `${Math.round(v)} years` : v >= 0.75 ? '1 year' : 'half a year';
    },
    /** when the dollar figures are from: "last year", or "in the first half of 2026" for a new listing */
    profitsPeriod: () => co.now.profitsPeriod ?? 'last year',
    divYield: () => decPct(co.now.y),
    /** the yearly change in the share count, without its sign: "4%", "0.7%" */
    shareRate: () => decPct(Math.abs(need(co.now.shares, 'share count change').rate)),
    shareYears: () => String(need(co.now.shares, 'share count change').years),
    p: ([key, ...a]) => {
      const v = need(co.now.profits?.[key], `profit figure ${key}`);
      const n = a.includes('abs') ? Math.abs(v) : v;
      // under a billion in millions: "$50 million", not "$0.05 billion"
      const m = Math.abs(n);
      return (n < 0 ? '−' : '') + (m < 1 ? `$${Math.round(m * 100) * 10} million` : `$${m.toLocaleString('en-US')} billion`);
    },
  };
}

export function spxNowTokens(F: Figures, basis: Basis, entry: CopyEntry): Tokens {
  const s = F.eras.now.spx;
  const m = nowModel({ now: { pe: s.pe, pef: s.pef ?? null, y: s.y, last: s.last } }, F, basis);
  return { ...nowTokens(m, basis, F, entry.scenario as Scenario | undefined), ...farmTokens(m, basis, F, s.y) };
}

export function eraTokens(F: Figures, E: EraFigures): Tokens {
  const pe = parseFig(E.spx.pe);
  return {
    ...common(F),
    bond: (a) => approx(E.bond, a, decPct),
    goldReturn: (a) => approx(need(E.goldReturn, 'gold return'), a),
    req: (a) => approx(requiredGrowth(E.spx.y, need(pe.v, 'S&P years of profit')), a),
    reqSigned: () => signed(requiredGrowth(E.spx.y, need(pe.v, 'S&P years of profit'))),
    /** "Rose 9%" or "Fell 4%": gold's return since then, by its sign */
    goldMove: () => { const g = need(E.goldReturn, 'gold return'); return `${g >= 0 ? 'Rose' : 'Fell'} ${pct(Math.abs(g))}`; },
    pe: (a) => years(pe, a),
    peNow: (a) => years(parseFig(F.eras.now.spx.pe), a),
    profit: (a) => approx(need(E.spx.profit, 'S&P profit growth'), a),
    stock: (a) => approx(need(E.spx.stock, 'S&P return'), a),
    era: () => E.label,
    profitMove: () => {
      const g = need(E.spx.profit, 'S&P profit growth');
      return moved(g, E.label !== F.eras.y1.label);
    },
    /** "returned 9%/year", "lost 5%/year" or "barely changed"; `:year` adds "/year" */
    returned: (a) => moved(need(E.spx.stock, 'S&P return'), a.includes('year'), 'returned', 'lost'),
    oil: () => `$${need(E.oil, 'oil price')}`,
    premium: () => { const l = need(F.eras.now.longRun, 'long-run returns'); return halfPct(l.stocks - l.bonds); },
    highSince: () => need(E.bondHighSince, 'year the bond was last this high'),
  };
}

export function companyPastTokens(co: Company, era: PastEra, F: Figures): Tokens {
  const p = need(co.past[era], `${co.id} ${era}`);
  const pe = parseFig(p.pe);
  return {
    ...common(F),
    req: (a) => approx(requiredGrowth(p.y ?? co.now.y, need(pe.v, 'years of profit')), a),
    reqSigned: () => signed(requiredGrowth(p.y ?? co.now.y, need(pe.v, 'years of profit'))),
    pe: (a) => years(pe, a),
    peNow: (a) => years(parseFig(co.now.pe), a),
    profit: (a) => approx(need(p.profit, `${co.id} ${era} profit growth`), a),
    stock: (a) => approx(need(p.stock, `${co.id} ${era} stock return`), a),
    /** "— more than the 21% required", "— short of the 15% required" or "— what was required", from the data */
    vsReq: () => {
      if (pe.v === null) return '';
      const rq = requiredGrowth(p.y ?? co.now.y, pe.v), g = need(p.profit, `${co.id} ${era} profit growth`);
      return pct(g) === pct(rq) ? '— what was required' : `— ${g > rq ? 'more than' : 'short of'} the ${pct(rq)}/year required`;
    },
    /** "rose from 28 to 38" or "fell from 52 to 27": the years of profit people paid, then and now */
    peMove: () => {
      const a = need(pe.v, 'years of profit then'), b = need(parseFig(co.now.pe).v, 'years of profit now');
      const was = years(pe, ['bare']), is = years(parseFig(co.now.pe), ['bare']);
      // compared as printed, so it never reads "rose from 28 to 28"
      return was === is ? `stayed at ${is}` : `${b > a ? 'rose' : 'fell'} from ${was} to ${is}`;
    },
    /** "grew 11%/year" or "fell 5%/year" (one year: "grew 32%"), from the data, so the direction is never typed */
    profitMove: () => {
      const g = need(p.profit, `${co.id} ${era} profit growth`);
      return moved(g, era !== 'y1');
    },
    /** "returned 22%/year", "lost 58%" or "barely changed"; `:year` adds "/year" */
    returned: (a) => moved(need(p.stock, `${co.id} ${era} stock return`), a.includes('year'), 'returned', 'lost'),
    maxFall: () => pct(need(p.maxFall, `${co.id} ${era} biggest fall`)),
    rev: () => pct(need(p.revenueGrowth, `${co.id} ${era} revenue growth`)),
    oil: () => `$${need(F.eras[era].oil, 'oil price')}`,
  };
}
