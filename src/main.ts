import './style.css';
import figuresJson from '../data/figures.json';
import cardsJson from '../data/cards.json';
import logoSources from '../public/logos/sources.json';
import { Copy, type BoardState } from './board';
import { installPopovers } from './popover';
import { boardBody, footer, header, page, pageTitle, type Route } from './render';
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

/** Development only: cards whose wording failed to fill (a missing figure or an unknown placeholder). */
function devBar(errors: string[]): string {
  if (!DEV || !errors.length) return '';
  return `<div class="devbar"><span class="errs">${errors.length} card errors</span><span>${esc(errors.join(' · '))}</span></div>`;
}

// Three pages: the board, the philosophy and the methodology. The build writes each one out as a finished page
// (scripts/prerender.ts); here the app draws them, and moves between them without reloading.
const BASE = import.meta.env.BASE_URL;
function route(): Route {
  const p = location.pathname.slice(BASE.length - 1).replace(/\/+$/, '');
  return p === '/philosophy' ? 'philosophy' : p === '/methodology' ? 'methodology' : 'board';
}

// The time and profit menu: open until a choice is made.
let whenOpen = false;
const headerOf = (copy: Copy, r: Route) => header(copy, r, { base: BASE, state, whenOpen, dark: theme() === 'dark' });

function render() {
  const copy = new Copy(C);
  const r = route();
  document.title = pageTitle(copy, r);
  if (r !== 'board') {
    app.innerHTML = headerOf(copy, r) + page(copy, F, r, philosophyMd) + footer(copy, BASE);
    wireCommon();
    return;
  }
  const { html, errors } = boardBody(F, C, copy, state);
  for (const e of errors) console.error(e);
  app.innerHTML = devBar(errors) + headerOf(copy, 'board') + html + footer(copy, BASE);

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
// the page stays hidden (index.html) until this first drawing has its styles and font, then shows at once
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 500))]).then(() => document.documentElement.classList.remove('drawing'));

if (import.meta.hot) {
  import.meta.hot.accept(['../data/cards.json', '../data/figures.json'], ([cards, figures]) => {
    if (cards) C = cards.default as CardsFile;
    if (figures) Object.assign(F, figures.default);
    render();
  });
}
