// Computes the board's figures from the downloads and compares them with
// data/figures.json. Prints every change; `--write` saves them.
//
//   npm run figures            show what would change
//   npm run figures -- --write save it
import { readFileSync, writeFileSync } from 'node:fs';
import { requiredGrowth } from '../src/formula';
import { parseFig, sectionOf } from '../src/engine';
import type { Company, Figures, PastEra } from '../src/types';
import { SOURCES } from './sources';
import { loadSupplements } from './xbrl';
import { oilOn, shiller, shillerKnown, shillerTotalReturn, monthsBefore, barOn, bond, bondHighSince, computeOn, Filings, forecast, fromHigh, lastDate, lastDecade, longRun, maxFall, series, sinceListing, yearsBefore, yearToDate } from './compute';

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
  const fc = forecast(s.id, today);
  let pef: number | string | null = co.now.pef;
  let fcNote = 'kept (no forecast downloaded yet)';
  if (fc && now.eps !== null) {
    if (now.eps > 0 && fc.fy0.eps > 0 && fc.fy1.eps > 0) {
      const growth = fc.fy1.eps / fc.fy0.eps - 1;
      pef = years(now.price / (now.eps * (1 + growth)), false);
      co.now.forecast = r3(growth);
      fcNote = `official profit grown ${pct(growth)} (analysts, ${fc.fy0.date.slice(0, 4)}→${fc.fy1.date.slice(0, 4)})`;
    } else if (fc.fy1.eps > 0) {
      co.now.forecast = null; // no profit this year to grow from
      // no official profit to grow: the analysts' own figure
      pef = years(now.price / fc.fy1.eps, false);
      fcNote = `analysts' ${fc.fy1.date.slice(0, 4)} profit (no official profit to grow)`;
    } else { pef = null; fcNote = 'analysts expect a loss'; }
  }

  if (now.eps !== null && !dollar) co.now.pe = pe;
  if (now.eps !== null && dollar && !now.loss) co.now.pe = pe;
  co.now.pef = pef;
  if (now.dividendYield !== null) co.now.y = r3(now.dividendYield)!;
  co.now.last = dec ? r3(dec.g) : null;
  if (dollar && now.value !== null) co.now.value = Math.round(now.value);
  if (dollar && co.now.profits) {
    if (now.netIncome !== null) co.now.profits.last = Math.round(now.netIncome);
    if (now.revenue !== null && co.now.profits.revenue !== undefined) co.now.profits.revenue = Math.round(now.revenue);
  }
  if (co.now.yearsOfRevenue !== undefined && now.value !== null && now.revenue) co.now.yearsOfRevenue = Math.round(now.value / now.revenue);
  // a company whose filings gave no recent profit keeps its figures and their source
  if (now.eps !== null) co.src = { ...co.src, pe: 'sec-eod', y: 'sec-eod', last: 'sec-eod', ...(fc ? { forecast: 'alphavantage' } : {}) };

  // the stock's path and the business's size, for hand-written lines that quote them
  const r4 = (x: number | null | undefined) => (x === null || x === undefined || !Number.isFinite(x) ? undefined : Math.round(x * 10000) / 10000);
  const yearAgo = computeOn(f, yearsBefore(today, 1), today);
  const firstBar = series(s.eod)[0].date;
  const listedRecently = firstBar > yearsBefore(today, 1);
  Object.assign(co.now, {
    ytd: r4(yearToDate(s.eod, today)),
    fromHigh: (() => { const h = fromHigh(s.eod, today); const m = month(h.date); return { below: r4(h.below)!, month: h.date.slice(0, 4) === today.slice(0, 4) ? m.split(' ')[0] : m }; })(),
    revenueGrowth: now.revenue && yearAgo?.revenue ? r4(now.revenue / yearAgo.revenue - 1) : undefined,
    capex: (() => { const c = f.ttm(f.capex, today); return c && c.end > yearsBefore(today, 1) ? Math.round(Math.abs(c.val) / 1e9) : undefined; })(),
    listing: listedRecently ? (() => { const l = sinceListing(s.eod); return { low: r4(l.low)!, high: r4(l.high)!, month: l.month }; })() : undefined,
  });
  for (const k of ['ytd', 'revenueGrowth', 'capex', 'listing'] as const) if (co.now[k] === undefined) delete co.now[k];

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
    if (p.profit === undefined) delete p.profit;
    const before1 = computeOn(f, yearsBefore(d, 1), today);
    const rg = then.revenue && before1?.revenue ? r4(then.revenue / before1.revenue - 1) : undefined;
    if (rg !== undefined) p.revenueGrowth = rg; else delete p.revenueGrowth;
    p.maxFall = r4(maxFall(s.eod, d, today))!;
  }
  if (now.eps !== null) co.src.past = 'sec-eod';

  const reqOf = (n: typeof co.now) => { const v = parseFig(n.pe).v; return v === null ? null : requiredGrowth(n.y, v); };
  const a = reqOf(old), b = reqOf(co.now);
  rows.push([s.id, show(old.pe) + ' → ' + show(co.now.pe), show(old.pef) + ' → ' + show(co.now.pef), pct(old.y) + ' → ' + pct(co.now.y),
    pct(old.last) + ' → ' + pct(co.now.last), pct(a) + ' → ' + pct(b), (a === null ? '—' : sectionOf(a)) + ' → ' + (b === null ? '—' : sectionOf(b)), fcNote]);
}

// eras: the bond, gold
const goldNow = barOn('XAUUSD.FOREX', today)!.close;
F.eras.now.bond = r3(bond(today))!;
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
  const decadeAgo = shiller().find((r) => r.month === `${+known.month.slice(0, 4) - 10}${known.month.slice(4)}`);
  const spx = F.eras.now.spx;
  spx.pe = Math.round(level(today) / known.E!);
  spx.y = r3(withD.D! / level(today))!;
  spx.last = decadeAgo?.E ? r3(Math.pow(known.E! / decadeAgo.E, 1 / 10) - 1)! : spx.last;
  const lastTR = shiller().filter((r) => r.realTR !== null).at(-1)!.month;
  for (const [era, n] of ERAS) {
    const d = yearsBefore(today, n);
    const k = shillerKnown(d)!;
    const kd = shiller().filter((r) => r.D !== null && r.month <= k.month).at(-1)!;
    const E = F.eras[era].spx;
    E.pe = Math.round(level(d) / k.E!);
    E.y = r3(kd.D! / level(d))!;
    E.profit = r3(Math.pow(known.E! / k.E!, 1 / n) - 1)!;
    const tr = shillerTotalReturn(d.slice(0, 7), lastTR);
    if (tr !== null) {
      const yrs = (Date.parse(lastTR + '-15') - Date.parse(d)) / (365.25 * 86_400_000);
      E.stock = r3(Math.pow(1 + tr, 1 / yrs) - 1)!;
    }
  }
}
F.sources['shiller'] = { name: 'Robert Shiller’s S&P 500 data (profit, dividends and total return per index share)', url: 'https://shillerdata.com/', date: shillerKnown(today)!.month } as never;

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
