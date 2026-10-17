// Computes each company's figures from the raw downloads in .cache/ (see fetch.ts).
//
// Every per-share figure is put on today's share basis using EOD's split history,
// so a value reported before a split compares with one reported after it. Each
// past view only uses filings that had been published by that date.
import { existsSync, readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import type { Source } from './sources';

const DAY = 86_400_000;
const ms = (d: string) => Date.parse(d + 'T00:00:00Z');
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
export const monthsBefore = (d: string, n: number) => {
  const t = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1 - n, +d.slice(8, 10)));
  return iso(t.getTime());
};
export const yearsBefore = (d: string, n: number) => iso(Date.UTC(+d.slice(0, 4) - n, +d.slice(5, 7) - 1, +d.slice(8, 10)));
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

// ---------- prices, splits, rates ----------

interface Bar { date: string; close: number; adjusted_close: number }
const bars = new Map<string, Bar[]>();
export function series(sym: string): Bar[] {
  if (!bars.has(sym)) bars.set(sym, read(`.cache/eod/${sym}.json`));
  return bars.get(sym)!;
}
/** The last trading day on or before `d`. */
export function barOn(sym: string, d: string): Bar | null {
  const s = series(sym);
  let lo = 0, hi = s.length - 1, best = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (s[m].date <= d) { best = m; lo = m + 1; } else hi = m - 1; }
  return best < 0 || ms(d) - ms(s[best].date) > 7 * DAY ? null : s[best];
}
export const lastDate = (sym: string) => series(sym).at(-1)!.date;

function splits(sym: string): { date: string; ratio: number }[] {
  const p = `.cache/splits/${sym}.json`;
  if (!existsSync(p)) return [];
  return (read(p) as { date: string; split: string }[]).map((s) => {
    const [a, b] = s.split.split('/').map(Number);
    return { date: s.date, ratio: a / b };
  });
}
/** How many of today's shares one share at `d` became. */
export function splitFactor(sym: string, d: string, today: string): number {
  return splits(sym).filter((s) => s.date > d && s.date <= today).reduce((f, s) => f * s.ratio, 1);
}

/** Dividends paid per share in the twelve months to `d` (by ex-dividend date), in shares as they were at `d`. */
export function dividendsTtm(sym: string, d: string): number {
  const p = `.cache/div/${sym}.json`;
  if (!existsSync(p)) return 0;
  const from = yearsBefore(d, 1);
  return (read(p) as { date: string; unadjustedValue: number; value: number }[])
    .filter((x) => x.date > from && x.date <= d)
    .reduce((sum, x) => sum + (x.unadjustedValue ?? x.value) / splitFactor(sym, x.date, d), 0);
}

/**
 * The bond's high of the past year and the year it was last that high: "Highest since 2007" when the high
 * is today, else "It reached ~5.3% in October, the highest since 2007". Null when the high isn't a record.
 */
