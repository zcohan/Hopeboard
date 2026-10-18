// Reads figures straight from companies' filed reports (their XBRL instance
// files), for what the SEC's summary data leaves out: figures reported per share
// class (Visa, Berkshire, Airbnb) and the most recent quarters when the summary
// lags. Instances are cached in .cache/xbrl/.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

// the SEC asks for a contact email in the User-Agent; set SEC_CONTACT in .env.local
const envFile = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
const UA = `Hopeboard research ${process.env.SEC_CONTACT ?? /^SEC_CONTACT=(.*)$/m.exec(envFile)?.[1]?.trim() ?? ''}`.trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Fact { start?: string; end: string; val: number; filed: string; form: string; unit?: string }

interface Filing { form: string; filed: string; accession: string; doc: string }

/** Cached download; `maxAge` re-fetches files that change (the filing lists), others are kept forever. */
async function getText(url: string, path: string, maxAge = Infinity): Promise<string> {
  if (existsSync(path) && Date.now() - statSync(path).mtimeMs < maxAge) return readFileSync(path, 'utf8');
  await sleep(120);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const body = await res.text();
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  writeFileSync(path, body);
  return body;
}

/** Annual and quarterly reports (and registration statements, for new listings) since `from`. */
export async function filings(cik: number, from: string, forms = /^(10-K|10-Q|20-F|40-F|S-1|S-1\/A)$/): Promise<Filing[]> {
  const id = String(cik).padStart(10, '0');
  const subs = JSON.parse(await getText(`https://data.sec.gov/submissions/CIK${id}.json`, `.cache/xbrl/${id}/submissions.json`, 20 * 3_600_000));
  const pages = [subs.filings.recent];
  for (const f of subs.filings.files ?? []) pages.push(JSON.parse(await getText(`https://data.sec.gov/submissions/${f.name}`, `.cache/xbrl/${id}/${f.name}`)));
  const out: Filing[] = [];
  for (const r of pages)
    for (let i = 0; i < r.form.length; i++)
      if (forms.test(r.form[i]) && r.filingDate[i] >= from && r.isXBRL?.[i] !== 0)
        out.push({ form: r.form[i], filed: r.filingDate[i], accession: r.accessionNumber[i], doc: r.primaryDocument[i] });
  return out.sort((a, b) => a.filed.localeCompare(b.filed));
}

export async function instance(cik: number, f: Filing): Promise<string | null> {
  const id = String(cik).padStart(10, '0');
  const dir = f.accession.replace(/-/g, '');
  const path = `.cache/xbrl/${id}/${dir}.xml`;
  if (existsSync(path)) return readFileSync(path, 'utf8');
  const idx = JSON.parse(await getText(`https://www.sec.gov/Archives/edgar/data/${cik}/${dir}/index.json`, `.cache/xbrl/${id}/${dir}.index.json`));
  const names: string[] = idx.directory.item.map((x: { name: string }) => x.name);
  const xml = names.find((n) => n.endsWith('_htm.xml')) ?? names.find((n) => /\.xml$/.test(n) && !/(_cal|_def|_lab|_pre|FilingSummary|MetaLinks)/.test(n));
  if (!xml) return null;
  return getText(`https://www.sec.gov/Archives/edgar/data/${cik}/${dir}/${xml}`, path);
}

interface Context { start?: string; end: string; members: string[] }

export function contexts(xml: string): Map<string, Context> {
  const out = new Map<string, Context>();
  for (const m of xml.matchAll(/<(?:xbrli:)?context\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/(?:xbrli:)?context>/g)) {
    const body = m[2];
    const start = /<(?:xbrli:)?startDate>([^<]+)</.exec(body)?.[1];
    const end = /<(?:xbrli:)?endDate>([^<]+)</.exec(body)?.[1] ?? /<(?:xbrli:)?instant>([^<]+)</.exec(body)?.[1];
    if (!end) continue;
    const members = [...body.matchAll(/<xbrldi:explicitMember[^>]*>([^<]+)</g)].map((x) => x[1].trim());
    out.set(m[1], { start: start?.trim(), end: end.trim(), members });
  }
  return out;
}

/**
 * Every value of `concept` (e.g. "us-gaap:EarningsPerShareDiluted") in the company's reports since `from`.
 * `member` picks a share class (e.g. /ClassA/); without it, only values with no breakdown are taken.
 */
export async function readFacts(cik: number, concept: string, from: string, member?: RegExp): Promise<Fact[]> {
  const out: Fact[] = [];
  const re = new RegExp(`<${concept.replace(':', '\\:')}\\b([^>]*)>([^<]+)</${concept.replace(':', '\\:')}>`, 'g');
  for (const f of await filings(cik, from)) {
    const xml = await instance(cik, f);
    if (!xml) continue;
    const ctx = contexts(xml);
    for (const m of xml.matchAll(re)) {
      const ref = /contextRef="([^"]+)"/.exec(m[1])?.[1];
      const c = ref ? ctx.get(ref) : undefined;
      if (!c) continue;
      if (member ? !(c.members.length === 1 && member.test(c.members[0])) : c.members.length) continue;
      const val = Number(m[2].trim());
      const unit = /unitRef="([^"]+)"/.exec(m[1])?.[1];
      if (!Number.isNaN(val)) out.push({ start: c.start, end: c.end, val, filed: f.filed, form: f.form, unit });
    }
  }
  return out;
}

/** Reads each source's supplements and saves them where Filings picks them up. */
export async function loadSupplements(sources: { cik: number[]; supplement?: { concept: string; as: string; member?: string }[] }[], from = '2014-06-01') {
  for (const s of sources) {
    if (!s.supplement) continue;
    const cik = s.cik[s.cik.length - 1];
    const out: Record<string, Fact[]> = {};
    for (const x of s.supplement) (out[x.as] ??= []).push(...(await readFacts(cik, x.concept, from, x.member ? new RegExp(x.member) : undefined)));
    writeFileSync(`.cache/xbrl/${String(cik).padStart(10, '0')}/supplement.json`, JSON.stringify(out));
  }
}
