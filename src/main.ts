import './style.css';
import figuresJson from '../data/figures.json';
import cardsJson from '../data/cards.json';
import logoSources from '../public/logos/sources.json';
import { Copy, renderBoard, SECTIONS, type BoardState } from './board';
import { fill } from './copy';
import type { Section } from './engine';
import { installPopovers } from './popover';
import { CATEGORIES, type Basis, type CardsFile, type Compare, type Era, type Figures } from './types';

const F = figuresJson as unknown as Figures;
let C = cardsJson as unknown as CardsFile;
const DEV = import.meta.env.DEV;

const state: BoardState = {
  era: 'now',
  basis: 't',
  category: 'all',
  section: 'pricey',
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

function header(copy: Copy, current: Route): string {
  const L = (f: string) => copy.label('page', f);
  const N = (f: string) => copy.label('nav', f);
  const link = (r: Route) => `<a href="${href(r)}" data-route="${r}"${r === current ? ' aria-current="page"' : ''}>${esc(N(r))}</a>`;
  return `<header class="masthead"><a class="brand" href="${href('board')}" data-route="board">${MARK}<div><h1>${esc(L('title'))}</h1><p class="sub">${esc(L('subtitle'))}</p></div></a>` +
    `<nav class="nav">${link('philosophy')}${link('methodology')}${themeButton()}</nav></header>`;
}

function footer(copy: Copy): string {
  const N = (f: string) => copy.label('nav', f);
  const link = (r: Route) => `<a href="${href(r)}" data-route="${r}">${esc(N(r))}</a>`;
  return `<footer class="foot"><nav class="foot-nav">${link('board')}${link('philosophy')}${link('methodology')}` +
    `<a href="${esc(N('repoUrl'))}" rel="noopener">${esc(N('repo'))}</a></nav><p>${esc(N('foot'))}</p></footer>`;
}

/** A text page from cards.json: a title, a lead line and sections of paragraphs. */
function page(copy: Copy, id: 'philosophy' | 'methodology'): string {
  const e = copy.get(`page:${id}`);
  if (!e) return '';
  const tk = { index: () => '10%', normalYears: () => '18' };
  const sections = (e.sections as { h: string; p: string[]; formula?: string; sources?: boolean }[]).map((sec) =>
    `<section><h2>${esc(sec.h)}</h2>${sec.p.map((x) => `<p>${fill(x, tk, `page:${id}`)}</p>`).join('')}` +
    (sec.formula ? `<pre class="formula">${esc(sec.formula)}</pre>` : '') +
    (sec.sources ? sourcesHtml(copy) : '') + `</section>`).join('');
  return `<article class="doc"><h1 class="doc-title">${esc(e.title as string)}</h1><p class="lead">${esc(e.lead as string)}</p>${sections}</article>`;
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
  if (state.section !== 'all' && !out.counts[state.section]) {
    const first = SECTIONS.find((sec) => out.counts[sec]);
    if (first) { state.section = first; out = renderBoard(F, C, state); }
  }
  const { baselines, companies, errors } = out;
  for (const e of errors) console.error(e);
  const eras: [Era, string][] = [['now', 'eraNow'], ['y1', 'eraY1'], ['y5', 'eraY5'], ['y10', 'eraY10']];
  const pills = copy.get('pills');
  app.innerHTML =
    devBar(errors) +
    header(copy, 'board') +
    `<div class="toggles">` +
    `<div class="toggle" role="group" aria-label="When">${eras.map(([e, f]) => pill('era', e, L(f), state.era === e)).join('')}</div>` +
    (state.era === 'now'
      ? `<div class="toggle basis" role="group" aria-label="Which profit to count">${pill('basis', 't', L('basisT'), state.basis === 't')}${pill('basis', 'f', L('basisF'), state.basis === 'f')}</div>`
      : '') +
    `</div>` +
    `<div id="board">${baselines}` +
    (pills
      ? `<div class="toggle pills" role="group" aria-label="Industry">${pill('cat', 'all', pills.all as string, state.category === 'all')}${CATEGORIES.map((c) => pill('cat', c, pills[c] as string, state.category === c)).join('')}</div>`
      : '') +

    `${companies}</div>` + footer(copy);

  app.querySelectorAll<HTMLButtonElement>('button[data-era]').forEach((b) => b.addEventListener('click', () => { state.era = b.dataset.era as Era; render(); }));
  app.querySelectorAll<HTMLButtonElement>('button[data-basis]').forEach((b) => b.addEventListener('click', () => { state.basis = b.dataset.basis as Basis; render(); }));
  placeLogos();
  applyCompare();
  wireCommon();
  app.querySelectorAll<HTMLButtonElement>('button[data-sec]').forEach((b) => b.addEventListener('click', () => { state.section = b.dataset.sec as Section; render(); }));
  app.querySelectorAll<HTMLButtonElement>('button[data-cat]').forEach((b) => b.addEventListener('click', () => { state.category = b.dataset.cat as BoardState['category']; render(); }));
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

/** The app's mark: a sun rising over the horizon. */
const MARK = `<div class="mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M9 21a7 7 0 0 1 14 0"/><path d="M5 25h22"/><path d="M16 8v3M8.2 11.2l2.1 2.1M23.8 11.2l-2.1 2.1"/></svg></div>`;

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

// Each card's "Compare over time" panel. Its state lives here, by card, so a re-render keeps it.
const compareOpen = new Map<string, Compare>();
function applyCompare() {
  app.querySelectorAll<HTMLElement>('.tile[data-copy]').forEach((tile) => {
    const panel = tile.querySelector<HTMLElement>('.cmp');
    const link = tile.querySelector<HTMLButtonElement>('.cmplink');
    if (!panel || !link) return;
    const w = compareOpen.get(tile.dataset.copy!);
    panel.hidden = !w;
    link.setAttribute('aria-expanded', String(!!w));
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
  const id = tile.dataset.copy!;
  if (t.closest('.cmplink')) {
    // opening starts on a year, the longest view; clicking the link again closes it
    if (compareOpen.has(id)) compareOpen.delete(id); else compareOpen.set(id, 'm12');
    applyCompare();
  } else {
    const b = t.closest<HTMLButtonElement>('.cmp button[data-w]');
    if (b) { compareOpen.set(id, b.dataset.w as Compare); applyCompare(); }
  }
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
