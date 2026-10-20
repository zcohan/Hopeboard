import './style.css';
import figuresJson from '../data/figures.json';
import cardsJson from '../data/cards.json';
import logoSources from '../public/logos/sources.json';
import { Copy, renderBoard, SECTIONS, type BoardState } from './board';
import { fill } from './copy';
import type { Section } from './engine';
import { installPopovers } from './popover';
import { pageTokens } from './tokens';
import { parsePage } from './pages';
import philosophyMd from '../data/pages/philosophy.md?raw';
import { CATEGORIES, type Basis, type CardsFile, type Compare, type Era, type Figures } from './types';

const F = figuresJson as unknown as Figures;
let C = cardsJson as unknown as CardsFile;
const DEV = import.meta.env.DEV;

/** The industry pill last picked, remembered in this browser (Mag 7 when there's none, or storage is blocked). */
function savedCategory(): BoardState['category'] {
  try {
    const c = localStorage.getItem('category');
    if (c === 'mag7' || c === 'all' || (CATEGORIES as string[]).includes(c ?? '')) return c as BoardState['category'];
  } catch { /* no storage */ }
  return 'mag7';
}

const state: BoardState = {
  era: 'now',
  basis: 't',
  category: savedCategory(),
  section: 'every',
};

const app = document.getElementById('app')!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function pill(attr: string, value: string, label: string, on: boolean) {
  return label ? `<button type="button" class="${on ? 'on' : ''}" data-${attr}="${value}">${esc(label)}</button>` : '';
}

function sourcesHtml(copy: Copy): string {
  const e = copy.get('sources');
  if (!e) return '';
  const items = Object.values(F.sources).map((s) => {
    const name = s.url ? `<a href="${s.url}">${esc(s.name)}</a>` : esc(s.name);
    return `<li>${name}${s.date ? `, ${esc(s.date)}` : ''}${s.rough ? ` (${esc(e.rough as string)})` : ''}${s.note ? `. ${esc(s.note)}` : ''}</li>`;
  });
  items.push(`<li>Company logos: <a href="https://commons.wikimedia.org/">Wikimedia Commons</a> (public domain; the brands belong to their owners)</li>`);
  return `<div class="sources"><ul>${items.join('')}</ul></div>`;
}

/** Development only: cards whose wording failed to fill (a missing figure or an unknown placeholder). */
function devBar(errors: string[]): string {
  if (!DEV || !errors.length) return '';
  return `<div class="devbar"><span class="errs">${errors.length} card errors</span><span>${esc(errors.join(' · '))}</span></div>`;
}

// Three pages: the board, the philosophy and the methodology. Paths are served by
// public/_redirects on Cloudflare and by Vite's fallback in development.
type Route = 'board' | 'philosophy' | 'methodology';
const BASE = import.meta.env.BASE_URL;
function route(): Route {
  const p = location.pathname.slice(BASE.length - 1).replace(/\/+$/, '');
  return p === '/philosophy' ? 'philosophy' : p === '/methodology' ? 'methodology' : 'board';
}
const href = (r: Route) => (r === 'board' ? BASE : `${BASE}${r}`);

// The time and profit menu: a clock button in the header, open until a choice is made.
let whenOpen = false;
function whenButton(copy: Copy): string {
  const L = (f: string) => copy.label('page', f);
  const eras: [Era, string][] = [['now', 'eraNow'], ['y1', 'eraY1'], ['y5', 'eraY5'], ['y10', 'eraY10']];
  const item = (attr: string, value: string, label: string, on: boolean) =>
    `<button type="button" role="menuitemradio" aria-checked="${on}" class="${on ? 'on' : ''}" data-${attr}="${value}">${esc(label)}</button>`;
  // a dot on the clock says the board isn't showing today's prices against last year's profit
  const changed = state.era !== 'now' || state.basis !== 't';
  return `<div class="when"><button type="button" class="whenbtn${changed ? ' changed' : ''}" aria-haspopup="menu" aria-expanded="${whenOpen}" aria-label="${esc(L('whenButton'))}" title="${esc(L('whenButton'))}">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></button>` +
    `<div class="whenmenu" role="menu"${whenOpen ? '' : ' hidden'}><p class="mh">${esc(L('whenHeading'))}</p>${eras.map(([e, f]) => item('era', e, L(f), state.era === e)).join('')}` +
    (state.era === 'now' ? `<hr><p class="mh">${esc(L('basisHeading'))}</p>${item('basis', 't', L('basisT'), state.basis === 't')}${item('basis', 'f', L('basisF'), state.basis === 'f')}` : '') +
    `</div></div>`;
}

