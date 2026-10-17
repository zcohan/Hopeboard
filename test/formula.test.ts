import { describe, expect, it } from 'vitest';
import { annualReturn, annualReturnFromProfit, decadeChange, requiredGrowth, requiredProfit } from '../src/formula';

// Test cases: the design-stage tables (October 2026), kept here.
// [name, years of last year's profit, years of next year's forecast, cash returned, required % (last year), required % (forecast)]
const PRINCIPLES: [string, number, number, number, number, number][] = [
  ['Tesla', 346, 180, 0, 48, 39],
  ['Palantir', 160, 105, 0, 37, 31],
  ['Costco', 50, 47, 0.007, 21, 20],
  ['Apple', 36.5, 35, 0.025, 15, 15], // 35–38 in the table; midpoint
  ['Nvidia', 30, 26, 0.01, 15, 13],
  ['Microsoft', 29, 26, 0.015, 14, 12],
  ['Meta', 27, 22, 0.015, 13, 11],
  ['TSMC', 24, 21, 0.015, 12, 10],
  ['Amazon', 20, 24, 0, 11, 13],
  ['Oracle', 18, 18, 0.015, 8, 8],
  ['Alphabet', 17, 23, 0.017, 8, 11],
  ['Exxon', 20, 16, 0.05, 6, 4],
  ['S&P 500', 28, 23, 0.02, 13, 11],
  ['Cisco, March 2000', 150, 100, 0, 36, 31],
];
const NEW_CARDS: [string, number | null, number, number, number | null, number][] = [
  ['Broadcom', 46, 30, 0.025, 18, 13],
  ['AMD', 155, 55, 0.005, 36, 22],
  ['Intel', null, 60, 0, null, 24],
  ['ASML', 53, 30, 0.015, 21, 14],
  ['Micron', 12.5, 6, 0.005, 6, -2],
  ['Salesforce', 24, 14, 0.05, 8, 2],
  ['Adobe', 13, 9, 0.10, -3, -7],
  ['ServiceNow', null, 28, 0.01, null, 14],
  ['Shopify', 114, 81, 0, 32, 28],
  ['Netflix', 22.5, 20, 0.02, 10, 9],
  ['Uber', 15, 19, 0.03, 5, 7],
  ['Airbnb', 39, 30, 0.04, 14, 11],
  ['Cisco', 32, 20, 0.03, 13, 8],
  ['Dell', 30, 19, 0.02, 13, 8],
];

const pct = (x: number) => x * 100;

describe('required growth reproduces the spec tables within one percentage point', () => {
  for (const [name, pe, pef, y, req, reqf] of [...PRINCIPLES, ...NEW_CARDS]) {
    it(name, () => {
      if (pe !== null && req !== null) expect(Math.abs(pct(requiredGrowth(y, pe)) - req)).toBeLessThanOrEqual(1);
      expect(Math.abs(pct(requiredGrowth(y, pef)) - reqf)).toBeLessThanOrEqual(1);
    });
  }

  // Known exception, kept visible: the mockup says ~1% (forecast ~0%). At ~2.5% cash
  // returned the formula gives ~2.2% (forecast ~1.2%). It matches only with ~3.7% cash returned.
  it('Apple, May 2016 differs from the mockup by just over one point', () => {
    expect(pct(requiredGrowth(0.025, 11))).toBeCloseTo(2.2, 1);
  });
});

describe('required growth is the growth that returns exactly the index average', () => {
  it('round-trips', () => {
    for (const [, pe, , y] of PRINCIPLES) expect(annualReturn(requiredGrowth(y, pe), y, pe)).toBeCloseTo(0.10, 12);
  });
});

describe('consequence lines in the mockup', () => {
  const loss = (g: number, y: number, pe: number) => Math.round(-pct(decadeChange(annualReturn(g, y, pe))));
  it('Tesla at carmakers’ 10%: lose 87%', () => expect(loss(0.10, 0, 346)).toBe(87));
  it('Palantir at software’s 23%: lose 11%', () => expect(loss(0.23, 0, 160)).toBe(11));
  it('Nvidia with no growth: lose ~33%', () => expect(Math.abs(loss(0, 0.01, 30) - 33)).toBeLessThanOrEqual(1));
  it('Exxon with no growth makes ~4%/year', () => expect(pct(annualReturn(0, 0.05, 20))).toBeCloseTo(3.9, 1));
  it('Amazon at 10% makes ~3.5%/year more than the 5.3% bond', () =>
    expect(pct(annualReturn(0.10, 0, 20)) - 5.3).toBeCloseTo(3.55, 1));
});

describe('no-profit cards (dollars)', () => {
  it('Intel needs ~$70–95 billion a year by 2036 at a value of $470–650 billion', () => {
    expect(requiredProfit(470, 0)).toBeCloseTo(67.7, 0);
    expect(requiredProfit(650, 0)).toBeCloseTo(93.7, 0);
  });
  it('SpaceX at ≈86 years of $23 billion revenue needs ~$290 billion', () => {
    expect(Math.round(requiredProfit(86 * 23, 0) / 10) * 10).toBe(290);
  });
  it('inverts', () => {
    const v = 500, y = 0.02;
    expect(annualReturnFromProfit(requiredProfit(v, y), v, y)).toBeCloseTo(0.10, 12);
  });
});
