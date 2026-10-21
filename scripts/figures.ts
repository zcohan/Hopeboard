// Computes the board's figures from the downloads and compares them with
// data/figures.json. Prints every change; `--write` saves them.
//
//   npm run figures            show what would change
//   npm run figures -- --write save it
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { requiredGrowth } from '../src/formula';
import { parseFig, sectionOf } from '../src/engine';
import type { Company, Figures, PastEra } from '../src/types';
import { SOURCES } from './sources';
import { loadSupplements } from './xbrl';
import { gainsShare, margin, shareChange, splitFactor, fxOn, oilOn, shiller, shillerKnown, shillerTotalReturn, monthsBefore, barOn, bond, bondHighSince, computeOn, Filings, forecast, fromHigh, lastDate, lastDecade, longRun, maxFall, series, sinceListing, yearsBefore, yearToDate } from './compute';

const WRITE = process.argv.includes('--write');
await loadSupplements(SOURCES);
const F: Figures = JSON.parse(readFileSync('data/figures.json', 'utf8'));
const today = lastDate('AAPL.US');
const ERAS: [PastEra, number][] = [['y1', 1], ['y5', 5], ['y10', 10]];
const month = (d: string) => new Date(d + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const round = (x: number, step: number) => Math.round(x / step) * step;
const years = (pe: number | null, loss: boolean): number | string | null => (loss ? 'loss' : pe === null ? null : pe < 10 ? Math.round(pe * 10) / 10 : Math.round(pe));
const r3 = (x: number | null) => (x === null ? null : Math.round(x * 1000) / 1000);
const pct = (x: number | null | undefined) => (x === null || x === undefined || Number.isNaN(x) ? '—' : `${(x * 100).toFixed(1)}%`);
const show = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'number' ? (Math.abs(v) < 1 ? pct(v) : String(v)) : String(v));

const notes: string[] = [];
const rows: string[][] = [];

/** Banks: their debts are mostly customers' deposits, so cash and debt don't read the same way. */
const BANKS = new Set(['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS']);