function header(copy: Copy, current: Route): string {
  const L = (f: string) => copy.label('page', f);
  const N = (f: string) => copy.label('nav', f);
  const link = (r: Route) => `<a href="${href(r)}" data-route="${r}"${r === current ? ' aria-current="page"' : ''}>${esc(N(r))}</a>`;
  return `<header class="masthead"><div class="brand">${MARK.replace('<div class="mark" aria-hidden="true">', `<a class="mark brand-link" href="${href('board')}" data-route="board" tabindex="-1" aria-hidden="true">`).replace(/<\/div>$/, '</a>')}<div><h1><a class="brand-link" href="${href('board')}" data-route="board">${esc(L('title'))}</a></h1><p class="sub">${esc(L('subtitle'))}</p></div></div>` +
    `<nav class="nav">${link('philosophy')}${link('methodology')}${current === 'board' ? whenButton(copy) : ''}${themeButton()}</nav></header>`;
}

function footer(copy: Copy): string {
  const N = (f: string) => copy.label('nav', f);
  const link = (r: Route) => `<a href="${href(r)}" data-route="${r}">${esc(N(r))}</a>`;
  return `<footer class="foot"><nav class="foot-nav">${link('board')}${link('philosophy')}${link('methodology')}` +
    `<a href="${esc(N('repoUrl'))}" rel="noopener">${esc(N('repo'))}</a></nav><p>${esc(N('foot'))}</p></footer>`;
}

/** A text page: Philosophy from its markdown file (data/pages), Methodology from cards.json. A title, an optional lead
 * line and sections of paragraphs. */
function page(copy: Copy, id: 'philosophy' | 'methodology'): string {
  const e = id === 'philosophy' ? (parsePage(philosophyMd) as unknown as Record<string, unknown>) : copy.get(`page:${id}`);
  if (!e) return '';
  const tk = pageTokens(F);
  const sections = (e.sections as { h: string; p: string[]; formula?: string; sources?: boolean }[]).map((sec) =>
    `<section>${sec.h ? `<h2>${esc(sec.h)}</h2>` : ''}${sec.p.map((x) => x.startsWith('- ')
      ? `<ul>${x.split('\n').map((l) => `<li>${fill(l.replace(/^- /, ''), tk, `page:${id}`)}</li>`).join('')}</ul>`
      : `<p>${fill(x, tk, `page:${id}`)}</p>`).join('')}` +
    (sec.formula ? `<pre class="formula">${esc(sec.formula)}</pre>` : '') +
    (sec.sources ? sourcesHtml(copy) : '') + `</section>`).join('');
  return `<article class="doc"><h1 class="doc-title">${esc(e.title as string)}</h1>${e.lead ? `<p class="lead">${esc(e.lead as string)}</p>` : ''}${sections}</article>`;
}

