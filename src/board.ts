// Builds the board's HTML from figures and wording. Layout follows mockup/hopeboard.html.
import logos from '../public/logos/sources.json';
import { fill, type Tokens } from './copy';
import { nowModel, parseFig, pastModel, type Section } from './engine';
import { requiredGrowth } from './formula';
import { decPctFixed, pct } from './format';
import { companyNowTokens, companyPastTokens, eraTokens, spxNowTokens } from './tokens';
import { COMPARES, MAG7, type Basis, type CardsFile, type Category, type Company, type CopyEntry, type Era, type Figures, type PastEra } from './types';

export interface BoardState {
  era: Era;
  basis: Basis;
  category: Category | 'all' | 'mag7';
  /** The section tab shown; 'every' is the All tab (one grid, most required growth first);
   * 'all' renders every section under its heading (tests). */
  section: Section | 'all' | 'every';
}

export class Copy {
  private byId: Map<string, CopyEntry>;
  constructor(file: CardsFile) {
    this.byId = new Map(file.entries.map((e) => [e.id, e]));
  }
  get(id: string): CopyEntry | null {
    return this.byId.get(id) ?? null;
  }
  /** Chrome wording (labels, section names). */
  label(id: string, field: string): string {
    const v = this.get(id)?.[field];
    return typeof v === 'string' ? v : '';
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface TileParts {
  id: string; // copy entry id, for errors
  badge: string;
  logo?: string; // company id with a file in public/logos
  icon?: string; // inline SVG glyph for a baseline
  color: string;
  name: string;
  /** where the name links: the company's page on Yahoo Finance */
  href?: string;
  about?: string; // one line on what the business does
  /** The years figure, top right; gold has none (no profit or interest to count years of). */
  price?: { pre?: string; n: string; unit: string };
  lines: { cls: 'makes' | 'miss'; html: string }[];
  /** The card's compare panel (time buttons and one badge per time scale), opened from a link at the foot. */
  compare?: { link: string; panel: string };  // link text, and the popover's contents
  /** Labelled rows (company cards): Earns, Reasonably priced, Expected next year, Risk. */
  facts?: { label: string; html: string; cls?: string }[];
  why?: { heading: string; bullets: string[] } | { story: [string, string][] };
  /** The card as it was on each Compare over time date: its own years figure and sections, shown in place of
   * today's when that date is picked. */
  at?: { w: string; price: TileParts['price']; facts: NonNullable<TileParts['facts']> }[];
  /** A second bubble from its own link at the foot: the company's finances */
  extra?: { link: string; html: string };
  base?: boolean;
}

/** The Finances bubble, opened from its link at the foot of the card: cash or debt, dividends and the share count,
 * each under its own small heading, each left off when its figure isn't in the data. */
function financesBubble(co: Company, section: Section, shared: CopyEntry | null | undefined, tk: Tokens, id: string, entry?: CopyEntry): { link: string; html: string } | undefined {
  if (!shared) return undefined;
  const labels = (shared.labels ?? {}) as Record<string, string>;
  const rows: [string, string][] = [];
  // Cash, Debt, or Cash & debt when they're close
  const b = balanceRow(co, section, shared)[0];
  if (b?.[1]) rows.push([labels[b[2]] ?? '', b[1]]);
  // the biggest stakes are named on the card's own entry (`stakesNames`), from the company's filings
  const names = entry?.stakesNames as string | undefined;
  if (co.now.balance?.stakes && section !== 'loss') rows.push([labels.stakes, names ? (shared.stakesNamed as string).replace('{stakesNames}', names) : (shared.stakes as string)]);
  // how much of each dollar of sales it keeps (not on cards with little or no profit, where one-off years can mislead)
  const mg = co.now.margin;
  if (mg !== undefined && section !== 'loss') rows.push([labels.margin, (mg < 0 ? shared.marginLoses : shared.marginKeeps) as string]);
  rows.push([labels.dividends, (co.now.y > 0 ? shared.dividends : shared.noDividend) as string]);
  const sh = co.now.shares;
  if (sh) rows.push([labels.shares, (Math.abs(sh.rate) < 0.005 ? shared.sharesSteady : sh.rate < 0 ? shared.sharesDown : shared.sharesUp) as string]);
  // what its price assumed ten years ago against what the business then did
  const was = pastModel(co, 'y10');
  if (was?.req !== null && was?.req !== undefined && co.now.last !== null && co.now.last !== undefined) {
    const r = Math.round(was.req * 100);
    rows.push([labels.track, (r > 0 ? shared.track : r < 0 ? shared.trackShrink : shared.trackFlat) as string]);
  }
  return {
    link: shared.financesLink as string,
    html: rows.map(([h, t]) => `<h4>${esc(h)}</h4><p class="story">${fill(t, tk, `${id} finances`)}</p>`).join(''),
  };
}

/** Which Cash / Debt wording, and its label. Years of profit where there is a profit to count in;
 * dollars on cards that are Not profitable. */
function balanceRow(co: Company, section: Section, shared: CopyEntry | null | undefined): [string, string | undefined, string][] {
  const b = co.now.balance;
  if (!b || !shared) return [];
  const net = b.cash - b.debt;
  const inYears = section !== 'loss' && b.profit !== undefined && b.profit > 0;
  const key = inYears
    ? Math.abs(net) / b.profit! < 0.25 ? 'balanceEven' : net > 0 ? 'balanceCash' : 'balanceDebt'
    : net >= 0 ? 'balanceCashDollars' : 'balanceDebtDollars';
  const label = key.startsWith('balanceEven') ? 'balanceEven' : key.startsWith('balanceCash') ? 'balanceCash' : 'balanceDebt';
  return [['balance', shared[key] as string | undefined, label]];
}

/** A quote page on Yahoo Finance; Yahoo writes share classes with a dash (BRK-B). */
const yahoo = (symbol: string) => `https://finance.yahoo.com/quote/${encodeURIComponent(symbol.replace('.', '-'))}/`;

function tile(t: TileParts, copy: Copy): string {
  const priceOf = (p: TileParts['price'], w?: string) => p
    ? `<div class="price"${w ? ` data-at="${w}"${w === 'now' ? '' : ' hidden'}` : ''}>${p.pre ? `<span class="u">${p.pre}</span>` : ''}` +
      `<span class="n">${p.n}</span><span class="u">${p.unit}</span></div>`
    : '';
  const factsOf = (f: TileParts['facts'], w?: string) => f?.length
    ? `<dl class="facts"${w ? ` data-at="${w}"${w === 'now' ? '' : ' hidden'}` : ''}>${f.map((x) => `<div class="${x.cls ?? ''}"><dt>${esc(x.label)}</dt><dd>${x.html}</dd></div>`).join('')}</dl>`
    : '';
  // a card with dates to compare carries each date's version, today's showing
  const price = t.at ? priceOf(t.price, 'now') + t.at.map((a) => priceOf(a.price, a.w)).join('') : priceOf(t.price);
  const factsHtml = t.at ? factsOf(t.facts, 'now') + t.at.map((a) => factsOf(a.facts, a.w)).join('') : factsOf(t.facts);
  // The comment bubble opens on demand from a link under the card (a popover).
  // The link carries the bubble's heading; for past views, the first story heading.
  let link = '', why = '';
  const pop = 'why-' + t.id.replace(/[^a-z0-9]/gi, '-');
  if (t.why && 'bullets' in t.why && t.why.heading) {
    link = t.why.heading;
    why = `<ul>${t.why.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
  } else if (t.why && 'story' in t.why && t.why.story[0][0]) {
    link = t.why.story[0][0];
    why = t.why.story.map(([h, p], i) => `${h && i > 0 ? `<h4>${h}</h4>` : ''}<p class="story">${p}</p>`).join('');
  }
  return (
    `<div class="tile${t.base ? ' base' : ''}" data-copy="${esc(t.id)}">` +
    `<div class="top"><div class="head">` +
    (t.icon ? `<div class="logo" style="background:${t.color}" aria-hidden="true">${t.icon}</div>` : t.logo ? `<div class="logo img" data-logo="${esc(t.logo)}"></div>` : `<div class="logo" style="background:${t.color}">${esc(t.badge)}</div>`) +
    `<div class="name">${t.href ? `<a class="namelink" href="${esc(t.href)}" target="_blank" rel="noopener">${esc(t.name)}</a>` : esc(t.name)}${t.about ? `<small>${esc(t.about)}</small>` : ''}</div>${price}</div>` +
    t.lines.map((l) => `<p class="${l.cls}">${l.html}</p>`).join('') +
    factsHtml +
    (link || t.compare
      ? `<div class="foot-links"><div class="links">${link ? `<button type="button" class="whylink" popovertarget="${pop}">${link}</button>` : ''}` +
        `${t.extra ? `<button type="button" class="whylink" popovertarget="${pop}-x">${esc(t.extra.link)}</button>` : ''}` +
        `${t.compare ? `<button type="button" class="whylink" popovertarget="${pop}-c">${esc(t.compare.link)}</button>` : ''}</div></div>`
      : '') +
    `</div>` +
    (link ? `<div class="why" popover id="${pop}">${why}</div>` : '') +
    (t.extra ? `<div class="why" popover id="${pop}-x">${t.extra.html}</div>` : '') +
    (t.compare ? `<div class="why cmp" popover id="${pop}-c">${t.compare.panel}</div>` : '') +
    `</div>`
  );
}

function errorTile(id: string, err: unknown): string {
  return `<div class="tile error" data-copy="${esc(id)}"><div class="top"><p class="miss"><b>${esc(id)}</b>: ${esc(String((err as Error).message ?? err))}</p></div></div>`;
}

export const SECTIONS: Section[] = ['pricey', 'normal', 'bargain', 'loss'];
const HAS_LOGO = new Set(Object.keys(logos));
const aboutOf = (copy: Copy, id: string) => copy.label(`${id}:now`, 'about') || undefined;

const glyph = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
/** Baseline badges: a government building for the bond, stacked bars for gold, a rising line for the index. */
const BASE = {
  bond: { color: 'linear-gradient(140deg,#5B9BFF,#2F63E0)', icon: glyph('<path d="M3 9.5 12 4l9 5.5z"/><path d="M5.5 12v6M10 12v6M14 12v6M18.5 12v6"/><path d="M3 20.5h18"/>') },
  gold: { color: 'linear-gradient(140deg,#FFD15C,#F2A20C)', icon: glyph('<path d="M8 4.5h8l2 5H6z"/><path d="M3 19.5l2-5h6l2 5zM11 19.5l2-5h6l2 5z"/>') },
  spx: { color: 'linear-gradient(140deg,#3EDB9F,#10A36F)', icon: glyph('<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>') },
};

export interface Rendered {
  /** baselines + companies */
  board: string;
  baselines: string;
  /** section tabs (or headings) and company cards */
  companies: string;
  /** Cards in each section, after the category filter. */
  counts: Record<Section, number>;
  foot: string;
  errors: string[];
}

/** "+5%", "−2%" or "0%": a growth rate as a headline shows it (never "−0%") */
const signedPct = (g: number) => { const p = pct(g); return p === '−0%' || p === '0%' ? '0%' : p.startsWith('−') ? p : `+${p}`; };

/** Years of profit rounded as a card shows them (as figures.ts writes them): whole years from 10 up, else one decimal. */
const shownYears = (pe: number) => (pe >= 10 ? Math.round(pe) : Math.round(pe * 10) / 10);

export function renderBoard(F: Figures, C: CardsFile, s: BoardState): Rendered {
  const copy = new Copy(C);
  const errors: string[] = [];
  const safe = (id: string, f: () => string | null): string => {
    try {
      return f() ?? '';
    } catch (e) {
      errors.push(`${id}: ${(e as Error).message}`);
      return import.meta.env?.DEV ? errorTile(id, e) : '';
    }
  };
  const L = (field: string) => copy.label('page', field);
  // the compare panel: one badge per time scale, shown when the reader opens it and picks one.
  // Lower required growth is a better deal. Last year's profit only, so not on the forecast view.
  const comparePanel = (co: Company, now: number | null, section: Section): TileParts['compare'] => {
    // growth rates mean nothing for a company with little or no profit
    if (s.basis !== 't' || now === null || !co.now.then || section === 'loss') return undefined;
    const badges = COMPARES.flatMap((c) => {
      const then = co.now.then?.[c];
      // a date needs its bond too, or its version of the card can't be built
      if (!then || F.eras.now.bondThen?.[c] === undefined) return [];
      // from the years of profit as that date's card shows them, so the badge and the card agree
      const was = requiredGrowth(then.y, shownYears(then.pe));
      const kind = pct(was) === pct(now) ? 'same' : was > now ? 'better' : 'worse';
      const detail = fill(copy.label('compare', kind === 'same' ? 'detailSame' : 'detail'), { then: () => pct(was), now: () => pct(now) }, `${co.id} deal`);
      return [{ c, html: `<div class="deal ${kind}" data-w="${c}">${esc(copy.label('compare', kind))} · ${detail}</div>` }];
    });
    if (!badges.length) return undefined;
    // the cheapest month in the last decade (or since listing), under the date buttons
    const ch = co.now.cheapest;
    const cheapest = ch ? `<p class="cheapest">${fill(copy.label('compare', ch.since ? 'cheapestSince' : 'cheapest'), {
      month: () => new Date(`${ch.month}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      since: () => ch.since ?? '',
      req: () => signedPct(ch.req),
    }, `${co.id} cheapest`)}</p>` : '';
    const buttons = `<button type="button" data-w="now">${esc(copy.label('compare', 'now'))}</button>` + badges.map(({ c }) => `<button type="button" data-w="${c}">${esc(copy.label('compare', c))}</button>`).join('');
    return {
      link: copy.label('compare', 'link'),
      panel: `<div class="seg" role="group" aria-label="${esc(copy.label('compare', 'label'))}">${buttons}</div>${badges.map((b) => b.html).join('')}${cheapest}`,
    };
  };
  const yearsUnit = (b: Basis) => L(b === 't' ? 'unitT' : 'unitF');
  const heading = (sec: Section) => copy.label('comment-headings', sec);
  const bulletsOf = (e: CopyEntry, tk: Tokens) => ((e.bullets as string[]) ?? []).map((b, i) => fill(b, tk, `${e.id} bullet ${i + 1}`));
  const section = (title: string, tiles: string[]) =>
    tiles.length ? `<h2>${esc(title)}</h2><div class="grid">${tiles.join('')}</div>` : '';
  const inCategory = (co: Company) => s.category === 'all' || (s.category === 'mag7' ? MAG7.includes(co.id) : co.category === s.category);
  const E = F.eras[s.era];
  const et = eraTokens(F, E);
  // the labelled sections of a card: Earns, Priced for, Cash or Debt, Risk (or Cushion). An entry may name its
  // label (Cash, Debt or Cash & debt) in place of the section's own.
  const facts = (id: string, tk: Tokens, tpl: ([string, string | undefined] | [string, string | undefined, string])[]) => {
    const labels = (copy.get('company-lines')?.labels ?? {}) as Record<string, string>;
    return tpl.filter(([, t]) => typeof t === 'string')
      .map(([f, t, labelKey]) => {
        const html = fill(t!, tk, `${id} ${f}`);
        // the risk row is good news when you'd do at least as well as the safe US bond: no loss, and not less
        const good = f === 'consequence' && !html.includes('class="loss"') && !html.includes(' less</b>');
        // Earns and Priced for read as a headline figure with notes under it
        const lines = html.split('\n');
        // Priced for's notes run on as one short paragraph; Earns keeps one note per line
        const notes = f === 'assumes' ? [lines.slice(1).join(' ')].filter(Boolean) : lines.slice(1);
        const shaped = f === 'farm' || f === 'assumes' || f === 'balance' ? [`<span class="headline">${lines[0]}</span>`, ...notes.map((l) => `<span class="note">${l}</span>`)].join('') : html;
        return { label: (labelKey ? labels[labelKey] : good ? labels.consequenceGood : labels[f]) ?? '', html: shaped, cls: f };
      });
  };

  // Baselines
  const base: string[] = [];
  const bondId = `bond:${s.era}`;
  base.push(safe(bondId, () => {
    const e = copy.get(bondId);
    if (!e) return null;
    const now = copy.get('bond:now');
    return tile({
      id: bondId, badge: 'US10Y', ...BASE.bond, name: (now?.name as string) ?? 'US Bond', href: yahoo('^TNX'), base: true,
      // the bond in the board's own unit: years of its yearly interest, like years of profit for a stock
      price: { pre: L('pricedAt'), n: `${Math.round(1 / E.bond)} ${L('years')}`, unit: (now?.unit as string) ?? '' },
      lines: [
        { cls: 'makes', html: fill(e.assumes as string, et, bondId) },
        ...(e.consequence ? [{ cls: 'miss' as const, html: fill(e.consequence as string, et, bondId) }] : []),
      ],
      why: s.era === 'now' ? { heading: e.heading as string, bullets: bulletsOf(e, et) } : undefined,
    }, copy);
  }));
  const spxId = `spx:${s.era}`;
  base.push(safe(spxId, () => {
    const e = copy.get(spxId);
    if (!e) return null;
    const now = copy.get('spx:now');
    const name = (now?.name as string) ?? 'S&P 500';
    if (s.era === 'now') {
      const tk = spxNowTokens(F, s.basis, e);
      const m = nowModel({ now: { pe: E.spx.pe, pef: E.spx.pef ?? null, y: E.spx.y } }, F, s.basis);
      const shown = m.shown(s.basis)!;
      return tile({
        id: spxId, badge: 'SPX', ...BASE.spx, name, href: yahoo('^GSPC'), base: true,
        price: { pre: L('pricedAt'), n: `${shown.years.text} ${L('years')}`, unit: yearsUnit(shown.basis) },
        lines: [], facts: facts(spxId, tk, [['farm', (e.farm ?? copy.get('company-lines')?.farm) as string], ['assumes', e.assumes as string], ['consequence', e.consequence as string]]),
        why: { heading: heading(m.section === 'loss' ? 'pricey' : m.section), bullets: bulletsOf(e, tk) },
      }, copy);
    }
    const frame = copy.get('past-frame');
    return tile({
      id: spxId, badge: 'SPX', ...BASE.spx, name, href: yahoo('^GSPC'), base: true,
      price: { pre: L('pricedAt'), n: `${parseFig(E.spx.pe).text} ${L('years')}`, unit: L('unitPast') },
      lines: [], facts: frame ? facts(spxId, et, [['assumes', frame.assumes as string]]) : [],
      why: { story: [[copy.label('past-frame', 'storyHeading'), fill(e.story as string, et, spxId)], [copy.label('past-frame', 'sinceHeading'), fill(e.happened as string, et, spxId)]] },
    }, copy);
  }));
  // today's prices are live, so only a past view names its date
  const goldId = `gold:${s.era}`;
  base.push(safe(goldId, () => {
    const e = copy.get(goldId);
    if (!e) return null;
    const now = copy.get('gold:now');
    return tile({
      id: goldId, badge: 'GOLD', ...BASE.gold, name: (now?.name as string) ?? 'Gold', href: yahoo('GC=F'), base: true,
      lines: [
        { cls: 'makes', html: fill(e.assumes as string, et, goldId) },
        ...(e.consequence ? [{ cls: 'miss' as const, html: fill(e.consequence as string, et, goldId) }] : []),
      ],
      why: s.era === 'now'
        ? { heading: e.heading as string, bullets: bulletsOf(e, et) }
        : { story: [[copy.label('past-frame', 'storyHeading'), fill(e.story as string, et, goldId)], [copy.label('past-frame', 'sinceHeading'), fill(e.happened as string, et, goldId)]] },
    }, copy);
  }));
  const baselines = section(copy.label('sections', 'baselines'), base.filter(Boolean));
  let board = '';

  const buckets: Record<Section, { sort: number; html: string }[]> = { pricey: [], normal: [], bargain: [], loss: [] };
  if (s.era === 'now') {
    for (const co of F.companies.filter(inCategory)) {
      const id = `${co.id}:now`;
      const m = nowModel(co, F, s.basis);
      const html = safe(id, () => {
        const e = copy.get(id);
        if (!e) return null;
        const shared = copy.get('company-lines');
        // the years figure and the three sections for the company as it stands in `c`, with the bond in `FF`
        const card = (c: Company, FF: Figures, basis: Basis) => {
          const mm = nowModel(c, FF, basis);
          const tk = companyNowTokens(c, basis, FF, e);
          const shown = mm.shown(basis);
          const unit = (e.unit as string) ?? '';
          // Not profitable: no number in the corner, since there's no profit to count years in (the bet is that it
          // becomes profitable, which the card's dollar lines spell out). Years of revenue aren't shown: the board is about profit
          const price = mm.section === 'loss' || !shown ? undefined
            : { pre: L('pricedAt'), n: `${shown.years.text} ${L('years')}`, unit: yearsUnit(shown.basis) };
          // every company card: what the price needs, what the business earns against the bond,
          // what analysts expect next year, and what happens if growth falls short
          const earnsNow = mm.section !== 'loss' && mm.shown(basis) !== null;
          const tpl: ([string, string | undefined] | [string, string | undefined, string])[] = [
            // little or no profit: the card's own line on what it made (or lost), in dollars
            ['farm', earnsNow ? (shared?.farm as string | undefined) : (e.earns as string | undefined)],
            // the analysts' forecast sits under the requirement as a note, so the two growth figures read together
            ['assumes', e.assumes === undefined ? undefined : (e.assumes as string) + (c.now.forecast !== undefined && c.now.forecast !== null && shared?.forecast ? `\n${shared.forecast as string}` : '')],
            ['consequence', e.consequence as string | undefined],
          ];
          return { tk, price, facts: facts(id, tk, tpl) };
        };
        const today = card(co, F, s.basis);
        const compare = comparePanel(co, m.req('t'), m.section);
        // the card as it was on each Compare over time date: that day's years of profit, dividend and bond;
        // no forecast (the board keeps only today's)
        const at = compare ? COMPARES.flatMap((w) => {
          const t = co.now.then?.[w];
          const bondThen = F.eras.now.bondThen?.[w];
          if (!t || bondThen === undefined) return [];
          // years of profit rounded like today's: whole years from 10 up
          const was: Company = { ...co, now: { ...co.now, pe: shownYears(t.pe), pef: null, y: t.y, forecast: null } };
          const FF: Figures = { ...F, eras: { ...F.eras, now: { ...F.eras.now, bond: bondThen } } };
          const v = card(was, FF, 't');
          return [{ w, price: v.price, facts: v.facts }];
        }) : undefined;
        return tile({ id, badge: co.id, logo: HAS_LOGO.has(co.id) ? co.id : undefined, color: co.color, name: co.name, href: yahoo(co.id), about: aboutOf(copy, co.id), price: today.price, lines: [], facts: today.facts, at, extra: financesBubble(co, m.section, shared, today.tk, id, e), compare, why: { heading: heading(m.section), bullets: bulletsOf(e, today.tk) } }, copy);
      });
      // not profitable: the most years of profit first, and an outright loss (no years to count) ahead of those
      if (html) buckets[m.section].push({ sort: m.section === 'loss' ? m.pe.v ?? Infinity : m.sectionReq ?? -Infinity, html });
    }

  } else {
    const era = s.era as PastEra;
    const frame = copy.get('past-frame');
    for (const co of F.companies.filter(inCategory)) {
      const m = pastModel(co, era);
      if (!m) continue;
      const id = `${co.id}:${era}`;
      const html = safe(id, () => {
        const e = copy.get(id);
        if (!e || !frame) return null;
        const tk = companyPastTokens(co, era, F);
        // the past in the same shape as today: Priced for, as a headline; a loss year says so instead
        return tile({
          id, badge: co.id, logo: HAS_LOGO.has(co.id) ? co.id : undefined, color: co.color, name: co.name, href: yahoo(co.id), about: aboutOf(copy, co.id),
          // a loss year has no years of profit to show; its line says so
          price: m.pe.loss ? undefined : { pre: L('pricedAt'), n: `${m.pe.text} ${L('years')}`, unit: L('unitPast') },
          lines: m.req === null ? [{ cls: 'makes', html: fill((m.barely ? frame.barelyProfit : frame.noProfit) as string, tk, id) }] : [],
          facts: m.req === null ? undefined : facts(id, tk, [['assumes', frame.assumes as string]]),
          why: { story: [[copy.label('past-frame', 'storyHeading'), fill(e.story as string, tk, id)], [copy.label('past-frame', 'sinceHeading'), fill(e.happened as string, tk, id)]] },
        }, copy);
      });
      if (html) buckets[m.section].push({ sort: m.req ?? -Infinity, html });
    }
  }

  const sorted = (sec: Section) => buckets[sec].sort((a, b) => b.sort - a.sort).map((x) => x.html);
  const counts = Object.fromEntries(SECTIONS.map((sec) => [sec, buckets[sec].length])) as Record<Section, number>;
  const label = (sec: Section) => copy.label('sections', s.era === 'now' ? sec : `${sec}Then`);
  if (s.section === 'all') for (const sec of SECTIONS) board += section(label(sec), sorted(sec));
  else {
    const total = SECTIONS.reduce((n, sec) => n + counts[sec], 0);
    const tab = (sec: string, name: string, n: number) =>
      `<button type="button" role="tab" data-sec="${sec}" aria-selected="${sec === s.section}"${n ? '' : ' disabled'}>${esc(name)}<span class="count">${n}</span></button>`;
    board += `<div class="tabs" role="tablist">` + tab('every', copy.label('sections', 'every'), total) + SECTIONS
      // Not profitable is left off when nothing in view lost money
      .filter((sec) => sec !== 'loss' || counts.loss).map((sec) => tab(sec, label(sec), counts[sec])).join('') + `</div>`;
    // All: the not profitable first (their price needs more growth than any percentage), then the most required growth down
    const tiles = s.section === 'every' ? (['loss', 'pricey', 'normal', 'bargain'] as Section[]).flatMap(sorted) : sorted(s.section);
    board += tiles.length ? `<div class="grid">${tiles.join('')}</div>` : '';
  }

  const footId = s.era === 'now' ? 'foot:now' : 'foot:past';
  const foot = safe(footId, () => {
    const e = copy.get(footId);
    return e ? fill(e.text as string, et, footId) : null;
  });
  return { board: baselines + board, baselines, companies: board, counts, foot, errors };
}