for (const s of SOURCES) {
  const co = F.companies.find((c) => c.id === s.id) as Company | undefined;
  if (!co) continue;
  const f = new Filings(s);
  const now = computeOn(f, today, today);
  if (!now) { notes.push(`${s.id}: no price for ${today}`); continue; }
  const old = structuredClone(co.now);
  const dollar = co.now.value !== undefined || co.now.yearsOfRevenue !== undefined;

  // years of last year's profit, cash returned, last decade
  const pe = years(now.pe, now.loss);
  if (now.annualOnly) notes.push(`${s.id}: only a full-year profit is filed (to ${now.epsEnd}); used as last year's`);
  if (now.eps === null) notes.push(`${s.id}: no recent profit in the filings; kept the current figures`);
  const dec = lastDecade(f, today);
  const fc = forecast(s.id, now.epsEnd);
  // next year: the filed profit grown at the analysts' growth rate, so it stays one kind of profit (analysts' own figures
  // usually leave out costs such as pay in shares). Their rate is for the fiscal year ending six to eighteen months from now.
  let pef: number | string | null = null;
  let fcNote = 'no forecast downloaded';
  co.now.forecast = undefined;
  const gains = gainsShare(f, today);
  if (now.stakesShare > 0.005) notes.push(`${s.id}: stakes in other companies are ${pct(now.stakesShare)} of the price, taken off before counting years of profit`);
  if (fc && gains > 0.2) fcNote = `none: gains on investments were ${pct(gains)} of pre-tax profit, and the analysts' figures for this year include them`;
  else if (fc && now.eps !== null) {
    // the part of the price that buys stakes in other companies comes off, as it does for last year's profit
    const price = now.price * (1 - now.stakesShare);
    if (now.eps > 0 && fc.fy0.eps > 0 && fc.fy1.eps > 0) {
      const growth = fc.fy1.eps / fc.fy0.eps - 1;
      pef = years(price / (now.eps * (1 + growth)), false);
      co.now.forecast = r3(growth);
      fcNote = `filed profit grown ${pct(growth)} (analysts, ${fc.fy0.date.slice(0, 7)}→${fc.fy1.date.slice(0, 7)})`;
    } else if (fc.fy1.eps > 0 && !(now.eps > 0)) {
      co.now.forecast = null; // no profit this year to grow from
      // no filed profit to grow: the analysts' own figure
      pef = years(price / fc.fy1.eps, false);
      fcNote = `analysts' ${fc.fy1.date.slice(0, 7)} profit (no filed profit to grow)`;
    } else fcNote = 'analysts expect a loss';
  } else if (!fc && existsSync(`.cache/av/${s.id}.json`)) fcNote = 'none: the filed profit is a whole year the analysts no longer list';
  if (co.now.forecast === undefined) delete co.now.forecast;

  if (now.eps !== null && !dollar) co.now.pe = pe;
  if (now.eps !== null && dollar && !now.loss) co.now.pe = pe;
  co.now.pef = pef;
  if (now.dividendYield !== null) co.now.y = r3(now.dividendYield)!;
  co.now.last = dec ? r3(dec.g) : null;
  // last fiscal year's profit per share against the latest twelve months, for "if profit falls back to last year's level"
  co.now.prevYear = (() => {
    const latest = f.latestAnnualEnd(f.eps, today);
    if (!latest || !now.eps || now.eps <= 0) return undefined;
    const before = f.annualNear(f.eps, yearsBefore(latest, 1), today, (x) => x.val / splitFactor(s.eod, x.filed, today));
    const fx = s.fx ? fxOn(s.fx, today) ?? 1 : 1;
    const toUsd = (v: number) => (s.fx?.startsWith('USD') ? v / fx : v * fx);
    return before !== null && before > 0 ? r3((toUsd(before) * (s.perShare ?? 1)) / now.eps) ?? undefined : undefined;
  })();
  if (co.now.prevYear === undefined) delete co.now.prevYear;
  if (dollar && now.value !== null) co.now.value = Math.round(now.value);
  if (dollar && co.now.profits) {
    // small profits keep two decimals, so $0.05 billion doesn't read as $0
    if (now.netIncome !== null) co.now.profits.last = Math.abs(now.netIncome) < 1 ? Math.round(now.netIncome * 100) / 100 : Math.abs(now.netIncome) < 10 ? Math.round(now.netIncome * 10) / 10 : Math.round(now.netIncome);
    if (now.revenue !== null && co.now.profits.revenue !== undefined) co.now.profits.revenue = Math.round(now.revenue);
  }
  // valued from its price and share count once it's listed, instead of years of revenue
  if (co.now.yearsOfRevenue !== undefined && now.value !== null) { co.now.value = Math.round(now.value); delete co.now.yearsOfRevenue; co.src = { ...co.src, pe: 'sec-eod', y: 'sec-eod' }; }
  // no twelve months on file yet (a new listing): its loss and revenue so far this year, and the stretch they cover
  if (dollar && co.now.profits && now.netIncome === null) {
    const ni = f.yearToDate(f.netIncome, today), rev = f.yearToDate(f.revenue, today);
    if (ni && rev && ni.start === rev.start && ni.end === rev.end) {
      const months = Math.round((Date.parse(ni.end) - Date.parse(ni.start)) / (30.44 * 86_400_000));
      const year = ni.end.slice(0, 4);
      co.now.profits.last = Math.round(ni.val / 1e8) / 10;
      co.now.profits.revenue = Math.round(rev.val / 1e8) / 10;
      co.now.profitsPeriod = months === 6 ? `in the first half of ${year}` : months === 3 ? `in the first quarter of ${year}` : `in the first ${months} months of ${year}`;
    }
  } else delete co.now.profitsPeriod;
  // a company whose filings gave no recent profit keeps its figures and their source
  if (now.eps !== null) co.src = { ...co.src, pe: 'sec-eod', y: 'sec-eod', last: 'sec-eod', ...(fc ? { forecast: 'alphavantage' } : {}) };

  // barely profitable (earning under 0.5% of its price), or losing money: shown in dollars from then on
  const b2 = (x: number) => (Math.abs(x) < 1 ? Math.round(x * 100) / 100 : Math.round(x * 10) / 10);
  const ttmBn = (names: string[]) => { const t = f.ttm(names, today); return t ? b2(Math.abs(t.val) / 1e9) : undefined; };
  // the pay in shares and the cash the business brings in, which those cards quote, kept up to date
  if (dollar && co.now.profits?.sharePay !== undefined && ttmBn(f.sharePay) !== undefined) co.now.profits.sharePay = ttmBn(f.sharePay)!;
  if (dollar && co.now.profits?.cash !== undefined && ttmBn(f.operatingCash) !== undefined) co.now.profits.cash = ttmBn(f.operatingCash)!;
  if (!dollar && now.eps !== null && now.netIncome && (now.loss || (now.eps > 0 && now.pe !== null && now.pe > 500))) {
    co.now.value = Math.round(now.price * (now.netIncome / now.eps));
    co.now.profits = { last: b2(now.netIncome), ...(ttmBn(f.sharePay) !== undefined ? { sharePay: ttmBn(f.sharePay)! } : {}), ...(ttmBn(f.operatingCash) !== undefined ? { cash: ttmBn(f.operatingCash)! } : {}) };
  }

  // the stock's path and the business's size, for hand-written lines that quote them
  const r4 = (x: number | null | undefined) => (x === null || x === undefined || !Number.isFinite(x) ? undefined : Math.round(x * 10000) / 10000);
  const yearAgo = computeOn(f, yearsBefore(today, 1), today);
  const firstBar = series(s.eod)[0].date;
  const listedRecently = firstBar > yearsBefore(today, 1);
  Object.assign(co.now, {
    ytd: r4(yearToDate(s.eod, today)),
    fromHigh: (() => { const h = fromHigh(s.eod, today); const m = month(h.date); return { below: r4(h.below)!, month: h.date.slice(0, 4) === today.slice(0, 4) ? m.split(' ')[0] : m }; })(),
    // only across two different years: a company that files once a year can show the same year twice
    revenueGrowth: (() => {
      const a = f.ttm(f.revenue, today), b = f.ttm(f.revenue, yearsBefore(today, 1));
      return a && b && a.end !== b.end && b.val ? r4(a.val / b.val - 1) : undefined; // in the reporting currency
    })(),
    // cash and debt, $ billions, with a year's profit to count them in. Not for banks, whose debts are mostly
    // customers' deposits, and only for companies reporting in dollars for now
    balance: (() => {
      if (BANKS.has(s.id)) return undefined;
      const b0 = f.balance(today);
      // companies reporting in another currency: in dollars at today's rate
      const rate = s.fx ? fxOn(s.fx, today) : 1;
      if (rate === null) return undefined;
      const usd = (v: number) => (s.fx?.startsWith('USD') ? v / rate : v * rate);
      const b = b0 ? { ...b0, cash: usd(b0.cash), debt: usd(b0.debt) } : null;
      // a year's profit: the company's value over its years of profit, else its reported profit (share classes)
      // a year's profit: profit per share times the shares, the profit the years of profit count in
      // (else the company's value over its years of profit, else its reported profit, where share counts aren't filed in a form we read)
      const profit = now.profit !== null && now.profit > 0 ? now.profit
        : now.value !== null && now.pe !== null && now.pe > 0 ? (now.value * (1 - now.stakesShare)) / now.pe
        : now.netIncome !== null && now.netIncome > 0 ? now.netIncome : null;
      // stakes in other companies, listed when they're worth half a year of profit or more and 1% of the price
      const stakes = profit !== null && now.stakes >= profit / 2 && now.stakesShare >= 0.01 ? Math.round(now.stakes * 10) / 10 : undefined;
      return b ? { cash: Math.round(b.cash / 1e8) / 10, debt: Math.round(b.debt / 1e8) / 10, end: b.end, ...(profit !== null ? { profit: Math.round(profit * 10) / 10 } : {}), ...(stakes ? { stakes } : {}) } : undefined;
    })(),
    // how much of each dollar of sales it keeps as profit, over its last three years (not for banks: their sales are mostly interest)
    margin: BANKS.has(s.id) ? undefined : r3(margin(f, today)) ?? undefined,
    // how fast the share count changed per year: buybacks (negative) or new shares
    shares: (() => { const c = shareChange(f, s.eod, today); return c ? { rate: r4(c.rate)!, years: c.years } : undefined; })(),
    capex: (() => { const c = f.ttm(f.capex, today); return c && c.end > yearsBefore(today, 1) ? Math.round(Math.abs(c.val) / 1e9) : undefined; })(),
    listing: listedRecently ? (() => { const l = sinceListing(s.eod); return { low: r4(l.low)!, high: r4(l.high)!, month: l.month }; })() : undefined,
  });
  for (const k of ['ytd', 'revenueGrowth', 'balance', 'margin', 'shares', 'capex', 'listing'] as const) if (co.now[k] === undefined) delete co.now[k];

  // how the deal has moved: years of profit and dividends a week, a month, a quarter and a year ago, as known then
  const daysBefore = (n: number) => new Date(Date.parse(today) - n * 86_400_000).toISOString().slice(0, 10);
  const then = Object.fromEntries((([['w1', 0], ['m1', 1], ['m3', 3], ['m12', 12]]) as [string, number][]).flatMap(([k, n]) => {
    const c = computeOn(f, k === 'w1' ? daysBefore(7) : monthsBefore(today, n), today);
    return c && c.pe !== null && c.dividendYield !== null ? [[k, { pe: Math.round(c.pe * 10) / 10, y: r3(c.dividendYield)! }]] : [];
  }));
  if (Object.keys(then).length && now.eps !== null && now.eps > 0) co.now.then = then; else delete co.now.then;

  // past views: only filings published by then
  for (const [era, n] of ERAS) {
    const d = yearsBefore(today, n);
    const then = computeOn(f, d, today);
    const p = co.past[era];
    // no data that far back (a later listing or spin-off): no past card
    if (p && (!then || (then.eps === null && typeof p.pe !== 'string'))) { delete co.past[era]; continue; }
    if (!then || !p) continue;
    const before = barOn(s.eod, d)!, after = barOn(s.eod, today)!;
    if (then.eps !== null) p.pe = years(then.pe, then.loss);
    if (s.operating && f.usedEstimate(d) && typeof p.pe === 'number') p.pe = `≈${p.pe}`;
    if (then.dividendYield !== null) p.y = r3(then.dividendYield)!;
    p.profit = then.eps !== null && then.eps > 0 && now.eps !== null && now.eps > 0 ? r3(Math.pow(now.eps / then.eps, 1 / n) - 1)! : undefined;
    p.stock = r3(Math.pow(after.adjusted_close / before.adjusted_close, 1 / n) - 1)!;
    // ten years ago: the same three-year averages as today's last decade, so the two cards quote one record
    // (TSMC's filings start too late for the averages; today's card shows no decade, so its single years stand)
    if (era === 'y10' && dec) p.profit = r3(dec.g)!;
    if (p.profit === undefined) delete p.profit;
    const before1 = computeOn(f, yearsBefore(d, 1), today);
    const rg = then.revenue && before1?.revenue ? r4(then.revenue / before1.revenue - 1) : undefined;
    if (rg !== undefined) p.revenueGrowth = rg; else delete p.revenueGrowth;
    p.maxFall = r4(maxFall(s.eod, d, today))!;
  }
  if (now.eps !== null) co.src.past = 'sec-eod';

  // the cheapest month in the last decade: the least growth its price needed at a month's end, with the filings known
  // then. Left off for businesses that boom and bust, where sales fell by a quarter or more from one year to the next:
  // there a boom year's profit makes the price look cheap (one-off charges halve profit too, so sales tell them apart)
  co.now.cheapest = (() => {
    const first = series(s.eod)[0].date;
    const latest = f.latestAnnualEnd(f.revenue, today);
    if (!latest) return undefined;
    const sales = [...Array(11).keys()].map((n) => f.annualNear(f.revenue, yearsBefore(latest, n), today)).filter((x) => x !== null).reverse() as number[];
    if (sales.some((x, i) => i > 0 && x < sales[i - 1] * 0.75)) return undefined;
    let best: { month: string; req: number } | undefined;
    for (let d = monthsBefore(today, 1); d >= first && d > yearsBefore(today, 10); d = monthsBefore(d, 1)) {
      const t = computeOn(f, d, today);
      // under 5 years of profit, the profit itself is almost always distorted (a one-off gain), so the month is skipped
      if (!t || t.pe === null || t.pe > 500 || t.pe < 5 || t.dividendYield === null) continue;
      const req = requiredGrowth(t.dividendYield, t.pe >= 10 ? Math.round(t.pe) : Math.round(t.pe * 10) / 10);
      if (!best || req < best.req) best = { month: t.date.slice(0, 7), req };
    }
    if (!best) return undefined;
    return { month: best.month, req: r3(best.req)!, since: first > yearsBefore(today, 10) ? first.slice(0, 4) : undefined };
  })();
  if (co.now.cheapest === undefined) delete co.now.cheapest;

  const reqOf = (n: typeof co.now) => { const v = parseFig(n.pe).v; return v === null ? null : requiredGrowth(n.y, v); };
  const a = reqOf(old), b = reqOf(co.now);
  rows.push([s.id, show(old.pe) + ' → ' + show(co.now.pe), show(old.pef) + ' → ' + show(co.now.pef), pct(old.y) + ' → ' + pct(co.now.y),
    pct(old.last) + ' → ' + pct(co.now.last), pct(a) + ' → ' + pct(b), (a === null ? '—' : sectionOf(a)) + ' → ' + (b === null ? '—' : sectionOf(b)), fcNote]);
}