function render() {
  const copy = new Copy(C);
  const r = route();
  document.title = r === 'board' ? copy.label('page', 'title') : `${copy.label('nav', r)} · ${copy.label('page', 'title')}`;
  if (r !== 'board') {
    app.innerHTML = header(copy, r) + page(copy, r) + footer(copy);
    wireCommon();
    return;
  }
  const L = (f: string) => copy.label('page', f);
  let out = renderBoard(F, C, state);
  // a filter or era with nothing in the chosen tab moves to the first tab that has cards
  if (state.section !== 'all' && state.section !== 'every' && !out.counts[state.section]) {
    const first = SECTIONS.find((sec) => out.counts[sec]);
    if (first) { state.section = first; out = renderBoard(F, C, state); }
  }
  const { baselines, companies, errors } = out;
  for (const e of errors) console.error(e);
  const pills = copy.get('pills');
  app.innerHTML =
    devBar(errors) +
    header(copy, 'board') +
    // looking back: say so, with the way back to today
    (state.era !== 'now' ? `<div class="pastbar"><span>${esc(L('pastBanner'))} <b>${esc(F.eras[state.era].label)}</b>${esc(L('pastBannerTail'))}</span><button type="button" data-era="now">${esc(L('backToday'))}</button></div>` : '') +
    `<div id="board">${baselines}` +
    (pills
      ? `<div class="toggle pills" role="group" aria-label="Industry">${pill('cat', 'mag7', pills.mag7 as string, state.category === 'mag7')}${pill('cat', 'all', pills.all as string, state.category === 'all')}${CATEGORIES.map((c) => pill('cat', c, pills[c] as string, state.category === c)).join('')}</div>`
      : '') +

    `${companies}</div>` + footer(copy);

  app.querySelectorAll<HTMLButtonElement>('button[data-era]').forEach((b) => b.addEventListener('click', () => { state.era = b.dataset.era as Era; whenOpen = false; render(); }));
  app.querySelectorAll<HTMLButtonElement>('button[data-basis]').forEach((b) => b.addEventListener('click', () => { state.basis = b.dataset.basis as Basis; whenOpen = false; render(); }));
  app.querySelector<HTMLButtonElement>('.whenbtn')?.addEventListener('click', () => {
    whenOpen = !whenOpen;
    render();
    if (whenOpen) app.querySelector<HTMLButtonElement>('.whenmenu button.on')?.focus();
  });
  placeLogos();
  applyCompare();
  wireCommon();
  app.querySelectorAll<HTMLButtonElement>('button[data-sec]').forEach((b) => b.addEventListener('click', () => { state.section = b.dataset.sec as BoardState['section']; render(); }));
  app.querySelectorAll<HTMLButtonElement>('button[data-cat]').forEach((b) => b.addEventListener('click', () => {
    state.category = b.dataset.cat as BoardState['category'];
    try { localStorage.setItem('category', state.category); } catch { /* storage blocked: the choice lasts this visit */ }
    render();
  }));
}

/** The theme button and in-page links, on every page. */
function wireCommon() {
  app.querySelector<HTMLButtonElement>('.theme')?.addEventListener('click', () => { setTheme(theme() === 'dark' ? 'light' : 'dark', true); render(); });
  app.querySelectorAll<HTMLAnchorElement>('a[data-route]').forEach((a) => a.addEventListener('click', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    ev.preventDefault();
    if (a.getAttribute('href') !== location.pathname) history.pushState(null, '', a.getAttribute('href'));
    render();
    window.scrollTo(0, 0);
  }));
}
window.addEventListener('popstate', () => render());
/** Closes the time menu in place, without rebuilding the page, so the click that closed it still does its own job. */
function closeWhen() {
  whenOpen = false;
  const menu = app.querySelector<HTMLElement>('.whenmenu');
  if (menu) menu.hidden = true;
  app.querySelector<HTMLButtonElement>('.whenbtn')?.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', (ev) => { if (whenOpen && !(ev.target as HTMLElement).closest('.when')) closeWhen(); });
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && whenOpen) { closeWhen(); app.querySelector<HTMLButtonElement>('.whenbtn')?.focus(); return; }
  // arrow keys: across the section tabs (choosing as they go), and up and down the time menu
  const t = ev.target as HTMLElement;
  const step = (list: HTMLButtonElement[], back: boolean) => {
    const i = list.indexOf(t as HTMLButtonElement);
    if (i < 0) return null;
    ev.preventDefault();
    return list[(i + (back ? -1 : 1) + list.length) % list.length];
  };
  if (t.matches('[role="tab"]') && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) {
    const next = step([...app.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')], ev.key === 'ArrowLeft');
    if (next) { const sec = next.dataset.sec; next.click(); app.querySelector<HTMLButtonElement>(`[role="tab"][data-sec="${sec}"]`)?.focus(); }
  }
  if (t.closest('.whenmenu') && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) step([...app.querySelectorAll<HTMLButtonElement>('.whenmenu button')], ev.key === 'ArrowUp')?.focus();
});

