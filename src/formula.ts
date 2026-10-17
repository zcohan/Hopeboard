// The board's one formula (docs/principles.md, "How the numbers are computed").
// Every return and required-growth figure on the board comes from here.

export const INDEX_RETURN = 0.10; // the S&P 500's long-run average, per year
export const NORMAL_YEARS = 18; // years of profit people ordinarily pay, assumed for 2036
export const AVERAGE_COMPANY_GROWTH = 0.11; // the average big US company's profit growth
export const DECADE = 10;

/** Yearly return over ten years, given profit growth g, cash returned y and years of profit pe. */
export function annualReturn(g: number, y: number, pe: number): number {
  return (1 + g) * (1 + y) * Math.pow(NORMAL_YEARS / pe, 1 / DECADE) - 1;
}

/** The profit growth per year that makes the return equal the index's average. */
export function requiredGrowth(y: number, pe: number, target = INDEX_RETURN): number {
  return (1 + target) / ((1 + y) * Math.pow(NORMAL_YEARS / pe, 1 / DECADE)) - 1;
}

/** Gain or loss over the whole decade for a yearly return r. */
export function decadeChange(r: number): number {
  return Math.pow(1 + r, DECADE) - 1;
}

// Companies with no profit to price (Intel, SpaceX): work in dollars instead.
// Today's value grows at the index's return, minus cash paid out, for ten years;
// in 2036 people pay an ordinary 18 years of profit for it.

/** Yearly profit needed in ten years for a company worth `value` today. Same units as value. */
export function requiredProfit(value: number, y: number, target = INDEX_RETURN): number {
  return (value * Math.pow((1 + target) / (1 + y), DECADE)) / NORMAL_YEARS;
}

/** Yearly return if profit in ten years reaches `profit`, for a company worth `value` today. */
export function annualReturnFromProfit(profit: number, value: number, y: number): number {
  return Math.pow((NORMAL_YEARS * profit) / value, 1 / DECADE) * (1 + y) - 1;
}
