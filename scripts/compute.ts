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

/** Like splitFactor, but true splits only (3-for-1, 1-for-8): EOD also records spin-offs as small "splits"
 * (GE's 1.253 for GE Vernova) to adjust old prices, and those didn't change the number of shares. */
export function shareSplitFactor(sym: string, d: string, today: string): number {
  const whole = (r: number) => Math.abs(r - Math.round(r)) < 0.01 && Math.round(r) >= 2;
  return splits(sym).filter((s) => s.date > d && s.date <= today && (whole(s.ratio) || whole(1 / s.ratio))).reduce((f, s) => f * s.ratio, 1);
}

const WEIGHTED_SHARES = ['WeightedAverageNumberOfDilutedSharesOutstanding', 'WeightedAverageNumberOfShareOutstandingBasicAndDiluted', 'AdjustedWeightedAverageNumberOfSharesOutstanding'];

/** How fast the number of shares changed per year (negative: bought back), from the average shares in the
 * latest annual report and the one ten years before, or the earliest from five years back. Only years from a year
 * after listing count: before it, share counts leave out the investors' shares that convert at listing. */
export function shareChange(f: Filings, sym: string, today: string): { rate: number; years: number } | null {
  const end = f.latestAnnualEnd(WEIGHTED_SHARES, today);
  if (!end) return null;
  const at = (e: string) => f.annualNear(WEIGHTED_SHARES, e, today, (x) => x.val * shareSplitFactor(sym, x.filed, today));
  const now = at(end);
  if (!now) return null;
  // the downloaded prices start in January 2015; a first price later than that is a listing
  const first = series(sym)[0].date;
  const listed = first > '2015-02-01' ? yearsBefore(first, -1) : '';
  for (let n = 10; n >= 5; n--) {
    const e = `${+end.slice(0, 4) - n}${end.slice(4)}`;
    if (e < listed) continue;
    const then = at(e);
    if (then) return { rate: Math.pow(now / then, 1 / n) - 1, years: n };
  }
  return null;
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

/** The Treasury's daily 10-year yields, oldest first, in percent. */
let treasuryRows: { date: string; rate: number }[] | null = null;
function treasury(): { date: string; rate: number }[] {
  if (treasuryRows) return treasuryRows;
  const rows: { date: string; rate: number }[] = [];
  for (let y = 1990; y <= new Date().getFullYear(); y++) {
    const p = `.cache/treasury/${y}.csv`;
    if (!existsSync(p)) continue;
    const [head, ...lines] = readFileSync(p, 'utf8').trim().split('\n');
    const col = head.split(',').findIndex((h) => h.replace(/"/g, '').trim() === '10 Yr');
    for (const l of lines) {
      const c = l.split(','), [m, dd, yy] = c[0].split('/');
      const rate = Number(c[col]);
      if (col > 0 && Number.isFinite(rate) && c[col] !== '') rows.push({ date: `${yy}-${m}-${dd}`, rate });
    }
  }
  return (treasuryRows = rows.sort((a, b) => a.date.localeCompare(b.date)));
}

/**
 * The bond's high of the past year and the year it was last that high: "Highest since 2007" when the high
 * is today, else "It reached 5.3% in October, the highest since 2007". Null when the high isn't a record.
 */
export function bondHighSince(d: string): string | null {
  const rows = treasury().filter((r) => r.date <= d);
  const yearAgo = yearsBefore(d, 1);
  const recent = rows.filter((r) => r.date >= yearAgo);
  if (!recent.length) return null;
  const today = recent[recent.length - 1];
  const peak = recent.reduce((a, b) => (b.rate > a.rate || (b.rate === a.rate && b.date > a.date) ? b : a));
  const before = rows.filter((r) => r.date < yearAgo && r.rate >= peak.rate);
  if (!before.length) return null;
  const year = before[before.length - 1].date.slice(0, 4);
  if (+year > +d.slice(0, 4) - 5) return null; // not much of a record
  if (peak.date === today.date) return `Highest since ${year}`;
  const month = new Date(peak.date + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return `It reached ${peak.rate.toFixed(1)}% in ${month}, the highest since ${year}`;
}

/** The 10-year US Treasury yield on or before `d`, as a fraction (the Treasury's own daily figure). */
export function bond(d: string): number | null {
  const rows = treasury().filter((r) => r.date <= d);
  return rows.length ? rows[rows.length - 1].rate / 100 : null;
}

/** Brent crude, $ a barrel, on or before `d` (Energy Information Administration). */
let brentRows: { date: string; price: number }[] | null = null;
export function oilOn(d: string): number | null {
  if (!brentRows) {
    const wb = XLSX.read(readFileSync('.cache/eia/RBRTEd.xls'));
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Data 1'], { header: 1, raw: true });
    brentRows = rows.filter((r) => typeof r[0] === 'number' && typeof r[1] === 'number')
      .map((r) => ({ date: iso(Date.UTC(1899, 11, 30) + (r[0] as number) * DAY), price: r[1] as number }));
  }
  const s = brentRows.filter((r) => r.date <= d);
  return s.length && ms(d) - ms(s[s.length - 1].date) < 14 * DAY ? s[s.length - 1].price : null;
}

/** Exchange rates from the Federal Reserve's H.10: USDTWD is Taiwan dollars per dollar (USDJPY yen, USDCNY yuan),
 * EURUSD dollars per euro. */
const FED_CODES: Record<string, string> = { USDTWD: 'ta', EURUSD: 'eu', USDJPY: 'ja', USDCNY: 'ch' };
const fxRows = new Map<string, { date: string; rate: number }[]>();
export function fxOn(pair: string, d: string): number | null {
  const code = FED_CODES[pair.slice(0, 6)] ?? null;
  if (!code) return null;
  if (!fxRows.has(code)) {
    const html = readFileSync(`.cache/fed/h10_${code}.htm`, 'latin1');
    const mon: Record<string, string> = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
    fxRows.set(code, [...html.matchAll(/<th[^>]*>\s*(\d{1,2})-([A-Z]{3})-(\d{2})\s*<\/th>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>/g)]
      .map((m) => ({ date: `20${m[3]}-${mon[m[2]]}-${m[1].padStart(2, '0')}`, rate: Number(m[4]) })));
  }
  const s = fxRows.get(code)!.filter((r) => r.date <= d);
  return s.length && ms(d) - ms(s[s.length - 1].date) < 14 * DAY ? s[s.length - 1].rate : null;
}

// ---------- SEC filings ----------

interface Fact { start?: string; end: string; val: number; filed: string; form: string; unit?: string; reported?: number /* profit per share as filed, before leaveOutGains */ }

const EPS = ['EarningsPerShareDiluted', 'EarningsPerShareBasicAndDiluted', 'DilutedEarningsLossPerShare', 'IncomeLossFromContinuingOperationsPerDilutedShare'];
const DPS = ['CommonStockDividendsPerShareDeclared', 'CommonStockDividendsPerShareCashPaid'];
const DIVIDENDS = ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock', 'DividendsPaidClassifiedAsFinancingActivities', 'PaymentsOfOrdinaryDividends'];
const REVENUE = ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenue'];
const NET_INCOME = ['NetIncomeLoss', 'ProfitLossAttributableToOwnersOfParent', 'ProfitLoss'];
// gains and losses on investments: the first of these a company files for a period
export const GAINS = ['DebtAndEquitySecuritiesGainLoss', 'GainLossOnInvestments', 'EquitySecuritiesFvNiGainLoss', 'EquitySecuritiesFvNiUnrealizedGainLoss'];
// stakes in other companies whose rises and falls in value go through profit (equity-method stakes don't: their share
// of profit is already in the company's own)
const STAKES = ['EquitySecuritiesFvNi', 'EquitySecuritiesWithoutReadilyDeterminableFairValueAmount'];
/** The US federal company tax rate, for taking gains out after their tax when a period's own rate doesn't read sensibly. */
const US_TAX = 0.21;
export const PRETAX = ['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'];
const CAPEX = ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'];
const SHARE_PAY = ['ShareBasedCompensation', 'AllocatedShareBasedCompensationExpense'];
const OPERATING_CASH = ['NetCashProvidedByUsedInOperatingActivities'];
// cash and debt on the balance sheet. Cash counts what could be spent soon: cash, short-term investments and
// long-term marketable securities (Apple keeps most of its pile there). Debt is borrowing, without leases.
const CASH = ['CashAndCashEquivalentsAtCarryingValue', 'CashAndCashEquivalents', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'Cash'];
const SHORT_INVESTMENTS = ['ShortTermInvestments', 'MarketableSecuritiesCurrent', 'AvailableForSaleSecuritiesDebtSecuritiesCurrent', 'CurrentInvestments', 'DebtSecuritiesCurrent'];
const LONG_SECURITIES = ['MarketableSecuritiesNoncurrent', 'AvailableForSaleSecuritiesDebtSecuritiesNoncurrent'];
const DEBT_ALL = ['DebtLongtermAndShorttermCombinedAmount'];
const DEBT_LONG_ALL = ['LongTermDebt', 'LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities'];
const DEBT_LONG = ['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations', 'LongTermNotesAndLoans', 'ConvertibleDebtNoncurrent'];
const DEBT_LONG_CURRENT = ['LongTermDebtCurrent', 'DebtCurrent', 'NotesPayableCurrent', 'ConvertibleNotesPayableCurrent'];
const DEBT_SHORT = ['CommercialPaper', 'ShortTermBorrowings'];

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
        ((this.facts.filed ??= {})[k] ??= {}).all = arr.filter((x) => !x.unit || !/usd|twd|eur|jpy|cny/i.test(x.unit) || new RegExp(this.currency, 'i').test(x.unit));
    }
    if (src.operating) this.deriveOperating();
    else if (!src.keepGains) this.leaveOutGains();
  }

  /** Profit per share without gains on investments (the company's stakes in other companies going up or down in value),
   * period by period: the gains after tax (the period's own rate, else the 21% US rate), divided by that period's shares,
   * come off profit per share.
   * Where the period's share count isn't filed, they come off in proportion to pre-tax profit instead.
   * Changes the profit-per-share facts in place, so every view (today, past, the last decade) uses the same profit. */
  private leaveOutGains() {
    const names = this.src.gains ?? GAINS;
    const byPeriod = (concepts: string[], unit: (u: string) => boolean) => {
      const out = new Map<string, Fact[]>();
      for (const n of concepts)
        for (const tax of Object.values(this.facts))
          for (const [u, arr] of Object.entries(tax[n] ?? {})) {
            if (!unit(u)) continue;
            for (const x of arr) {
              if (!x.start) continue;
              const k = `${x.start}/${x.end}`;
              if (!out.has(k)) out.set(k, []);
              out.get(k)!.push({ ...x, unit: n });
            }
          }
      return out;
    };
    // in the reporting currency: Alibaba and PDD file theirs in yuan
    const money = (u: string) => u === this.currency || u === 'all';
    const gains = byPeriod(names, money);
    if (!gains.size) return;
    const pretax = byPeriod(PRETAX, money), income = byPeriod(NET_INCOME, money), shares = byPeriod(WEIGHTED_SHARES, (u) => u === 'shares' || u === 'all');
    // the figure for that period as filed with the profit per share, else the latest filed by then, else the first filed after
    const at = (m: Map<string, Fact[]>, k: string, filed: string, order: string[]) => {
      const all = m.get(k);
      if (!all) return undefined;
      const first = Math.min(...all.map((x) => order.indexOf(x.unit!)));
      const c = all.filter((x) => order.indexOf(x.unit!) === first);
      return c.find((x) => x.filed === filed) ?? c.filter((x) => x.filed <= filed).sort((a, b) => b.filed.localeCompare(a.filed))[0] ?? c.sort((a, b) => a.filed.localeCompare(b.filed))[0];
    };
    for (const n of EPS)
      for (const tax of Object.values(this.facts))
        for (const arr of Object.values(tax[n] ?? {}))
          for (const e of arr) {
            if (!e.start) continue;
            const k = `${e.start}/${e.end}`;
            const g = at(gains, k, e.filed, names);
            if (!g || g.val === 0) continue;
            const sh = at(shares, k, e.filed, WEIGHTED_SHARES);
            const p = at(pretax, k, e.filed, PRETAX), ni = at(income, k, e.filed, NET_INCOME);
            // the period's own tax rate when it reads sensibly, else the US rate
            const own = p && ni && p.val > 0 ? 1 - ni.val / p.val : null;
            const tax = own !== null && own >= 0 && own <= 0.4 ? own : US_TAX;
            e.reported ??= e.val;
            if (sh && sh.val > 0) { e.val -= (g.val * (1 - tax)) / sh.val; continue; }
            if (p && p.val > 0 && g.val < p.val) e.val = (e.val * (p.val - g.val)) / p.val;
          }
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
        // reported, as found in later filings (some figures only reach the data in later reports).
        // 120 days is the longest filing deadline (a foreign company's annual report), so these were public by then
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

  /** A balance-sheet figure (a value on a date, like cash held): the latest reported by `asOf`, from the first of
   * `names` that has one. Null if the latest is more than 200 days old. */
  instant(names: string[], asOf: string): { val: number; end: string; name: string } | null {
    let best: { val: number; end: string; name: string; filed: string } | null = null;
    for (const n of names) {
      const f = this.pick([n], asOf).filter((x) => !x.start && x.filed <= asOf);
      for (const x of f) if (!best || x.end > best.end || (x.end === best.end && n === best.name && x.filed > best.filed)) best = { val: x.val, end: x.end, name: n, filed: x.filed };
    }
    return best && ms(asOf) - ms(best.end) <= (this.src.fx ? 400 : 200) * DAY ? { val: best.val, end: best.end, name: best.name } : null;
  }

  /** The longest stretch of the current fiscal year reported so far, for a company with no twelve months on file yet. */
  yearToDate(names: string[], asOf: string): { val: number; start: string; end: string } | null {
    const per = [...this.periods(this.pick(names, asOf)).values()];
    const end = per.reduce((m, x) => (x.end > m ? x.end : m), '');
    const ytd = per.filter((x) => x.end === end && ms(x.end) - ms(x.start!) < 300 * DAY).sort((a, b) => ms(a.start!) - ms(b.start!))[0];
    return ytd ? { val: ytd.val, start: ytd.start!, end: ytd.end } : null;
  }

  /** The average number of shares after dilution in the latest reported period by `asOf` (all share classes). */
  dilutedShares(asOf: string): { val: number; filed: string } | null {
    // after dilution, else the basic count when a company stopped filing a diluted one (Exxon); never more than ~14 months old
    for (const names of [WEIGHTED_SHARES, ['WeightedAverageNumberOfSharesOutstandingBasic']]) {
      const per = [...this.periods(this.pick(names, asOf)).values()];
      const end = per.reduce((m, x) => (x.end > m ? x.end : m), '');
      if (!end || ms(asOf) - ms(end) > 430 * DAY) continue;
      const last = per.filter((x) => x.end === end).sort((a, b) => ms(a.end) - ms(a.start!) - (ms(b.end) - ms(b.start!)))[0];
      if (last) return { val: last.val, filed: last.filed };
    }
    return null;
  }

  /** What its stakes in other companies are worth on the latest balance sheet by `asOf`, in the reporting currency:
   * the holdings whose gains leaveOutGains takes out of profit (0 for banks and Berkshire, whose profit keeps them). */
  stakes(asOf: string): number {
    if (this.src.operating || this.src.keepGains) return 0;
    const found = [...STAKES, ...(this.src.stakesInCash ?? [])].map((n) => this.instant([n], asOf)).filter((x) => x !== null);
    const end = found.reduce((m, x) => (x.end > m ? x.end : m), '');
    return found.filter((x) => x.end === end).reduce((t, x) => t + x.val, 0);
  }

  /** Cash and debt on the latest balance sheet by `asOf`, in the reporting currency. Null unless both are found:
   * a company whose debt isn't in the data must not read as having none. */
  balance(asOf: string): { cash: number; debt: number; end: string } | null {
    const g = (n: string[]) => this.instant(n, asOf);
    const cash = g(CASH);
    if (!cash) return null;
    const same = <T extends { end: string }>(x: T | null) => (x && x.end === cash.end ? x : null);
    const spend = cash.val + (same(g(SHORT_INVESTMENTS))?.val ?? 0) + (same(g(LONG_SECURITIES))?.val ?? 0);
    const all = same(g(DEBT_ALL));
    const longAll = same(g(DEBT_LONG_ALL));
    const long = same(g(DEBT_LONG)), current = same(g(DEBT_LONG_CURRENT));
    const short = same(g(DEBT_SHORT))?.val ?? 0;
    const found = all ? all.val : longAll ? longAll.val + short : long ? long.val + (current?.val ?? 0) + short : null;
    // what the standard labels miss, from the company's filed reports (sources.ts `balance`)
    const extra = (names: string[] = []) => names.reduce((t, n) => t + (same(g([n]))?.val ?? 0), 0);
    const extraDebt = this.src.balance?.debt;
    const debt = found !== null ? found + extra(extraDebt) : extraDebt?.length || this.src.debtFree ? extra(extraDebt) : null;
    return debt === null ? null : { cash: spend + extra(this.src.balance?.cash) - extra(this.src.stakesInCash), debt, end: cash.end };
  }

  /** Shares outstanding from the cover page closest to `d` (all share classes added). */
  sharesOn(d: string, asOf: string): { val: number; date: string } | null {
    // the SEC summary data, else the cover page read from the filed reports (sources.ts supplement)
    const dei = this.facts.dei?.EntityCommonStockSharesOutstanding ?? this.facts.filed?.EntityCommonStockSharesOutstanding;
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
  sharePay = SHARE_PAY;
  operatingCash = OPERATING_CASH;
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
  stakesShare: number; // the part of the price its stakes in other companies are worth
  stakes: number; // what those stakes are worth, $ billions
  profit: number | null; // a year's profit, the one years of profit count in: profit per share × shares, $ billions
}

export function computeOn(f: Filings, d: string, today: string): Computed | null {
  const s = f.src;
  const bar = barOn(s.eod, d);
  if (!bar) return null;
  const fx = s.fx ? fxOn(s.fx, d) : 1;
  if (fx === null) return null;
  // reported currency → dollars: EURUSD is dollars per euro; USDTWD is Taiwan dollars per dollar
  const toUsd = (v: number) => (s.fx?.startsWith('USD') ? v / fx : v * fx);
  const perShare = s.perShare ?? 1;
  const perShareAt = (filed: string) => (s.perShareEarlier && filed < s.perShareEarlier.filedBefore ? s.perShareEarlier.perShare : perShare);
  const price = bar.close / splitFactor(s.eod, bar.date, today);
  const epsAdj = (x: Fact) => (toUsd(x.val) * perShareAt(x.filed)) / splitFactor(s.eod, x.filed, today);
  const t = f.ttm(f.eps, d, epsAdj);
  // only count it if the twelve months end within ~14 months of the date
  const fresh = t && ms(d) - ms(t.end) < 430 * DAY ? t : null;
  const eps = fresh?.val ?? null;
  const shares = f.sharesOn(d, d);
  const value = shares ? (bar.close * shares.val) / perShare / 1e9 : null;
  // the part of the price that buys its stakes in other companies, counted at today's value and taken off before
  // counting years of profit, since the profit leaves out their gains (Mauboussin and Rappaport add them the same way)
  const stakes = toUsd(f.stakes(d));
  const diluted = f.dilutedShares(d);
  // shares after dilution on today's basis, for amounts per US share (every share class counted)
  const usShares = diluted ? (diluted.val * shareSplitFactor(s.eod, diluted.filed, today)) / perShare : null;
  const stakesPerShare = usShares ? stakes / usShares : 0;
  const stakesShare = price > 0 ? Math.min(stakesPerShare / price, 0.9) : 0;
  // dividends actually paid on the US-traded share (EOD), over its price that day
  const dividendYield = dividendsTtm(s.eod, bar.date) / bar.close;
  const before = shares ? f.sharesOn(yearsBefore(shares.date, 1), d) : null;
  const buybackRate = shares && before && ms(shares.date) - ms(before.date) > 300 * DAY
    ? 1 - (shares.val * splitFactor(s.eod, shares.date, today)) / (before.val * splitFactor(s.eod, before.date, today))
    : null;
  // like profit per share, only twelve months that end within ~14 months of the date
  const recent = <T extends { end: string } | null>(t: T) => (t && ms(d) - ms(t.end) < 430 * DAY ? t : null);
  const rev = recent(f.ttm(f.revenue, d, (x) => toUsd(x.val)));
  const niAll = recent(f.ttm(f.netIncome, d, (x) => toUsd(x.val)));
  // Berkshire: its official profit includes the paper gains its profit per share leaves out; scale it the same way
  const repEps = s.operating ? recent(f.ttm(EPS, d, epsAdj)) : null;
  const ni = niAll && repEps && eps !== null && repEps.val > 0 ? { ...niAll, val: (niAll.val * eps) / repEps.val } : niAll;
  return {
    date: bar.date, price, eps, epsEnd: fresh?.end ?? null, annualOnly: fresh?.annualOnly ?? false,
    pe: eps !== null && eps > 0 ? (price * (1 - stakesShare)) / eps : null, loss: eps !== null && eps <= 0, stakesShare,
    stakes: stakes / 1e9, profit: eps !== null && usShares ? (eps * usShares) / 1e9 : null,
    dividendYield, buybackRate,
    y: dividendYield !== null && buybackRate !== null ? dividendYield + buybackRate : null,
    value, revenue: rev ? rev.val / 1e9 : null, netIncome: ni ? ni.val / 1e9 : null,
  };
}

/** A company's profit as reported over the twelve months to the latest report, gains on investments included
 * ($ billions): what the S&P 500's profit counts. `n` is computeOn's result for the same date. */
export function reportedProfit(f: Filings, d: string, today: string, n: Computed): number | null {
  const s = f.src;
  // Berkshire: its official profit, whose paper gains its profit per share leaves out
  if (s.operating) { const t = f.ttm(f.netIncome, d); return t ? t.val / 1e9 : null; }
  const shares = n.profit !== null && n.eps ? n.profit / n.eps : null;
  const t = f.ttm(f.eps, d, (x) => (x.reported ?? x.val) / splitFactor(s.eod, x.filed, today));
  return t && shares ? t.val * shares : null;
}

/** Gains on investments as a share of pre-tax profit, over the twelve months to the latest report (0 when it has none). */
export function gainsShare(f: Filings, d: string): number {
  if (f.src.operating || f.src.keepGains) return 0;
  const g = f.ttm(f.src.gains ?? GAINS, d), p = f.ttm(PRETAX, d);
  return g && p && p.val > 0 && g.end === p.end ? g.val / p.val : 0;
}

/** How much of each dollar of sales it kept as profit, over its latest three fiscal years together (profit ÷ sales,
 * both added up). Profit leaves out gains on investments, as the board's profit per share does: the filed profit,
 * scaled by profit per share without the gains against profit per share as filed. */
export function margin(f: Filings, today: string): number | null {
  const latest = f.latestAnnualEnd(f.eps, today);
  if (!latest) return null;
  const filed = f.src.operating ? EPS : f.eps;
  let profit = 0, sales = 0;
  for (const n of [0, 1, 2]) {
    const end = yearsBefore(latest, n);
    const rev = f.annualNear(f.revenue, end, today), ni = f.annualNear(f.netIncome, end, today);
    const eps = f.annualNear(f.eps, end, today), asFiled = f.annualNear(filed, end, today, (x) => x.reported ?? x.val);
    if (rev === null || ni === null || rev <= 0) return null;
    profit += eps !== null && asFiled ? (ni * eps) / asFiled : ni;
    sales += rev;
  }
  return profit / sales;
}

/** Profit-per-share growth per year over the last ten fiscal years. */
export function lastDecade(f: Filings, today: string): { g: number; from: string; to: string } | null {
  const s = f.src;
  const fx = s.fx ? fxOn(s.fx, today) ?? 1 : 1;
  const toUsd = (v: number) => (s.fx?.startsWith('USD') ? v / fx : v * fx); // one rate for both ends: growth in the reporting currency
  const perShareAt = (filed: string) => (s.perShareEarlier && filed < s.perShareEarlier.filedBefore ? s.perShareEarlier.perShare : s.perShare ?? 1);
  const adj = (x: Fact) => (toUsd(x.val) * perShareAt(x.filed)) / splitFactor(s.eod, x.filed, today);
  const latest = f.latestAnnualEnd(f.eps, today);
  if (!latest) return null;
  // each end of the decade is the average of three years, so one unusual year can't decide the rate
  const avg3 = (end: string) => {
    const v = [0, 1, 2].map((n) => f.annualNear(f.eps, yearsBefore(end, n), today, adj));
    return v.every((x) => x !== null) ? (v as number[]).reduce((a, b) => a + b, 0) / 3 : null;
  };
  const now = avg3(latest);
  const then = avg3(yearsBefore(latest, 10));
  if (now === null || then === null || now <= 0 || then <= 0) return null;
  return { g: Math.pow(now / then, 1 / 10) - 1, from: yearsBefore(latest, 12), to: latest };
}

// ---------- analysts' forecasts ----------

/** The analysts' profit per share for this fiscal year (`fy0`, the one the filed twelve months end inside) and the next
 * (`fy1`). Null when the filed twelve months are a whole fiscal year whose analysts' figure has left the list: then their
 * growth for the year ahead can't be measured on one kind of profit. */
export interface Forecast { fy0: { date: string; eps: number; n: number }; fy1: { date: string; eps: number; n: number } }

export function forecast(id: string, profitEnd: string | null): Forecast | null {
  const p = `.cache/av/${id}.json`;
  if (!profitEnd || !existsSync(p)) return null;
  const years = (read(p).estimates as { date: string; horizon: string; eps_estimate_average: string; eps_estimate_analyst_count: string }[])
    .filter((e) => e.horizon === 'fiscal year' && e.eps_estimate_average !== null)
    .map((e) => ({ date: e.date, eps: Number(e.eps_estimate_average), n: Number(e.eps_estimate_analyst_count) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  // this fiscal year: the first to end after the filed twelve months, which must end inside it
  const i = years.findIndex((y) => ms(y.date) > ms(profitEnd) + 20 * DAY);
  if (i < 0 || !years[i + 1] || ms(profitEnd) <= ms(years[i].date) - 345 * DAY) return null;
  if (Math.abs(ms(years[i + 1].date) - ms(years[i].date) - 365 * DAY) > 20 * DAY) return null;
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