// eras: the bond, gold
const goldNow = barOn('XAUUSD.FOREX', today)!.close;
F.eras.now.bond = r3(bond(today))!;
// the bond on each "Compare over time" date, so a card shown as it was then measures against that day's bond
{
  const day = (n: number) => new Date(Date.parse(today) - n * 86_400_000).toISOString().slice(0, 10);
  const dates = { w1: day(7), m1: monthsBefore(today, 1), m3: monthsBefore(today, 3), m12: monthsBefore(today, 12) };
  (F.eras.now as { bondThen?: Record<string, number> }).bondThen = Object.fromEntries(Object.entries(dates).map(([k, d]) => [k, r3(bond(d))!]));
}
(F.eras.now as { bondHighSince?: string | null }).bondHighSince = bondHighSince(today);
F.eras.now.gold = Math.round(goldNow);
F.eras.now.oil = Math.round(oilOn(today)!);
const lr = longRun();
if (lr) F.eras.now.longRun = { stocks: r3(lr.stocks)!, bonds: r3(lr.bonds)!, from: 1928, to: lr.to };
F.eras.now.label = month(today);
for (const [era, n] of ERAS) {
  const d = yearsBefore(today, n);
  const E = F.eras[era];
  E.label = month(d);
  E.bond = r3(bond(d))!;
  const g = barOn('XAUUSD.FOREX', d)!.close;
  E.gold = Math.round(g);
  E.goldReturn = r3(Math.pow(goldNow / g, 1 / n) - 1)!;
  const oil = oilOn(d);
  if (oil) E.oil = Math.round(oil);
}
// the S&P 500 from Robert Shiller's monthly data: profit and dividends per index share, total return
{
  const level = (d: string) => barOn('GSPC.INDX', d)!.close;
  const known = shillerKnown(today)!;
  const withD = shiller().filter((r) => r.D !== null && r.month <= known.month).at(-1)!;
  // profit over the last decade: the average of the three years to each end, so one unusual year can't decide the rate
  const months = shiller();
  const at = months.findIndex((r) => r.month === known.month);
  const avg3 = (i: number) => { const e = [0, 12, 24].map((k) => months[i - k]?.E); return e.every((x) => x) ? (e as number[]).reduce((a, b) => a + b, 0) / 3 : null; };
  const nowE = avg3(at), thenE = avg3(at - 120);
  const spx = F.eras.now.spx;
  spx.pe = Math.round(level(today) / known.E!);
  spx.y = r3(withD.D! / level(today))!;
  spx.last = nowE && thenE ? r3(Math.pow(nowE / thenE, 1 / 10) - 1)! : spx.last;
  const lastTR = shiller().filter((r) => r.realTR !== null).at(-1)!.month;
  for (const [era, n] of ERAS) {
    const d = yearsBefore(today, n);
    const k = shillerKnown(d)!;
    const kd = shiller().filter((r) => r.D !== null && r.month <= k.month).at(-1)!;
    const E = F.eras[era].spx;
    E.pe = Math.round(level(d) / k.E!);
    E.y = r3(kd.D! / level(d))!;
    // ten years ago: the last decade's growth, from three-year averages like today's card
    E.profit = era === 'y10' && spx.last !== undefined ? spx.last : r3(Math.pow(known.E! / k.E!, 1 / n) - 1)!;
    const tr = shillerTotalReturn(d.slice(0, 7), lastTR);
    if (tr !== null) {
      const yrs = (Date.parse(lastTR + '-15') - Date.parse(d)) / (365.25 * 86_400_000);
      E.stock = r3(Math.pow(1 + tr, 1 / yrs) - 1)!;
    }
  }
}
// inflation: US consumer prices from the same Shiller sheet, over the last decade and the last year
{
  // only published months: a month's prices come out in the middle of the next, so the newest rows are estimates
  const rows = shiller().filter((r) => r.CPI > 0 && r.month <= monthsBefore(today, 2).slice(0, 7));
  const last = rows.at(-1)!, i = rows.length - 1;
  const decadeAgo = rows[i - 120], yearAgo = rows[i - 12];
  if (decadeAgo && yearAgo) F.eras.now.inflation = {
    decade: r3(Math.pow(last.CPI / decadeAgo.CPI, 1 / 10) - 1)!,
    year: r3(last.CPI / yearAgo.CPI - 1)!,
    lost: r3(1 - decadeAgo.CPI / last.CPI)!,
    since: decadeAgo.month.slice(0, 4), month: last.month,
  };
}
F.sources['shiller'] = { name: 'Robert Shiller’s S&P 500 data (profit, dividends and total return per index share, and US consumer prices)', url: 'https://shillerdata.com/', date: shillerKnown(today)!.month } as never;

