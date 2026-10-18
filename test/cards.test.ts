import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderBoard } from '../src/board';
import { nowModel } from '../src/engine';
import { compare } from '../src/tokens';
import { requiredGrowth } from '../src/formula';
import { CATEGORIES, ERAS, type CardsFile, type Figures } from '../src/types';

const F: Figures = JSON.parse(readFileSync('data/figures.json', 'utf8'));
const C: CardsFile = JSON.parse(readFileSync('data/cards.json', 'utf8'));
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

describe('every card renders in every view', () => {
  for (const era of ERAS)
    for (const basis of ['t', 'f'] as const)
      it(`${era}, ${basis === 't' ? 'last year’s profit' : 'next year’s forecast'}`, () => {
        expect(renderBoard(F, C, { era, basis, category: 'all', section: 'all' }).errors).toEqual([]);
      });

  it('every category filter shows only its companies', () => {
    for (const cat of CATEGORIES) {
      const { board } = renderBoard(F, C, { era: 'now', basis: 't', category: cat, section: 'all' });
      for (const co of F.companies) expect(board.includes(`data-copy="${co.id}:now"`)).toBe(co.category === cat);
    }
  });
});

describe('wording stays true to the numbers', () => {
  const all = ERAS.flatMap((era) => (['t', 'f'] as const).map((basis) => text(renderBoard(F, C, { era, basis, category: 'all', section: 'all' }).board)));

  it('“still” only where the result beats the comparison', () => {
    for (const t of all) expect(t).not.toMatch(/still make [^.]*less than/);
  });

  it('each Compare over time badge quotes the growth its date’s card shows', () => {
    const { board } = renderBoard(F, C, { era: 'now', basis: 't', category: 'all', section: 'all' });
    const bad: string[] = [];
    for (const t of board.split('<div class="tile').slice(1)) {
      const id = /data-copy="([^"]+)"/.exec(t)![1];
      for (const m of t.matchAll(/<div class="deal \w+" data-w="(\w+)">[^<]*?(?:needed|needs) ([−\d]+%)/g)) {
        const card = new RegExp(`<dl class="facts" data-at="${m[1]}"[\\s\\S]*?</dl>`).exec(t)?.[0] ?? '';
        const shown = /([+−]?\d+%)<\/b> growth\/year/.exec(card)?.[1]?.replace('+', '');
        if (shown !== m[2]) bad.push(`${id} ${m[1]}: badge ${m[2]}, card ${shown}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('the S&P 500’s “only grows at” holds: its last decade is below what its price needs', () => {
    const spx = F.eras.now.spx;
    const req = requiredGrowth(spx.y, Number(String(spx.pe).replace(/^≈/, '')));
    expect(Math.round(spx.last! * 100)).toBeLessThan(Math.round(req * 100));
  });

  it('no decade record that rounds to nothing', () => {
    for (const t of all) expect(t).not.toMatch(/last decade it (shrank|grew) 0%\/year|the 0%\/year of the last decade/);
  });

  it('“barely changed” only where the last decade rounds to 0%', () => {
    for (const e of C.entries.filter((e) => /barely changed/.test(String(e.assumes ?? ''))))
      expect(Math.abs(F.companies.find((c) => `${c.id}:now` === e.id)!.now.last ?? 1)).toBeLessThan(0.005);
  });

});

describe('hand-written lines', () => {
  // Bullets and stories are written by hand, so any figure in them must come from a placeholder.
  // Years are fine, and so are names that contain a number. A dollar amount for a named event
  // (Tesla's pay package) is a fact of the story, listed here once it's checked.
  const NAMES = /Model 3|2-nanometre|5G|\$1 trillion/g;
  it('quote no typed figures', () => {
    const hits = C.entries.flatMap((e) =>
      (['bullets', 'story', 'happened'] as const).flatMap((k) => ([] as string[]).concat((e[k] as string | string[] | undefined) ?? []))
        .filter((t) => /\d/.test(t.replace(/\{[^}]+\}/g, '').replace(/\b(19|20)\d\d\b/g, '').replace(NAMES, '')))
        .map((t) => `${e.id}: ${t}`));
    expect(hits).toEqual([]);
  });
});

describe('cards file', () => {
  it('ids are unique', () => {
    const ids = C.entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// docs/writing-guide.md, sections 6 and 11. Checked on the rendered cards (not the footer, which defines terms once).
describe('writing guide', () => {
  const NEVER = [
    /\bP\/E\b/, /\bmultiples?\b/i, /\bEPS\b/, /\bthe ask\b/i, /\bpts\b/i, /\bpoints\b/i, /\bpercentage points\b/i,
    /\babout\b(?! to\b)/i, /\bthe bond\b/i, /margin of safety/i, /room for error/i, /\bmood\b/i, /\bsentiment\b/i, /Mr Market/i,
    /\bmoat\b/i, /headwind|tailwind/i, /\bcatalyst\b/i, /\bupside\b|\bdownside\b/i, /\bbullish\b|\bbearish\b/i,
    /\bearnings\b/i, /\btrailing\b/i, /\b(up|down) from\b/i, /\bmight\b|\barguably\b/i, /\bgrows (?!at |to )[~\d]/, /\b(margins?|backlog|capex|hyperscalers?|guidance|valuation|priced in|tailwinds?|headwinds?|secular)\b/i,
  ];
  // A dollar figure that isn't a company-wide amount (bn, million, billion, trillion) or an oil price is a share price.
  const SHARE_PRICE = /\$\d[\d,.]*(?:–\d+)?(?![\d,.–]|\s*(bn|million|billion|trillion)|s\b)/;
  const cards = ERAS.flatMap((era) => (['t', 'f'] as const).flatMap((basis) => {
    const { board } = renderBoard(F, C, { era, basis, category: 'all', section: 'all' });
    // Card wording only: drop the top-right years figure and split on block ends.
    return board.split('<div class="tile').slice(1).map((t) => ({
      id: /data-copy="([^"]+)"/.exec(t)![1],
      text: text(t.replace(/<div class="price">.*?<\/div>/, '').replace(/<\/(p|li|h4|button)>/g, '\n')),
    }));
  }));

  it('prints no broken figures', () => {
    const hits = cards.filter((c) => /NaN|undefined|Infinity|\{[a-zA-Z:]+\}/.test(c.text)).map((c) => c.id);
    expect(hits).toEqual([]);
  });

  it('uses none of the never-use words', () => {
    const hits = cards.flatMap((c) => NEVER.filter((re) => re.test(c.text)).map((re) => `${c.id}: ${re}`));
    expect(hits).toEqual([]);
  });

  it('shows no dollar share price', () => {
    const hits = cards.flatMap((c) =>
      c.text.split(/(?<=[.!?])\s|\n/).filter((s) => SHARE_PRICE.test(s) && !/\boil\b/i.test(s)).map((s) => `${c.id}: ${s}`));
    expect(hits).toEqual([]);
  });

  it('has two or three bullets per bubble', () => {
    const bad = C.entries.filter((e) => Array.isArray(e.bullets) && (e.bullets.length < 2 || e.bullets.length > 3)).map((e) => e.id);
    expect(bad).toEqual([]);
  });
});
