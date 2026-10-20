// The pages as HTML strings, with no browser needed: the app draws them in the browser, and the build writes them out
// as finished pages for search engines, link previews and AI tools (scripts/prerender.ts).
import { Copy, renderBoard, SECTIONS, type BoardState } from './board';
import { fill } from './copy';
import { pageTokens } from './tokens';
import { parsePage } from './pages';
import { CATEGORIES, type CardsFile, type Era, type Figures } from './types';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Three pages: the board, the philosophy and the methodology.
export type Route = 'board' | 'philosophy' | 'methodology';
export const ROUTES: Route[] = ['board', 'philosophy', 'methodology'];
export const href = (r: Route, base = '/') => (r === 'board' ? base : `${base}${r}`);

export function pill(attr: string, value: string, label: string, on: boolean) {
  return label ? `<button type="button" class="${on ? 'on' : ''}" data-${attr}="${value}">${esc(label)}</button>` : '';
}

export function sourcesHtml(copy: Copy, F: Figures): string {
  const e = copy.get('sources');
  if (!e) return '';
  const items = Object.values(F.sources).map((s) => {
    const name = s.url ? `<a href="${s.url}">${esc(s.name)}</a>` : esc(s.name);
    return `<li>${name}${s.date ? `, ${esc(s.date)}` : ''}${s.rough ? ` (${esc(e.rough as string)})` : ''}${s.note ? `. ${esc(s.note)}` : ''}</li>`;
  });
  items.push(`<li>Company logos: <a href="https://commons.wikimedia.org/">Wikimedia Commons</a> (public domain; the brands belong to their owners)</li>`);
  return `<div class="sources"><ul>${items.join('')}</ul></div>`;
}

/** The time and profit menu: a clock button in the header, open until a choice is made. */
export function whenButton(copy: Copy, state: BoardState, open: boolean): string {
  const L = (f: string) => copy.label('page', f);
  const eras: [Era, string][] = [['now', 'eraNow'], ['y1', 'eraY1'], ['y5', 'eraY5'], ['y10', 'eraY10']];
  const item = (attr: string, value: string, label: string, on: boolean) =>
    `<button type="button" role="menuitemradio" aria-checked="${on}" class="${on ? 'on' : ''}" data-${attr}="${value}">${esc(label)}</button>`;
  // a dot on the clock says the board isn't showing today's prices against last year's profit
  const changed = state.era !== 'now' || state.basis !== 't';
  return `<div class="when"><button type="button" class="whenbtn${changed ? ' changed' : ''}" aria-haspopup="menu" aria-expanded="${open}" aria-label="${esc(L('whenButton'))}" title="${esc(L('whenButton'))}">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></button>` +
    `<div class="whenmenu" role="menu"${open ? '' : ' hidden'}><p class="mh">${esc(L('whenHeading'))}</p>${eras.map(([e, f]) => item('era', e, L(f), state.era === e)).join('')}` +
    (state.era === 'now' ? `<hr><p class="mh">${esc(L('basisHeading'))}</p>${item('basis', 't', L('basisT'), state.basis === 't')}${item('basis', 'f', L('basisF'), state.basis === 'f')}` : '') +
    `</div></div>`;
}

export function themeButton(dark: boolean): string {
  const icon = dark
    ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
    : '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>';
  return `<button type="button" class="theme" aria-label="${dark ? 'Light mode' : 'Dark mode'}" title="${dark ? 'Light mode' : 'Dark mode'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></button>`;
}

export interface HeaderOptions { base: string; state: BoardState; whenOpen: boolean; dark: boolean }

export function header(copy: Copy, current: Route, o: HeaderOptions): string {
  const L = (f: string) => copy.label('page', f);
  const N = (f: string) => copy.label('nav', f);
  const link = (r: Route) => `<a href="${href(r, o.base)}" data-route="${r}"${r === current ? ' aria-current="page"' : ''}>${esc(N(r))}</a>`;
  return `<header class="masthead"><div class="brand">${MARK.replace('<div class="mark" aria-hidden="true">', `<a class="mark brand-link" href="${href('board', o.base)}" data-route="board" tabindex="-1" aria-hidden="true">`).replace(/<\/div>$/, '</a>')}<div><h1><a class="brand-link" href="${href('board', o.base)}" data-route="board">${esc(L('title'))}</a></h1><p class="sub">${esc(L('subtitle'))}</p></div></div>` +
    `<nav class="nav">${link('philosophy')}${link('methodology')}${current === 'board' ? whenButton(copy, o.state, o.whenOpen) : ''}${themeButton(o.dark)}</nav></header>`;
}

