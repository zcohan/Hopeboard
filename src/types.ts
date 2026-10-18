// Shapes of data/figures.json (numbers and their sources) and data/cards.json (wording).

/**
 * A figure as written in figures.json: a number, or a string when the display
 * matters: "≈180" (approximate), "35–38" (sources give a range; the midpoint is
 * used for sums), "loss" (no profit to price). null means not found.
 */
export type Fig = number | string | null;

export type Era = 'now' | 'y1' | 'y5' | 'y10';
export const ERAS: Era[] = ['now', 'y1', 'y5', 'y10'];
export type PastEra = Exclude<Era, 'now'>;
export type Basis = 't' | 'f'; // last year's profit, next year's forecast
/** The time scale the board compares the deal against. */
export type Compare = 'w1' | 'm1' | 'm3' | 'm12';
export const COMPARES: Compare[] = ['w1', 'm1', 'm3', 'm12'];

export type Category = 'Chips' | 'Software' | 'Internet' | 'Hardware' | 'Health' | 'Consumer' | 'Financials' | 'Industry' | 'Telecoms' | 'Other';
/** The "Magnificent 7": the seven giant US tech companies, a filter of its own on top of the industries. */
export const MAG7 = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
export const CATEGORIES: Category[] = ['Chips', 'Software', 'Internet', 'Hardware', 'Health', 'Consumer', 'Financials', 'Industry', 'Telecoms', 'Other'];

export interface Source {
  name: string;
  url?: string;
  date?: string;
  /** Rough or reconstructed: shown as a soft claim in the footer. */
  rough?: boolean;
  note?: string;
}

export interface NowFigures {
  pe: Fig; // years of last year's profit
  pef: Fig; // years of next year's forecast profit
  y: number; // dividends per year as a share of the price (buybacks show up in profit-per-share growth)
  last?: number | null; // profit growth per year over the last decade
  /** Dollar cards (no profit to price): today's value in $ billions, one or two sources. */
  value?: number | [number, number];
  /** Dollar cards: named profit levels in $ billions, used by the wording ({p:best}). */
  profits?: Record<string, number>;
  /** Dollar cards priced on revenue (SpaceX). */
  yearsOfRevenue?: Fig;
  /** Analysts' expected profit growth next year (their fiscal year after this one). */
  forecast?: number | null;
  /** The stock's path and the business's size, for hand-written lines that quote them. */
  ytd?: number; // change since the end of last year
  fromHigh?: { below: number; month: string }; // below the year's highest close
  revenueGrowth?: number; // revenue, last twelve months against the twelve before
  capex?: number; // $ billions spent on buildings and equipment, last twelve months
  /** Cash and debt on the latest balance sheet ($ billions), and a year's profit (value ÷ years of profit) to count them in */
  balance?: { cash: number; debt: number; end: string; profit?: number };
  listing?: { low: number; high: number; month: string }; // a new listing's range against its first close
  /** Years of profit and dividends a week, a month, a quarter and a year ago, with the filings known then. */
  then?: Partial<Record<Compare, { pe: number; y: number }>>;
}

export interface PastFigures {
  pe: Fig;
  y?: number; // defaults to the company's current cash returned
  profit?: number; // profit growth since (one year: total; five or ten years: per year)
  stock?: number; // the stock's return since, same convention
  revenueGrowth?: number; // revenue then, against the year before
  maxFall?: number; // the biggest fall from a high between then and now
}

export interface Company {
  id: string; // ticker
  name: string;
  color: string;
  category: Category;
  industry?: string; // key into industries
  now: NowFigures;
  past: Partial<Record<PastEra, PastFigures>>;
  /** Which source each group of figures comes from (keys into Figures.sources). */
  src: { pe: string; y: string; last?: string; past?: string };
}

export interface EraFigures {
  label: string;
  bond: number;
  gold: Fig; // $ an ounce
  goldReturn?: number; // now: per year since 1971; past: since then
  oil?: number; // Brent, $ a barrel
  /** Damodaran's yearly returns since 1928, compounded: the S&P 500 with dividends, and the 10-year Treasury. */
  longRun?: { stocks: number; bonds: number; from: number; to: number };
  /** The year the bond was last this high, when it's the highest of the past year. */
  bondHighSince?: string | null;
  spx: { pe: Fig; pef?: Fig; y: number; last?: number; profit?: number; stock?: number };
}

export interface Figures {
  asOf: string;
  sources: Record<string, Source>;
  industries: Record<string, { label: string; growth: number }>;
  eras: Record<Era, EraFigures>;
  companies: Company[];
}

/** How a consequence line picks its growth rate. Only checkable anchors are allowed. */
export type Scenario =
  | { anchor: 'industry' }
  | { anchor: 'none' } // profit doesn't grow
  | { anchor: 'last' } // the company's own last decade
  | { anchor: 'average' } // the average big US company: the S&P 500's last-decade profit growth
  | { anchor: 'endsAt'; factor: number } // profit ends the decade at factor × today's
  | { anchor: 'profit'; key: string } // dollar cards: profit reaches a named level
  | { anchor: 'unanchored'; g: number }; // flagged: needs the owner's call

export interface CopyEntry {
  id: string;
  /** Flags for whoever writes the copy next (open items, soft spots). Never shown on the board. */
  notes?: string[];
  [field: string]: unknown;
}

export interface CardsFile {
  entries: CopyEntry[];
}
