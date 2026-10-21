// After `vite build`: writes each page out as finished HTML, so search engines, link previews and AI tools that don't
// run JavaScript see the board (the app still draws itself on top in the browser). Also writes a markdown copy of each
// page and an llms.txt index for AI tools, and the tags link previews read.
import { readFileSync, writeFileSync } from 'node:fs';
import { Copy, renderBoard, SECTIONS, type BoardState } from '../src/board';
import { boardBody, esc, footer, header, page, pageTitle, ROUTES, type Route } from '../src/render';
import { fill } from '../src/copy';
import { pageTokens } from '../src/tokens';
import { parsePage } from '../src/pages';
import type { CardsFile, Figures } from '../src/types';

const SITE = 'https://hopeboard.app';
const F: Figures = JSON.parse(readFileSync('data/figures.json', 'utf8'));
const C: CardsFile = JSON.parse(readFileSync('data/cards.json', 'utf8'));
const philosophyMd = readFileSync('data/pages/philosophy.md', 'utf8');
const copy = new Copy(C);
// the empty page Vite built, kept aside so running this again starts from it, not from a page already filled in
const built = readFileSync('dist/index.html', 'utf8');
if (built.includes('<main id="app"></main>')) writeFileSync('dist/.shell.html', built);
const shell = readFileSync('dist/.shell.html', 'utf8');

// every company, so a reader that doesn't run the app sees the whole board (the app then shows the reader's own filter)
const state: BoardState = { era: 'now', basis: 't', category: 'all', section: 'every', todayOnly: true };
const path = (r: Route) => (r === 'board' ? '/' : `/${r}`);
const mdPath = (r: Route) => (r === 'board' ? '/index.md' : `/${r}.md`);
const DESCRIPTION: Record<Route, string> = {
  board: `${copy.label('page', 'subtitle')} An educational tool, not investment advice.`,
  philosophy: 'How Hopeboard thinks about investing: inflation, index funds, and what a stock price assumes about future growth.',
  methodology: 'The formula, data sources and rules behind every figure on Hopeboard.',
};

function appHtml(r: Route): string {
  const opts = { base: '/', state, whenOpen: false, dark: false };
  const body = r === 'board' ? boardBody(F, C, copy, { ...state }).html : page(copy, F, r, philosophyMd);
  // for tools reading the page without running it: where the whole page is as plain text (the app redraws this part)
  const textVersion = `<p class="text-version">This page as plain text, for AI tools: <a href="${mdPath(r)}">${SITE}${mdPath(r)}</a>. Every page is listed at <a href="/llms.txt">${SITE}/llms.txt</a>.</p>`;
  // logos as plain images, so the page looks right before the app takes over
  return (textVersion + header(copy, r, opts) + body + footer(copy)).replace(/<div class="logo img" data-logo="([^"]+)"><\/div>/g, '<div class="logo img" data-logo="$1"><img alt="" src="/logos/$1.svg"></div>');
}