export function bondHighSince(d: string): string | null {
  const rows: { date: string; rate: number }[] = [];
  for (let y = 1990; y <= +d.slice(0, 4); y++) {
    const p = `.cache/ust/${y}.json`;
    if (existsSync(p)) rows.push(...(read(p).data as { date: string; tenor: string; rate: number }[]).filter((r) => r.tenor === '10Y' && r.date <= d));
  }
  const yearAgo = yearsBefore(d, 1);
  const recent = rows.filter((r) => r.date >= yearAgo);
  const today = recent.reduce((a, b) => (b.date > a.date ? b : a));
  const peak = recent.reduce((a, b) => (b.rate > a.rate || (b.rate === a.rate && b.date > a.date) ? b : a));
  const before = rows.filter((r) => r.date < yearAgo && r.rate >= peak.rate);
  if (!before.length) return null;
  const year = before.reduce((a, b) => (b.date > a.date ? b : a)).date.slice(0, 4);
  if (+year > +d.slice(0, 4) - 5) return null; // not much of a record
  if (peak.date === today.date) return `Highest since ${year}`;
  const month = new Date(peak.date + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return `It reached ${(peak.rate).toFixed(1)}% in ${month}, the highest since ${year}`;
}

/** The 10-year US Treasury yield on or before `d`, as a fraction. */
export function bond(d: string): number | null {
  for (let y = +d.slice(0, 4); y >= +d.slice(0, 4) - 1; y--) {
    const p = `.cache/ust/${y}.json`;
    if (!existsSync(p)) continue;
    const rows = (read(p).data as { date: string; tenor: string; rate: number }[]).filter((r) => r.tenor === '10Y' && r.date <= d);
    if (rows.length) return rows.reduce((a, b) => (b.date > a.date ? b : a)).rate / 100;
  }
  return null;
}

// ---------- SEC filings ----------

interface Fact { start?: string; end: string; val: number; filed: string; form: string; unit?: string }

const EPS = ['EarningsPerShareDiluted', 'EarningsPerShareBasicAndDiluted', 'DilutedEarningsLossPerShare', 'IncomeLossFromContinuingOperationsPerDilutedShare'];
const DPS = ['CommonStockDividendsPerShareDeclared', 'CommonStockDividendsPerShareCashPaid'];
const DIVIDENDS = ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock', 'DividendsPaidClassifiedAsFinancingActivities', 'PaymentsOfOrdinaryDividends'];
const REVENUE = ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenue'];
const NET_INCOME = ['NetIncomeLoss', 'ProfitLossAttributableToOwnersOfParent'];
const CAPEX = ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'];

export class Filings {
  private facts: Record<string, Record<string, Record<string, Fact[]>>> = {};
  constructor(public src: Source) {
    for (const cik of src.cik) {
      const j = read(`.cache/sec/${String(cik).padStart(10, '0')}.json`);
      for (const [tax, concepts] of Object.entries(j.facts as Record<string, Record<string, { units: Record<string, Fact[]> }>>))
        for (const [k, c] of Object.entries(concepts)) {
          const into = ((this.facts[tax] ??= {})[k] ??= {});
          for (const [u, arr] of Object.entries(c.units)) (into[u] ??= []).push(...arr);
        }
      const sup = `.cache/xbrl/${String(cik).padStart(10, '0')}/supplement.json`;
      // the filed reports' unit ids vary; keep only values in the reporting currency
      if (existsSync(sup)) for (const [k, arr] of Object.entries(read(sup) as Record<string, Fact[]>))
        ((this.facts.filed ??= {})[k] ??= {}).all = arr.filter((x) => !x.unit || !/usd|twd|eur/i.test(x.unit) || new RegExp(this.currency, 'i').test(x.unit));
    }
    if (src.operating) this.deriveOperating();
  }

  /** Profit per share without investment gains: EPS × (profit − gains + their tax) ÷ profit, period by period. */
  private deriveOperating() {
    const f = this.facts.filed;
    const key = (x: Fact) => `${x.start}/${x.end}/${x.filed}`;
    const by = (k: string) => new Map((f[k]?.all ?? []).map((x) => [key(x), x.val]));
    const ni = by('NetIncomeLoss'), gain = by('InvestmentGains'), tax = by('InvestmentGainsTax');
    const out: Fact[] = [];
    for (const e of f.EarningsPerShareDiluted?.all ?? []) {
      const k = key(e), n = ni.get(k), g = gain.get(k);
      // some early quarterly reports don't tag the tax on gains: estimate it at the 21% US rate
      const t = tax.get(k) ?? (g === undefined ? undefined : 0.21 * g);
      if (n === undefined || g === undefined || t === undefined || n === 0) continue;
      out.push({ ...e, val: (e.val * (n - g + t)) / n, ...(tax.has(k) ? {} : { estimated: true }) });
    }
    f.OperatingEarningsPerShare = { all: out };
    this.eps = ['OperatingEarningsPerShare'];
  }

  /** Whether the twelve months to `d` rest on an estimated tax figure (see deriveOperating). */
  usedEstimate(d: string): boolean {
    const f = (this.facts.filed?.OperatingEarningsPerShare?.all ?? []) as (Fact & { estimated?: boolean })[];
    return f.some((x) => x.estimated && x.end <= d && ms(d) - ms(x.end) < 470 * DAY);
  }

  /** Dividends per share: the board's cash returned, whatever the share classes. */
  dps = DPS;
  epsList() { return this.eps; }

  /** The currency the company reports in: some filings also translate figures into dollars. */
  get currency() {
    const fx = this.src.fx;
    return fx ? (fx.startsWith('USD') ? fx.slice(3, 6) : fx.slice(0, 3)) : 'USD';
  }

  /** All facts for the first of `names` that has any, in the reporting currency, as of filing date `asOf`. */
  private pick(names: string[], asOf: string, unit: (u: string) => boolean = (u) => u === 'all' || u === 'pure' || u === 'shares' || u.startsWith(this.currency)): Fact[] {
    let best: Fact[] = [];
    for (const n of names)
      for (const tax of Object.values(this.facts)) {
        const c = tax[n];
        if (!c) continue;
        // what had been filed by then, plus periods that ended long enough before to have been
        // reported, as found in later filings (some figures only reach the data in later reports)
        const reported = (x: Fact) => x.filed <= asOf || ms(x.end) < ms(asOf) - 120 * DAY;
        const f = Object.entries(c).filter(([u]) => !unit || unit(u)).flatMap(([, a]) => a).filter(reported).map((x) => ({ ...x, later: x.filed > asOf }));
        // prefer the concept with the most recent period: companies switch tags over the years
        const end = (a: Fact[]) => a.reduce((m, x) => (x.end > m ? x.end : m), '');
        // the filed reports win ties: they carry the share class the board uses
        if (f.length && (end(f) > end(best) || (end(f) === end(best) && tax === this.facts.filed))) best = f;
      }
    return best;
  }

  /** One value per period: the latest filing's by then (it carries any restatement), else the earliest later one. */
  private periods(f: (Fact & { later?: boolean })[]): Map<string, Fact> {
    const out = new Map<string, Fact & { later?: boolean }>();
    for (const x of f) {
      if (!x.start) continue;
      const k = x.start + '/' + x.end;
      const had = out.get(k);
      const better = !had || (had.later && !x.later) || (!had.later && !x.later && x.filed > had.filed) || (had.later && x.later && x.filed < had.filed);
      if (better) out.set(k, x);
    }
    return out;
  }

  /** The twelve months to the latest reported period, as of `asOf`: last annual + this year so far − last year so far. */
  ttm(names: string[], asOf: string, adjust: (f: Fact) => number = (f) => f.val): { val: number; end: string; annualOnly: boolean } | null {
    const per = [...this.periods(this.pick(names, asOf)).values()];
    if (!per.length) return null;
    const dur = (f: Fact) => (ms(f.end) - ms(f.start!)) / DAY;
    const near = (a: string, b: string, days = 12) => Math.abs(ms(a) - ms(b)) <= days * DAY;
    const annual = per.filter((f) => dur(f) > 350 && dur(f) < 380);
    const latestEnd = per.reduce((m, f) => (f.end > m ? f.end : m), '');
    const lastAnnual = annual.reduce<Fact | null>((m, f) => (!m || f.end > m.end ? f : m), null);
    if (lastAnnual && lastAnnual.end === latestEnd) return { val: adjust(lastAnnual), end: latestEnd, annualOnly: false };
    // the longest stretch of this fiscal year reported so far
    const ytd = per.filter((f) => f.end === latestEnd && dur(f) < 300).sort((a, b) => dur(b) - dur(a))[0];
    if (ytd) {
      const a = annual.find((f) => near(f.end, iso(ms(ytd.start!) - DAY)));
      const prior = per.find((f) => near(f.end, yearsBefore(ytd.end, 1)) && near(f.start!, yearsBefore(ytd.start!, 1)));
      if (a && prior) return { val: adjust(a) + adjust(ytd) - adjust(prior), end: latestEnd, annualOnly: false };
    }
    return lastAnnual ? { val: adjust(lastAnnual), end: lastAnnual.end, annualOnly: true } : null;
  }

  /** Fiscal-year values ending near `end`. */
  annualNear(names: string[], end: string, asOf: string, adjust: (f: Fact) => number = (f) => f.val): number | null {
    const per = [...this.periods(this.pick(names, asOf)).values()];
    const f = per.find((x) => {
      const d = (ms(x.end) - ms(x.start!)) / DAY;
      return d > 350 && d < 380 && Math.abs(ms(x.end) - ms(end)) <= 20 * DAY;
    });
    return f ? adjust(f) : null;
  }

  latestAnnualEnd(names: string[], asOf: string): string | null {
    const per = [...this.periods(this.pick(names, asOf)).values()].filter((x) => { const d = (ms(x.end) - ms(x.start!)) / DAY; return d > 350 && d < 380; });
    return per.length ? per.reduce((m, x) => (x.end > m ? x.end : m), '') : null;
  }

  /** Shares outstanding from the cover page closest to `d` (all share classes added). */
  sharesOn(d: string, asOf: string): { val: number; date: string } | null {
    const dei = this.facts.dei?.EntityCommonStockSharesOutstanding;
    if (!dei) return null;
    const f = Object.values(dei).flat().filter((x) => x.filed <= asOf && x.end <= d);
    if (!f.length) return null;
    const end = f.reduce((m, x) => (x.end > m ? x.end : m), '');
    if (ms(d) - ms(end) > 200 * DAY) return null;
    // one filing per date; add the classes of that filing
    const sameDate = f.filter((x) => x.end === end);
    const filed = sameDate.reduce((m, x) => (x.filed > m ? x.filed : m), '');
    return { val: sameDate.filter((x) => x.filed === filed).reduce((s, x) => s + x.val, 0), date: end };
  }

  eps = EPS;
  dividends = DIVIDENDS;
  revenue = REVENUE;
  capex = CAPEX;
  netIncome = NET_INCOME;
}

// ---------- the figures ----------

export interface Computed {
  date: string;
  price: number; // on today's share basis, $
  eps: number | null; // twelve months, today's share basis, $
  epsEnd: string | null; // the last period it covers
  annualOnly: boolean; // only a full-year figure was available
  pe: number | null; // years of last year's profit; null when there was no profit
  loss: boolean;
  dividendYield: number | null;
  buybackRate: number | null; // shares retired per year, net of new shares (negative: diluted)
  y: number | null;
  value: number | null; // $ billions
  revenue: number | null; // $ billions, twelve months
  netIncome: number | null; // $ billions, twelve months
}

export function computeOn(f: Filings, d: string, today: string): Computed | null {
  const s = f.src;
  const bar = barOn(s.eod, d);
  if (!bar) return null;
  const fx = s.fx ? barOn(s.fx, d)?.close ?? null : 1;
  if (fx === null) return null;
  // reported currency → dollars: EURUSD is dollars per euro; USDTWD is Taiwan dollars per dollar
  const toUsd = (v: number) => (s.fx?.startsWith('USD') ? v / fx : v * fx);
  const perShare = s.perShare ?? 1;
  const price = bar.close / splitFactor(s.eod, bar.date, today);
  const epsAdj = (x: Fact) => (toUsd(x.val) * perShare) / splitFactor(s.eod, x.filed, today);
  const t = f.ttm(f.eps, d, epsAdj);
  // only count it if the twelve months end within ~14 months of the date
  const fresh = t && ms(d) - ms(t.end) < 430 * DAY ? t : null;
  const eps = fresh?.val ?? null;
  const shares = f.sharesOn(d, d);
  const value = shares ? (bar.close * shares.val) / perShare / 1e9 : null;
  // dividends actually paid on the US-traded share (EOD), over its price that day
  const dividendYield = dividendsTtm(s.eod, bar.date) / bar.close;
  const before = shares ? f.sharesOn(yearsBefore(shares.date, 1), d) : null;
  const buybackRate = shares && before && ms(shares.date) - ms(before.date) > 300 * DAY
    ? 1 - (shares.val * splitFactor(s.eod, shares.date, today)) / (before.val * splitFactor(s.eod, before.date, today))
    : null;
  const rev = f.ttm(f.revenue, d, (x) => toUsd(x.val));
  const ni = f.ttm(f.netIncome, d, (x) => toUsd(x.val));
  return {
    date: bar.date, price, eps, epsEnd: fresh?.end ?? null, annualOnly: fresh?.annualOnly ?? false,
    pe: eps !== null && eps > 0 ? price / eps : null, loss: eps !== null && eps <= 0,
    dividendYield, buybackRate,
    y: dividendYield !== null && buybackRate !== null ? dividendYield + buybackRate : null,
    value, revenue: rev ? rev.val / 1e9 : null, netIncome: ni ? ni.val / 1e9 : null,
  };
}

/** Profit-per-share growth per year over the last ten fiscal years. */
export function lastDecade(f: Filings, today: string): { g: number; from: string; to: string } | null {
  const s = f.src;
  const fx = s.fx ? barOn(s.fx, today)?.close ?? 1 : 1;
  const toUsd = (v: number) => (s.fx?.startsWith('USD') ? v / fx : v * fx); // one rate for both ends: growth in the reporting currency
  const adj = (x: Fact) => (toUsd(x.val) * (s.perShare ?? 1)) / splitFactor(s.eod, x.filed, today);
  const latest = f.latestAnnualEnd(f.eps, today);
  if (!latest) return null;
  const now = f.annualNear(f.eps, latest, today, adj);
  const then = f.annualNear(f.eps, yearsBefore(latest, 10), today, adj);
  if (now === null || then === null || now <= 0 || then <= 0) return null;
  return { g: Math.pow(now / then, 1 / 10) - 1, from: yearsBefore(latest, 10), to: latest };
  return null;
}

// ---------- analysts' forecasts ----------

export interface Forecast { fy0: { date: string; eps: number; n: number }; fy1: { date: string; eps: number; n: number } }

export function forecast(id: string, today: string): Forecast | null {
  const p = `.cache/av/${id}.json`;
  if (!existsSync(p)) return null;
  const years = (read(p).estimates as { date: string; horizon: string; eps_estimate_average: string; eps_estimate_analyst_count: string }[])
    .filter((e) => e.horizon === 'fiscal year' && e.eps_estimate_average !== null)
    .map((e) => ({ date: e.date, eps: Number(e.eps_estimate_average), n: Number(e.eps_estimate_analyst_count) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const i = years.findIndex((y) => y.date >= today);
  if (i < 0 || !years[i + 1]) return null;
  return { fy0: years[i], fy1: years[i + 1] };
}

// ---------- the stock's path (for the hand-written lines, so they quote computed moves) ----------

/** Change in the stock (dividends reinvested) from `from` to `to`. */
export function moveBetween(sym: string, from: string, to: string): number | null {
  const a = barOn(sym, from), b = barOn(sym, to);
  return a && b ? b.adjusted_close / a.adjusted_close - 1 : null;
}

/** The stock's change since the last close of the previous year. */
export const yearToDate = (sym: string, d: string) => moveBetween(sym, `${+d.slice(0, 4) - 1}-12-31`, d);

/** The highest close in the year to `d`, its date, and how far below it `d` is. */
export function fromHigh(sym: string, d: string): { below: number; date: string } {
  const from = yearsBefore(d, 1);
  const s = series(sym).filter((x) => x.date > from && x.date <= d);
  const top = s.reduce((a, b) => (b.adjusted_close > a.adjusted_close ? b : a));
  return { below: 1 - s[s.length - 1].adjusted_close / top.adjusted_close, date: top.date };
}

/** The biggest fall from a high to a later low between `from` and `to`. */
export function maxFall(sym: string, from: string, to: string): number {
  let peak = 0, worst = 0;
  for (const x of series(sym)) {
    if (x.date < from || x.date > to) continue;
    peak = Math.max(peak, x.adjusted_close);
    worst = Math.max(worst, 1 - x.adjusted_close / peak);
  }
  return worst;
}

/** Since the first close on record (a new listing): the lowest and highest closes against that first one. */
export function sinceListing(sym: string): { low: number; high: number; month: string } {
  const s = series(sym);
  const first = s[0].close;
  const month = new Date(s[0].date + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return { low: Math.min(...s.map((x) => x.close)) / first - 1, high: Math.max(...s.map((x) => x.close)) / first - 1, month };
}

/** Yearly compound returns from Damodaran's table: S&P 500 with dividends, and the 10-year US Treasury bond. */
export function longRun(from = 1928): { stocks: number; bonds: number; to: number } | null {
  const p = '.cache/damodaran/histretSP.html';
  if (!existsSync(p)) return null;
  const t = readFileSync(p, 'latin1').replace(/<[^>]+>/g, '|').replace(/\s+/g, ' ').replace(/(\|\s*)+/g, '|');
  const rows = [...t.matchAll(/\|\s*(19[2-9]\d|20[0-4]\d)\s*\|\s*(-?[\d.]+)%\s*\|\s*(-?[\d.]+)%\s*\|\s*(-?[\d.]+)%\s*\|\s*(-?[\d.]+)%/g)]
    .map((m) => ({ year: +m[1], stocks: +m[2] / 100, bonds: +m[5] / 100 })).filter((r) => r.year >= from);
  if (!rows.length) return null;
  const cagr = (k: 'stocks' | 'bonds') => Math.pow(rows.reduce((x, r) => x * (1 + r[k]), 1), 1 / rows.length) - 1;
  return { stocks: cagr('stocks'), bonds: cagr('bonds'), to: rows[rows.length - 1].year };
}

// ---------- the S&P 500 (Robert Shiller's monthly data) ----------

export interface ShillerMonth { month: string; P: number; D: number | null; E: number | null; CPI: number; realTR: number | null }

let shillerRows: ShillerMonth[] | null = null;
/** Monthly rows: index level, twelve-month dividends and profit per index share, consumer prices, real total return. */
export function shiller(): ShillerMonth[] {
  if (shillerRows) return shillerRows;
  const wb = XLSX.read(readFileSync('.cache/shiller/ie_data.xls'));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Data'], { header: 1, raw: true });
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  shillerRows = rows.filter((r) => typeof r[0] === 'number').map((r) => {
    const v = r[0] as number, y = Math.floor(v), m = Math.round((v - y) * 100);
    return { month: `${y}-${String(m).padStart(2, '0')}`, P: r[1] as number, D: num(r[2]), E: num(r[3]), CPI: r[4] as number, realTR: num(r[9]) };
  });
  return shillerRows;
}

/** The latest month on or before `d` whose profit would have been reported by `d` (about three months after). */
export function shillerKnown(d: string, lagMonths = 3): ShillerMonth | null {
  const cutoff = monthsBefore(d, lagMonths).slice(0, 7);
  const rows = shiller().filter((r) => r.E !== null && r.month <= cutoff);
  return rows[rows.length - 1] ?? null;
}

/** The S&P 500's total return with dividends, in dollars, from month `a` to month `b` (YYYY-MM). */
export function shillerTotalReturn(a: string, b: string): number | null {
  const ra = shiller().find((r) => r.month === a), rb = shiller().find((r) => r.month === b);
  if (!ra?.realTR || !rb?.realTR) return null;
  return (rb.realTR * rb.CPI) / (ra.realTR * ra.CPI) - 1;
}
