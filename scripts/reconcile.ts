// Renders every card with the app's engine and compares it, line by line, with
// the mockup's own rendering. Prints only the lines that differ, so every number
// the formula changes is visible for the owner.
//
//   npx tsx scripts/reconcile.ts           (last year's profit)
//   npx tsx scripts/reconcile.ts f         (next year's forecast)
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { renderBoard } from '../src/board';
import type { Basis, CardsFile, Era, Figures } from '../src/types';
import { loadMockup } from './mockup-data';

const basis = (process.argv[2] as Basis) ?? 't';
const F: Figures = JSON.parse(readFileSync(new URL('../data/figures.json', import.meta.url), 'utf8'));
const C: CardsFile = JSON.parse(readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'));
const M = loadMockup();

// the mockup's functions close over its own tf; rebind by re-evaluating with the chosen basis
const mockTf = `function tf(a,b){return ${basis === 't' ? 'a' : 'b'};}`;

const text = (html: string) =>
  html.replace(/<h2>.*?<\/h2>/g, '').replace(/<span class="draft-tag">Draft<\/span>/g, '').replace(/<\/(p|h4|li|div|button)>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').split('\n').map((l) => l.trim()).filter(Boolean);

/** Section heading of each tile, by the order tiles appear under <h2>s. */
function sections(html: string, idOf: (part: string, i: number) => string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  for (const sec of html.split('<h2>').slice(1)) {
    const title = sec.slice(0, sec.indexOf('</h2>'));
    for (const part of sec.split('<div class="tile').slice(1)) out.set(idOf(part, i++), title);
  }
  return out;
}

/** Split rendered board HTML into tiles keyed by copy id. */
function tiles(html: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const part of html.split('<div class="tile').slice(1)) {
    const id = /data-copy="([^"]+)"/.exec(part)?.[1];
    if (id) out.set(id, text('<div class="tile' + part));
  }
  return out;
}

function mockTiles(era: Era) {
  const src = readFileSync(new URL('../mockup/hopeboard.html', import.meta.url), 'utf8');
  const script = src.slice(src.indexOf('<script>') + 8, src.indexOf("document.querySelectorAll('.toggle button[data-era]')"));
  const ctx: any = { document: { body: { dataset: { era } }, getElementById: () => ({}), querySelector: () => ({ style: {} }) } };
  const board: any = {};
  ctx.document.getElementById = (id: string) => (id === 'board' ? board : {});
  vm.runInNewContext(script.replace(/function tf\(a,b\)\{[^}]*\}/, mockTf) + '\nrender();', ctx);
  const out = new Map<string, string[]>();
  const ids = [`bond:${era}`, `gold:${era}`, `spx:${era}`];
  const parts = (board.innerHTML as string).split('<div class="tile').slice(1);
  const idOf = (part: string, i: number) => {
    if (i < 3) return ids[i];
    const t = />([A-Z0-9]+)<\/div><div class="name">([^<]+)</.exec(part)!;
    const hist = M.HIST.find((h: any) => h.n === t[2]);
    return hist ? `hist:${hist.t === 'CSCO' ? 'CSCO2000' : 'AAPL2016'}` : `${t[1]}:${era}`;
  };
  parts.forEach((part, i) => out.set(idOf(part, i), text('<div class="tile' + part)));
  return { tiles: out, sections: sections(board.innerHTML, idOf) };
}

let diffs = 0;
for (const era of ['now', 'y1', 'y5', 'y10'] as Era[]) {
  const html = renderBoard(F, C, { era, basis, category: 'all', section: 'all' }).board;
  const app = tiles(html);
  const appSections = sections(html, (part) => /data-copy="([^"]+)"/.exec(part)![1]);
  const { tiles: mock, sections: mockSections } = mockTiles(era);
  for (const [id, sec] of mockSections) {
    const got = appSections.get(id);
    if (got && got !== sec) { console.log(`\n${id}: section ${sec} → ${got}`); diffs++; }
  }
  for (const [id, want] of mock) {
    const got = app.get(id);
    if (!got) { console.log(`\n${id}: missing from the app`); diffs++; continue; }
    const lines: string[] = [];
    for (let i = 0; i < Math.max(want.length, got.length); i++)
      if (want[i] !== got[i]) lines.push(`  mockup: ${want[i] ?? '(none)'}\n  app:    ${got[i] ?? '(none)'}`);
    if (lines.length) { console.log(`\n${id}`); console.log(lines.join('\n')); diffs += lines.length; }
  }
}
console.log(`\n${diffs} differing lines (basis: ${basis === 't' ? 'last year’s profit' : 'next year’s forecast'})`);