export function footer(copy: Copy, base = '/'): string {
  const N = (f: string) => copy.label('nav', f);
  const link = (r: Route) => `<a href="${href(r, base)}" data-route="${r}">${esc(N(r))}</a>`;
  return `<footer class="foot"><nav class="foot-nav">${link('board')}${link('philosophy')}${link('methodology')}` +
    `<a href="${esc(N('repoUrl'))}" rel="noopener">${esc(N('repo'))}</a></nav><p>${esc(N('foot'))}</p></footer>`;
}

/** A text page: Philosophy from its markdown file (data/pages), Methodology from cards.json. A title, an optional lead
 * line and sections of paragraphs. */
export function page(copy: Copy, F: Figures, id: 'philosophy' | 'methodology', philosophyMd: string): string {
  const e = id === 'philosophy' ? (parsePage(philosophyMd) as unknown as Record<string, unknown>) : copy.get(`page:${id}`);
  if (!e) return '';
  const tk = pageTokens(F);
  const sections = (e.sections as { h: string; p: string[]; formula?: string; sources?: boolean }[]).map((sec) =>
    `<section>${sec.h ? `<h2>${esc(sec.h)}</h2>` : ''}${sec.p.map((x) => x.startsWith('- ')
      ? `<ul>${x.split('\n').map((l) => `<li>${fill(l.replace(/^- /, ''), tk, `page:${id}`)}</li>`).join('')}</ul>`
      : `<p>${fill(x, tk, `page:${id}`)}</p>`).join('')}` +
    (sec.formula ? `<pre class="formula">${esc(sec.formula)}</pre>` : '') +
    (sec.sources ? sourcesHtml(copy, F) : '') + `</section>`).join('');
  return `<article class="doc"><h1 class="doc-title">${esc(e.title as string)}</h1>${e.lead ? `<p class="lead">${esc(e.lead as string)}</p>` : ''}${sections}</article>`;
}

/** The board's body under the header: the past-view bar, baselines, industry pills and the company sections.
 * A filter or era with nothing in the chosen tab moves to the first tab that has cards (written back into `state`). */
export function boardBody(F: Figures, C: CardsFile, copy: Copy, state: BoardState): { html: string; errors: string[] } {
  const L = (f: string) => copy.label('page', f);
  let out = renderBoard(F, C, state);
  if (state.section !== 'all' && state.section !== 'every' && !out.counts[state.section]) {
    const first = SECTIONS.find((sec) => out.counts[sec]);
    if (first) { state.section = first; out = renderBoard(F, C, state); }
  }
  const pills = copy.get('pills');
  const html =
    // looking back: say so, with the way back to today
    (state.era !== 'now' ? `<div class="pastbar"><span>${esc(L('pastBanner'))} <b>${esc(F.eras[state.era].label)}</b>${esc(L('pastBannerTail'))}</span><button type="button" data-era="now">${esc(L('backToday'))}</button></div>` : '') +
    `<div id="board">${out.baselines}` +
    (pills
      ? `<div class="toggle pills" role="group" aria-label="Industry">${pill('cat', 'mag7', pills.mag7 as string, state.category === 'mag7')}${pill('cat', 'all', pills.all as string, state.category === 'all')}${CATEGORIES.map((c) => pill('cat', c, pills[c] as string, state.category === c)).join('')}</div>`
      : '') +
    `${out.companies}</div>`;
  return { html, errors: out.errors };
}

/** The page title in the browser tab. */
export const pageTitle = (copy: Copy, r: Route) => (r === 'board' ? copy.label('page', 'title') : `${copy.label('nav', r)} · ${copy.label('page', 'title')}`);

/** The app's mark: the sun half risen over the horizon, drawn straight onto the page. */
export const MARK = `<div class="mark" aria-hidden="true"><svg viewBox="3 21.5 46 29"><defs><linearGradient id="markSun" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF7A59"/><stop offset="1" stop-color="#FFB547"/></linearGradient></defs><path d="M10 38a16 16 0 0 1 32 0z" fill="url(#markSun)"/><rect x="4" y="41" width="44" height="3" rx="1.5" fill="currentColor"/><rect x="10" y="47" width="32" height="3" rx="1.5" fill="currentColor" opacity=".35"/></svg></div>`;