// cards that compare a profit with Apple's, Alphabet's or Visa's quote that company's own, from its filings
// (profit per share × shares)
for (const [key, id] of [['apple', 'AAPL'], ['google', 'GOOGL'], ['visa', 'V'], ['adobe', 'ADBE']]) {
  const profit = F.companies.find((c) => c.id === id)?.now.balance?.profit;
  for (const c of F.companies) if (c.now.profits?.[key] !== undefined && profit) c.now.profits[key] = Math.round(profit);
}

// private companies with a profit figure: years of profit from their latest price and that profit (a range when
// reports give two profits), rounded as every card shows them
for (const c of F.companies) {
  const p = c.now.profits, v = c.now.value;
  if (!c.private || typeof v !== 'number' || !p?.last || p.last <= 0) continue;
  const yrs = (x: number) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
  c.now.pe = p.lastLow ? `${yrs(v / p.last)}–${yrs(v / p.lastLow)}` : yrs(v / p.last);
}

F.asOf = month(today);
F.sources['sec-eod'] = {
  name: 'Company filings (SEC EDGAR) and prices (EOD Historical Data)',
  url: 'https://www.sec.gov/edgar/search/',
  date: today,
  note: 'Profit is the twelve months to the latest quarterly report, per share after dilution. Cash returned is dividends paid over the last twelve months (EOD); buybacks show up in profit-per-share growth. Next year’s profit is last year’s, grown at the analysts’ forecast rate (Alpha Vantage).',
} as never;

const w = rows[0].map((_, i) => Math.max(...[['', 'years', 'next year', 'cash', 'last decade', 'needs', 'section', 'forecast'], ...rows].map((r) => r[i].length)));
const line = (r: string[]) => r.map((c, i) => c.padEnd(w[i])).join('  ');
console.log(`Prices ${today}. Bond ${pct(F.eras.now.bond)}. Gold $${F.eras.now.gold}.\n`);
console.log(line(['', 'years', 'next year', 'cash', 'last decade', 'needs', 'section', 'forecast']));
for (const r of rows) console.log(line(r));
if (notes.length) console.log('\n' + notes.join('\n'));
if (WRITE) { writeFileSync('data/figures.json', JSON.stringify(F, null, 2) + '\n'); console.log('\nwrote data/figures.json'); }
