// Builds the board's HTML from figures and wording. Layout follows mockup/hopeboard.html.
import logos from '../public/logos/sources.json';
import { fill, type Tokens } from './copy';
import { nowModel, parseFig, pastModel, type Section } from './engine';
import { requiredGrowth } from './formula';
import { decPctFixed, pct, usd } from './format';
import { companyNowTokens, companyPastTokens, eraTokens, spxNowTokens } from './tokens';
import { COMPARES, type Basis, type CardsFile, type Category, type Company, type CopyEntry, type Era, type Figures, type PastEra } from './types';

export interface BoardState {
  era: Era;
  basis: Basis;
  category: Category | 'all';
  /** The section tab shown; 'all' renders every section under its heading (tests). */
  section: Section | 'all';
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
  about?: string; // one line on what the business does
  price: { pre?: string; n: string; unit: string };
  lines: { cls: 'makes' | 'miss'; html: string }[];
  /** The card's compare panel (time buttons and one badge per time scale), opened from a link at the foot. */
  compare?: { link: string; panel: string };
  /** Labelled rows (company cards): Earns, Reasonably priced, Expected next year, Risk. */
  facts?: { label: string; html: string }[];
  why?: { heading: string; bullets: string[] } | { story: [string, string][] };
  base?: boolean;
}