function headTags(r: Route): string {
  const title = pageTitle(copy, r), url = `${SITE}${path(r)}`, d = esc(DESCRIPTION[r]);
  return [
    `<meta name="description" content="${d}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" type="text/markdown" href="${mdPath(r)}" title="${esc(title)} (markdown)">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Hopeboard">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Hopeboard: ${esc(copy.label('page', 'subtitle'))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join('\n');
}

for (const r of ROUTES) {
  // replacements as functions, so a "$" in the copy is never read as a replacement pattern
  const html = shell
    .replace(/<title>[^<]*<\/title>/, () => `<title>${esc(pageTitle(copy, r))}</title>\n${headTags(r)}`)
    .replace('<main id="app"></main>', () => `<main id="app">${appHtml(r)}</main>`);
  writeFileSync(r === 'board' ? 'dist/index.html' : `dist/${r}.html`, html);
}

// ---------- markdown ----------

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
/** Card and page HTML as markdown text: bold stays bold, every other tag goes. */
const text = (html: string) => decode(html.replace(/<\/?b[^>]*>/g, '**').replace(/<[^>]+>/g, '')).replace(/\*\*\s*\*\*/g, '').replace(/[ \t]+/g, ' ').trim();

function tileMd(tile: string): string {
  const name = text(tile.match(/<a class="namelink"[^>]*>(.*?)<\/a>/)?.[1] ?? tile.match(/<div class="name">(.*?)<small|<div class="name">(.*?)<\/div>/)?.slice(1).find(Boolean) ?? '');
  const about = text(tile.match(/<small>(.*?)<\/small>/)?.[1] ?? '');
  const out = [`### ${name}${about ? ` (${about})` : ''}`, ''];
  // today's version only: the first price and facts that aren't another date's
  const price = tile.match(/<div class="price"(?! data-at="(?!now)")[^>]*>(.*?)<\/div>/)?.[1];
  if (price) out.push(`Priced at ${text(price.replace(/^.*?<span class="n">/, '<span class="n">').replace(/<\/span><span/g, '</span> <span'))}.`, '');
  const facts = tile.match(/<dl class="facts"(?! data-at="(?!now)")[^>]*>([\s\S]*?)<\/dl>/)?.[1] ?? '';
  for (const m of facts.matchAll(/<dt>(.*?)<\/dt><dd>([\s\S]*?)<\/dd>/g))
    // a headline and its notes as sentences: each part ends with a full stop
    out.push(`- **${text(m[1])}**: ${m[2].split(/<\/span><span class="note">/).map(text).filter(Boolean).map((t) => (/[.!?]$/.test(t) ? t : `${t}.`)).join(' ')}`);
  for (const m of tile.matchAll(/<p class="(?:makes|miss)[^"]*">([\s\S]*?)<\/p>/g)) out.push(`- ${text(m[1])}`);
  // the bubbles: why this price, and finances
  const links = [...tile.matchAll(/popovertarget="([^"]+)">([^<]+)</g)].map((m) => ({ id: m[1], label: decode(m[2]) }));
  for (const { id, label } of links) {
    const pop = tile.match(new RegExp(`<div class="why[^"]*" popover id="${id}">([\\s\\S]*?)</div>(?=<div class="why|</div>$|$)`))?.[1] ?? '';
    if (/class="seg"/.test(pop)) { const ch = pop.match(/<p class="cheapest">(.*?)<\/p>/)?.[1]; if (ch) out.push(`- ${text(ch)}`); continue; }
    const bullets = [...pop.matchAll(/<li>(.*?)<\/li>/g)].map((m) => `  - ${text(m[1])}`);
    const finance = [...pop.matchAll(/<h4>(.*?)<\/h4><p class="story">(.*?)<\/p>/g)].map((m) => `  - ${text(m[1])}: ${text(m[2])}`);
    if (bullets.length || finance.length) out.push(`- ${label}`, ...bullets, ...finance);
  }
  return out.join('\n');
}

const tiles = (html: string) => html.split(/(?=<div class="tile)/).slice(1);
const S = (k: string) => copy.label('sections', k);
const board = renderBoard(F, C, state);
const boardMd = [
  `# Hopeboard`, '', `> ${copy.label('page', 'subtitle')}`, '',
  `An educational tool: it isn't investment advice. Figures are rounded and computed from company filings, prices and analysts' forecasts; see the [Methodology](${SITE}/methodology.md). Prices from ${F.asOf}.`, '',
  `## ${S('baselines')}`, '', ...tiles(board.baselines).map(tileMd).flatMap((t) => [t, '']),
  ...SECTIONS.flatMap((sec) => {
    const r = renderBoard(F, C, { ...state, section: sec });
    const ts = tiles(r.companies);
    return ts.length ? [`## ${S(sec)}`, '', ...ts.map(tileMd).flatMap((t) => [t, ''])] : [];
  }),
  // companies in no section (a private company with no profit figure published): only under All
  ...(() => {
    const inSections = SECTIONS.map((sec) => renderBoard(F, C, { ...state, section: sec }).companies).join('');
    const rest = tiles(renderBoard(F, C, { ...state, section: 'every' }).companies).filter((t) => !inSections.includes(t.match(/data-copy="[^"]+"/)![0]));
    return rest.length ? [`## ${S('unranked')}`, '', ...rest.map(tileMd).flatMap((t) => [t, ''])] : [];
  })(),
].join('\n');

function pageMd(id: 'philosophy' | 'methodology'): string {
  const e = id === 'philosophy' ? (parsePage(philosophyMd) as unknown as Record<string, unknown>) : copy.get(`page:${id}`)!;
  const tk = pageTokens(F);
  const parts = [`# ${e.title as string}`, ''];
  for (const sec of e.sections as { h: string; p: string[]; formula?: string; sources?: boolean }[]) {
    if (sec.h) parts.push(`## ${sec.h}`, '');
    for (const p of sec.p) parts.push(p.startsWith('- ') ? p.split('\n').map((l) => `- ${text(fill(l.replace(/^- /, ''), tk, id))}`).join('\n') : text(fill(p, tk, id)), '');
    if (sec.formula) parts.push('```', sec.formula, '```', '');
    if (sec.sources) parts.push(...Object.values(F.sources).map((s) => `- ${s.url ? `[${s.name}](${s.url})` : s.name}${s.date ? `, ${s.date}` : ''}`), '');
  }
  return parts.join('\n');
}

writeFileSync('dist/index.md', boardMd.replace(/\n{3,}/g, '\n\n'));
writeFileSync('dist/philosophy.md', pageMd('philosophy'));
writeFileSync('dist/methodology.md', pageMd('methodology'));
writeFileSync('dist/llms.txt', [
  '# Hopeboard', '', `> ${copy.label('page', 'subtitle')}`, '',
  'Hopeboard shows, for about 60 well-known US companies plus inflation, the safe US bond and the S&P 500, how many years of profit each stock price pays for, the profit growth a year the price assumes over the next ten years, and what an investor would make or lose if growth falls short. Every figure is computed from SEC filings, daily prices and analysts\' forecasts. It is an educational tool, not investment advice.', '',
  '## Pages', '',
  `- [The board](${SITE}/index.md): every company's figures today, grouped by how much growth its price assumes`,
  `- [Philosophy](${SITE}/philosophy.md): how the board thinks about investing and stock prices`,
  `- [Methodology](${SITE}/methodology.md): the formula, data sources and rules behind every figure`, '',
].join('\n'));
// for search engines: every page, when the figures last changed, and where the list is
const day = new Date().toISOString().slice(0, 10);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROUTES.map((r) =>
  `  <url><loc>${SITE}${path(r)}</loc><lastmod>${day}</lastmod><changefreq>${r === 'board' ? 'daily' : 'weekly'}</changefreq></url>`).join('\n')}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log('prerendered: /, /philosophy, /methodology, their markdown, llms.txt, sitemap.xml and robots.txt');
