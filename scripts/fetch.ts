// Downloads the raw source data into .cache/ (gitignored). Run `npm run fetch`,
// then `npm run figures` to compute data/figures.json from it.
//
//   SEC EDGAR      company filings: profit, shares, dividends, buybacks   (no key)
//   EOD            daily prices, dividends, splits, gold, the 10-year US Treasury yield (EOD_API_KEY)
//   Alpha Vantage  analysts' profit-per-share forecasts                     (ALPHAVANTAGE_API_KEY, 25 calls a day)
//
// Each file is re-downloaded only when older than its refresh age, so a second
// run the same day costs nothing. Alpha Vantage stops cleanly at the daily limit;
// run again the next day for the rest.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { SOURCES } from './sources';

const env = Object.fromEntries(
  (existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const EOD = process.env.EOD_API_KEY ?? env.EOD_API_KEY;
const AV = process.env.ALPHAVANTAGE_API_KEY ?? env.ALPHAVANTAGE_API_KEY;
// the SEC asks for a contact email in the User-Agent; set SEC_CONTACT in .env.local
const UA = `Hopeboard research ${process.env.SEC_CONTACT ?? env.SEC_CONTACT ?? ''}`.trim();
const DAY = 86_400_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fresh(path: string, maxAge: number) {
  return existsSync(path) && Date.now() - statSync(path).mtimeMs < maxAge;
}

async function get(url: string, path: string, maxAge: number, headers: Record<string, string> = {}): Promise<'cached' | 'fetched'> {
  if (fresh(path, maxAge)) return 'cached';
  const res = await fetch(url, { headers });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${body.slice(0, 120)} for ${url.replace(/(api_token|apikey)=[^&]+/, '$1=…')}`);
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  writeFileSync(path, body);
  return 'fetched';
}

const eod = (path: string, q = '') => `https://eodhd.com/api/${path}?api_token=${EOD}&fmt=json${q}`;

async function main() {
  if (!EOD) throw new Error('EOD_API_KEY missing (put it in .env.local)');
  const log: string[] = [];

  // SEC: one file of every reported figure per company
  for (const s of SOURCES) {
    for (const cik of s.cik) {
      const id = String(cik).padStart(10, '0');
      log.push(`sec ${s.id} ${await get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${id}.json`, `.cache/sec/${id}.json`, 7 * DAY, { 'User-Agent': UA })}`);
      await sleep(150); // the SEC allows 10 requests a second
    }
  }

  // EOD: daily prices from 2015, plus gold, the S&P 500 and currency where needed
  const symbols = [...SOURCES.map((s) => s.eod), 'GSPC.INDX', 'XAUUSD.FOREX', 'BZ.COMM', ...new Set(SOURCES.flatMap((s) => (s.fx ? [s.fx] : [])))];
  for (const sym of symbols) log.push(`eod ${sym} ${await get(eod(`eod/${sym}`, '&from=2015-01-01'), `.cache/eod/${sym}.json`, DAY / 2)}`);
  for (const s of SOURCES) log.push(`dividends ${s.id} ${await get(eod(`div/${s.eod}`, '&from=2014-01-01'), `.cache/div/${s.eod}.json`, DAY)}`);
  for (const s of SOURCES) log.push(`splits ${s.id} ${await get(eod(`splits/${s.eod}`, '&from=2000-01-01'), `.cache/splits/${s.eod}.json`, 7 * DAY)}`);
  for (let year = 1990; year <= new Date().getFullYear(); year++) {
    const age = year === new Date().getFullYear() ? DAY / 2 : 365 * DAY;
    log.push(`ust ${year} ${await get(eod('ust/yield-rates', `&filter[year]=${year}`), `.cache/ust/${year}.json`, age)}`);
  }

  // Damodaran's yearly returns on stocks and bonds since 1928 (the S&P's long-run average, and stocks' extra over bonds)
  log.push(`damodaran ${await get('https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html', '.cache/damodaran/histretSP.html', 30 * DAY, { 'User-Agent': 'Mozilla/5.0' })}`);

  // Robert Shiller's monthly S&P 500 data: the index's profit, dividends and total return since 1871.
  // The file's address changes with each update, so read it from the data page.
  if (!fresh('.cache/shiller/ie_data.xls', 7 * DAY)) {
    const page = await (await fetch('https://shillerdata.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const href = /href="([^"]*ie_data\.xls[^"]*)"/.exec(page)?.[1];
    if (!href) log.push('shiller: data link not found on shillerdata.com');
    else {
      const res = await fetch(href.startsWith('//') ? 'https:' + href : href, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      mkdirSync('.cache/shiller', { recursive: true });
      writeFileSync('.cache/shiller/ie_data.xls', Buffer.from(await res.arrayBuffer()));
      log.push('shiller fetched');
    }
  }

  // Alpha Vantage: forecasts, oldest first, until the daily limit
  if (!AV) log.push('alphavantage skipped: ALPHAVANTAGE_API_KEY missing');
  else {
    const queue = SOURCES.filter((s) => s.forecast !== false).sort((a, b) => age(`.cache/av/${a.id}.json`) - age(`.cache/av/${b.id}.json`)).reverse();
    for (const s of queue) {
      const path = `.cache/av/${s.id}.json`;
      if (fresh(path, 7 * DAY)) { log.push(`av ${s.id} cached`); continue; }
      const res = await fetch(`https://www.alphavantage.co/query?function=EARNINGS_ESTIMATES&symbol=${s.av ?? s.id}&apikey=${AV}`);
      const body = await res.text();
      if (!body.includes('"estimates"')) { log.push(`av stopped at ${s.id}: ${body.split(AV).join('…').replace(/\s+/g, ' ').slice(0, 140)}`); break; } // its limit message repeats the key
      mkdirSync('.cache/av', { recursive: true });
      writeFileSync(path, body);
      log.push(`av ${s.id} fetched`);
      await sleep(1500);
    }
  }
  console.log(log.filter((l) => !l.endsWith('cached')).join('\n') || 'everything cached');
}

function age(path: string) {
  return existsSync(path) ? Date.now() - statSync(path).mtimeMs : Infinity;
}

main().catch((e) => { console.error(e.message); process.exit(1); });