function tile(t: TileParts, copy: Copy): string {
  const price =
    `<div class="price">${t.price.pre ? `<span class="u">${t.price.pre}</span>` : ''}` +
    `<span class="n">${t.price.n}</span><span class="u">${t.price.unit}</span></div>`;
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
    `<div class="name">${esc(t.name)}${t.about ? `<small>${esc(t.about)}</small>` : ''}</div>${price}</div>` +
    t.lines.map((l) => `<p class="${l.cls}">${l.html}</p>`).join('') +
    (t.facts?.length ? `<dl class="facts">${t.facts.map((x) => `<div><dt>${esc(x.label)}</dt><dd>${x.html}</dd></div>`).join('')}</dl>` : '') +
    (link || t.compare
      ? `<div class="foot-links">${t.compare?.panel ?? ''}<div class="links">${link ? `<button type="button" class="whylink" popovertarget="${pop}">${link}</button>` : ''}${t.compare?.link ?? ''}</div></div>`
      : '') +
    `</div>` +
    (link ? `<div class="why" popover id="${pop}">${why}</div>` : '') +
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
  const comparePanel = (co: Company, now: number | null): TileParts['compare'] => {
    if (s.basis !== 't' || now === null || !co.now.then) return undefined;
    const badges = COMPARES.flatMap((c) => {
      const then = co.now.then?.[c];
      if (!then) return [];
      const was = requiredGrowth(then.y, then.pe);
      const kind = pct(was) === pct(now) ? 'same' : was > now ? 'better' : 'worse';
      const arrow = { better: '↓', worse: '↑', same: '=' }[kind];
      const detail = fill(copy.label('compare', kind === 'same' ? 'detailSame' : 'detail'), { then: () => pct(was), now: () => pct(now) }, `${co.id} deal`);
      return [{ c, html: `<div class="deal ${kind}" data-w="${c}">${arrow} ${esc(copy.label('compare', kind))} · ${detail}</div>` }];
    });
    if (!badges.length) return undefined;
    const buttons = badges.map(({ c }) => `<button type="button" data-w="${c}">${esc(copy.label('compare', c))}</button>`).join('');
    return {
      link: `<button type="button" class="cmplink" aria-expanded="false">${esc(copy.label('compare', 'link'))}</button>`,
      panel: `<div class="cmp" hidden><div class="seg" role="group" aria-label="${esc(copy.label('compare', 'label'))}">${buttons}</div>${badges.map((b) => b.html).join('')}</div>`,
    };
  };
  const yearsUnit = (b: Basis) => L(b === 't' ? 'unitT' : 'unitF');
  const heading = (sec: Section) => copy.label('comment-headings', sec);
  const bulletsOf = (e: CopyEntry, tk: Tokens) => ((e.bullets as string[]) ?? []).map((b, i) => fill(b, tk, `${e.id} bullet ${i + 1}`));
  const section = (title: string, tiles: string[]) =>
    tiles.length ? `<h2>${esc(title)}</h2><div class="grid">${tiles.join('')}</div>` : '';
  const inCategory = (co: Company) => s.category === 'all' || co.category === s.category;
  const E = F.eras[s.era];
  const et = eraTokens(F, E);

  // Baselines
  const base: string[] = [];
  const bondId = `bond:${s.era}`;
  base.push(safe(bondId, () => {
    const e = copy.get(bondId);
    if (!e) return null;
    const now = copy.get('bond:now');
    return tile({
      id: bondId, badge: 'US10Y', ...BASE.bond, name: (now?.name as string) ?? 'US Bond', base: true,
      price: { n: '≈' + decPctFixed(E.bond), unit: (now?.unit as string) ?? '' },
      lines: [{ cls: 'makes', html: fill(e.assumes as string, et, bondId) }],
      why: s.era === 'now' ? { heading: e.heading as string, bullets: bulletsOf(e, et) } : undefined,
    }, copy);
  }));
  const goldId = `gold:${s.era}`;
  base.push(safe(goldId, () => {
    const e = copy.get(goldId);
    if (!e) return null;
    const now = copy.get('gold:now');
    return tile({
      id: goldId, badge: 'GOLD', ...BASE.gold, name: (now?.name as string) ?? 'Gold', base: true,
      price: { n: '≈' + usd(parseFig(E.gold).v ?? 0), unit: e.unit as string },
      lines: [
        { cls: 'makes', html: fill(e.assumes as string, et, goldId) },
        ...(e.consequence ? [{ cls: 'miss' as const, html: fill(e.consequence as string, et, goldId) }] : []),
      ],
      why: s.era === 'now'
        ? { heading: e.heading as string, bullets: bulletsOf(e, et) }
        : { story: [[copy.label('past-frame', 'storyHeading'), fill(e.story as string, et, goldId)], [copy.label('past-frame', 'sinceHeading'), fill(e.happened as string, et, goldId)]] },
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
      const m = nowModel({ now: { pe: E.spx.pe, pef: E.spx.pef ?? null, y: E.spx.y } }, F);
      const shown = m.shown(s.basis)!;
      return tile({
        id: spxId, badge: 'SPX', ...BASE.spx, name, base: true,
        price: { pre: L('pricedAt'), n: `${shown.years.text} ${L('years')}`, unit: yearsUnit(shown.basis) },
        lines: [{ cls: 'makes', html: fill(e.assumes as string, tk, spxId) }, { cls: 'miss', html: fill(e.consequence as string, tk, spxId) }],
        why: { heading: heading(m.section === 'loss' ? 'pricey' : m.section), bullets: bulletsOf(e, tk) },
      }, copy);
    }
    const frame = copy.get('past-frame');
    return tile({
      id: spxId, badge: 'SPX', ...BASE.spx, name, base: true,
      price: { pre: L('pricedAt'), n: `${parseFig(E.spx.pe).text} ${L('years')}`, unit: L('unitPast') },
      lines: frame ? [{ cls: 'makes', html: fill(frame.assumes as string, et, spxId) }] : [],
      why: { story: [[copy.label('past-frame', 'storyHeading'), fill(e.story as string, et, spxId)], [copy.label('past-frame', 'sinceHeading'), fill(e.happened as string, et, spxId)]] },
    }, copy);
  }));
  // today's prices are live, so only a past view names its date
  const baselines = section(copy.label('sections', 'baselines') + (s.era === 'now' ? '' : ` — ${E.label}`), base.filter(Boolean));
  let board = '';

  const buckets: Record<Section, { sort: number; html: string }[]> = { pricey: [], normal: [], bargain: [], loss: [] };
  if (s.era === 'now') {
    for (const co of F.companies.filter(inCategory)) {
      const id = `${co.id}:now`;
      const m = nowModel(co, F);
      const html = safe(id, () => {
        const e = copy.get(id);
        if (!e) return null;
        const tk = companyNowTokens(co, s.basis, F, e);
        const shown = m.shown(s.basis);
        const unit = (e.unit as string) ?? '';
        const price = co.now.yearsOfRevenue !== undefined
          ? { pre: L('pricedAt'), n: `${parseFig(co.now.yearsOfRevenue).text} ${L('years')}`, unit }
          : { pre: L('pricedAt'), n: `${shown!.years.text} ${L('years')}`, unit: yearsUnit(shown!.basis) };
        // every company card: what the price needs, what the business earns against the bond,
        // what analysts expect next year, and what happens if growth falls short
        const shared = copy.get('company-lines');
        const earnsNow = !m.pe.loss && m.shown(s.basis) !== null && !(co.now.profits && (co.now.profits.last ?? 0) < 0);
        // the farm line leads; the rest reads as commentary under it
        const tpl: [string, string | undefined][] = [
          ['farm', earnsNow ? (shared?.farm as string | undefined) : undefined],
          ['assumes', e.assumes as string | undefined],
          ['forecast', co.now.forecast !== undefined && co.now.forecast !== null ? (shared?.forecast as string | undefined) : undefined],
          ['consequence', e.consequence as string | undefined],
        ];
        const labels = (shared?.labels ?? {}) as Record<string, string>;
        const facts = tpl.filter(([, t]) => typeof t === 'string')
          .map(([f, t]) => {
            const html = fill(t!, tk, `${id} ${f}`);
            // the risk row is good news on cheap cards: no loss, and no "less than"
            const good = f === 'consequence' && !html.includes('class="loss"') && !html.includes('/year less</b>');
            return { label: (good ? labels.consequenceGood : labels[f]) ?? '', html };
          });
        return tile({ id, badge: co.id, logo: HAS_LOGO.has(co.id) ? co.id : undefined, color: co.color, name: co.name, about: aboutOf(copy, co.id), price, lines: [], facts, compare: comparePanel(co, m.req('t')), why: { heading: heading(m.section), bullets: bulletsOf(e, tk) } }, copy);
      });
      if (html) buckets[m.section].push({ sort: m.sectionReq ?? -Infinity, html });
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
        const makes = m.req === null ? fill(frame.noProfit as string, tk, id) : fill(frame.assumes as string, tk, id);
        return tile({
          id, badge: co.id, logo: HAS_LOGO.has(co.id) ? co.id : undefined, color: co.color, name: co.name, about: aboutOf(copy, co.id),
          price: { pre: L('pricedAt'), n: `${m.pe.text} ${L('years')}`, unit: L('unitPast') },
          lines: [{ cls: 'makes', html: makes }],
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
    board += `<div class="tabs" role="tablist">` + SECTIONS.map((sec) =>
      `<button type="button" role="tab" data-sec="${sec}" aria-selected="${sec === s.section}"${counts[sec] ? '' : ' disabled'}>${esc(label(sec))}<span class="count">${counts[sec]}</span></button>`).join('') + `</div>`;
    const tiles = sorted(s.section);
    board += tiles.length ? `<div class="grid">${tiles.join('')}</div>` : '';
  }

  const footId = s.era === 'now' ? 'foot:now' : 'foot:past';
  const foot = safe(footId, () => {
    const e = copy.get(footId);
    return e ? fill(e.text as string, et, footId) : null;
  });
  return { board: baselines + board, baselines, companies: board, counts, foot, errors };
}