/** The app's mark: the sun half risen over the horizon, drawn straight onto the page. */
const MARK = `<div class="mark" aria-hidden="true"><svg viewBox="3 21.5 46 29"><defs><linearGradient id="markSun" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF7A59"/><stop offset="1" stop-color="#FFB547"/></linearGradient></defs><path d="M10 38a16 16 0 0 1 32 0z" fill="url(#markSun)"/><rect x="4" y="41" width="44" height="3" rx="1.5" fill="currentColor"/><rect x="10" y="47" width="32" height="3" rx="1.5" fill="currentColor" opacity=".35"/></svg></div>`;

// Light or dark: the system's choice until the reader picks one, which is remembered on this device.
type Theme = 'light' | 'dark';
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
function theme(): Theme {
  return (document.documentElement.dataset.theme as Theme | undefined) ?? (systemDark() ? 'dark' : 'light');
}
function setTheme(t: Theme, remember: boolean) {
  document.documentElement.dataset.theme = t;
  if (remember) try { localStorage.setItem('theme', t); } catch { /* storage blocked: the choice lasts this visit */ }
}
function themeButton(): string {
  const dark = theme() === 'dark';
  const icon = dark
    ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
    : '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>';
  return `<button type="button" class="theme" aria-label="${dark ? 'Light mode' : 'Dark mode'}" title="${dark ? 'Light mode' : 'Dark mode'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></button>`;
}
try { const t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') setTheme(t, false); } catch { /* no storage */ }

// One image per logo, moved into each new render: a fresh <img> would reload and flash blank.
// All are loaded up front, so a tab or filter shown for the first time doesn't flash either.
const logoImages = new Map(Object.keys(logoSources).map((id) => {
  const img = new Image();
  img.alt = '';
  img.src = `${import.meta.env.BASE_URL}logos/${id}.svg`;
  return [id, img] as const;
}));
function placeLogos() {
  app.querySelectorAll<HTMLElement>('[data-logo]').forEach((slot) => {
    const img = logoImages.get(slot.dataset.logo!);
    if (img) slot.append(img);
  });
}

// Each card's "Compare over time" popover: the date picked lives here, by card, so a re-render keeps it.
// Picking a date shows the card as it was then; Today, where it starts, shows it as it is.
const compareOpen = new Map<string, Compare | 'now'>();
function applyCompare() {
  app.querySelectorAll<HTMLElement>('.tile[data-copy]').forEach((tile) => {
    const panel = tile.querySelector<HTMLElement>('.cmp');
    if (!panel) return;
    const w = compareOpen.get(tile.dataset.copy!) ?? 'now';
    tile.querySelectorAll<HTMLElement>('[data-at]').forEach((el) => { el.hidden = el.dataset.at !== w; });
    tile.classList.toggle('then', w !== 'now');
    panel.querySelectorAll<HTMLElement>('[data-w]').forEach((el) => {
      if (el.tagName === 'BUTTON') { el.classList.toggle('on', el.dataset.w === w); el.setAttribute('aria-pressed', String(el.dataset.w === w)); }
      else el.hidden = el.dataset.w !== w;
    });
  });
}
app.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement;
  const tile = t.closest<HTMLElement>('.tile[data-copy]');
  if (!tile) return;
  const b = t.closest<HTMLButtonElement>('.cmp button[data-w]');
  if (b) { compareOpen.set(tile.dataset.copy!, b.dataset.w as Compare | 'now'); applyCompare(); }
});

installPopovers();
render();

if (import.meta.hot) {
  import.meta.hot.accept(['../data/cards.json', '../data/figures.json'], ([cards, figures]) => {
    if (cards) C = cards.default as CardsFile;
    if (figures) Object.assign(F, figures.default);
    render();
  });
}
