# Hopeboard: principles and build notes

## What the Hopeboard is

The Hopeboard teaches one thing: a stock price is a bet on the next ten years, and the way to judge it is the profit growth the price needs, not the chart.

It is a grid of cards for ordinary people deciding where to park money for a decade. The cards cover big companies, plus three baselines: the safe US bond, gold and the S&P 500. Each card says what the business earns against the bond, what its price needs to be true, what analysts expect next year, and what you would make or lose if the price is wrong.

The reader has no finance training and reads a rising chart as "this stock is doing well". The app replaces that habit with a better one. The original mockup is `mockup/hopeboard.html`.

It is an educational tool, not investment advice, and it says so on the page.

## The core idea

A price already contains what people expect. Paying 35 years of last year's profit only works if profit grows a lot, or if the next buyer pays the same 35 years.

- **The unit is years of profit.** The card shows "priced at 35 years of last year's profit" (the P/E). The dollar share price is never shown, because it says nothing on its own.
- **What the business earns, against the bond.** One over the years of profit is what the business earns each year as a share of its price: Buffett's farm, in percent. Set next to the safe US bond, it shows how much growth has to make up the gap.
- **The test is required growth.** This is the profit growth per year, for ten years, that the price needs for the stock to return what the S&P 500 has averaged (10%/year since 1928).
- **Everything is measured against baselines.** The safe US bond pays a guaranteed return. Anything riskier has to promise more. Gold has no profit at all.
- **A chart multiplies two numbers and hides both.** A stock's rise is profit growth times the change in how many years of profit people pay. Never present the price line as the story.
- **The frame is parking money, not betting.** Safety is a property of the price, not a feeling about the company. A famous company at a high price can pay less than the safe US bond.

## How the numbers are computed

Every return on the board comes from one formula, and every figure is computed from data, never typed in.

```
r  = (1 + g) * (1 + y) * (18 / PE)^(1/10) - 1
g* = 1.10 / ((1 + y) * (18 / PE)^(1/10)) - 1
```

- `r` is the return per year over ten years.
- `g` is profit-per-share growth per year. `g*` is the required growth: the g that makes r equal the S&P 500's 10%.
- `y` is dividends paid to holders each year, as a share of the price. Buybacks are not added: they raise profit per share, which `g` already measures, so adding them would count them twice.
- `PE` is today's years of profit. `18` is the ordinary number of years people pay, assumed for 2036 (the long-run average).
- Loss or gain over the decade is `(1 + r)^10 - 1`. That is where "you're liable to lose 30% of your investment" comes from.
- Toggling to next year's forecast grows last year's profit at the analysts' forecast rate and recomputes `g*`.
- The "if" lines on each card use the same formula with an anchored scenario growth rate.

The test tables in `test/formula.test.ts` are the design-stage figures; the app must reproduce each required-growth figure within one point.

## The board and the cards

**Sections.** Baselines (US Bond, Gold, S&P 500) sit on top. Company cards sit under category pills and four tabs, sorted by required growth:

- **Pricey:** required growth of 14% or more.
- **Normal:** 10% to 14%.
- **Bargain:** under 10%.
- **Losing money:** lost money last year, so there is no profit to price.

**Views.** Buttons switch between Now, 1 year ago, 5 years ago and 10 years ago. Past views show the price then, what it needed, the story at the time and what happened since. For Now, a second toggle switches between last year's profit and next year's forecast.

**Card anatomy (company cards)**

1. Logo, name, a one-line description of the business, and a right-aligned stack: "priced at", the number of years, "of last year's profit".
   Under it, a badge: better, worse or the same deal than at the time picked by the switch above the cards (1 week, 1 month, 3 months, 1 year), with what the price needed then and needs now.
2. Labelled rows: EARNS (what the business earns as a share of its price, against the safe US bond, and dividends where they are 1% or more), REASONABLY PRICED (the growth the price needs, against the last decade), EXPECTED NEXT YEAR (the analysts' forecast), RISK (what happens if growth falls short; CUSHION when that is good news).
3. A link at the foot ("Why so pricey?", "What the price assumes", "Why so cheap?") opens two or three points on why the price is what it is.

`docs/writing-guide.md` has the wording rules for every part.

**Scenario anchors.** The "if" line tests the thing that card's price depends on, using a growth rate a reader can check: the company's own last decade, no growth, or the average big US company (11%/year). Never a round number with no anchor.

- Losses read "you're liable to lose X% of your investment", with the percentage in red (over the full decade).
- Gains and shortfalls read "you'd (still) make X%/year more/less than the safe US bond".

## Voice and wording

The cards read as if a real analyst wrote them, in words an ordinary reader already has. Use one term for one thing everywhere. The full word lists are in the writing guide.

| Use | Avoid |
| --- | --- |
| priced at 35 years of last year's profit | P/E, multiple, multiple expansion |
| profit (always per share) | earnings, EPS |
| the price needs profit to grow at X%/year | the ask, asks, implied growth |
| returns, make, lose | pays, yields (for the bond: "Returns 5.1%/year") |
| the safe US bond (US Bond as a card name) | the bond, risk-free rate |
| up from, down from, the same as | pts, percentage points |
| Pricey, Normal, Bargain, Losing money | Expensive, Cheap as section names |

- State the fact directly. Every word must do a job.
- No aphorisms, no "X, not Y" turns, no taglines, no lines that explain the concept.
- No `~` on figures; the footer says once that figures are rounded. `≈` marks rough estimates.

## Data and accuracy

Every figure needs a named source, and soft claims get flagged on the card or in the footer.

**Sources**

- Profit per share, share classes and investment gains: the companies' own filings (SEC EDGAR), read from the summary data or the filed reports.
- Prices, dividends, splits and the 10-year Treasury yield: EOD Historical Data.
- Analysts' forecasts: Alpha Vantage.
- The S&P 500's long-run return, and stocks against bonds since 1928: Damodaran's yearly returns table (NYU Stern).
- The S&P 500's profit, dividends and total return: Robert Shiller's monthly data.
- Oil (Brent): EOD.
- Logos: Wikimedia Commons (`public/logos/sources.json`).

A daily job (`npm run refresh`) downloads new data, recomputes the figures and keeps them only if every card's wording still holds.

**Soft claims to keep visible**

- Every required-growth figure assumes people pay an ordinary 18 years of profit by 2036. If the market keeps paying more, the numbers fall.
- "Liable to lose" is a scenario, not a forecast.
- The bullets and past-view stories are hand-written and go stale. A person re-reads them when the figures move.

## Design

The design is a plain card grid that a first-time reader can scan, with nothing on the page that does not teach.

- Three columns on desktop, two on tablets, one on phones. Cards are white on a near-white page.
- A header with the mark, the title and one subtitle: "Laying out the assumptions built into the current market price of popular investments." No explanatory paragraph.
- No share price anywhere. The number top right is always years of profit.
- Geist for everything.
- Red is used only for a loss.
- Light and dark modes, with a toggle; the layout holds on a phone.
- Keep it light. No sliders, dials or controls for choosing your own target return.

## Decisions made and rejected

| Decision | Why |
| --- | --- |
| Name it Hopeboard | The price carries hope about the next decade, and the board shows how much. |
| Show years of profit, never the share price | The dollar price is a meaningless number on its own. |
| Baselines at the top: US Bond, Gold, S&P 500 | These are the places people actually park money, and every other card is measured against them. |
| Sort by required growth, not years of profit | Dividends change what a given number of years needs. |
| Past-view buttons (1, 5, 10 years ago) | Seeing what was assumed then and what happened builds the intuition. |
| Toggle between last year's profit and next year's forecast | "Cheap at 20" quotes use the forecast, so both views should be one tap apart. |
| The company's own forecast, not an industry average | Industry averages were plain averages over hundreds of companies and rarely fit the one on the card. |
| Dividends only as cash returned | Buybacks already show up in profit-per-share growth. |
| A consequence line on every card | It turns a number into what you would make or lose. |

**Rejected**

- Share price on the card, and "each $100 you pay buys" (percentages against the bond read better).
- "Record" and "Hope" as labelled halves of a card, and the word "mood".
- "Margin of safety", "room for error" and other jargon, "pts" and "the ask".
- Dials for target return and the future years-of-profit figure.
- Any tagline or intro text at the top of the page.
- Selling the stock's price line or ten-year return as a headline number.
- A History section: the time buttons already show the past.

## Open items

- [ ] **Cheap stocks get a flattering assumption.** The board assumes people pay 18 years of profit in 2036. For a stock priced below 18 (Verizon at 12, AT&T at 8) that assumes it becomes more popular, which adds several points a year to its "if" line; those cards now say so in the Risk/Cushion row. Capping the 2036 figure at today's isn't clearly better: every stock below 18 would then need about 10% minus its dividend, so Micron at 12 and Alphabet at 17 would look the same. The owner's call.
- [ ] **The S&P 500's next-year forecast** is still a quoted figure (≈); its other figures come from Shiller's data.
- [ ] **TSMC and ASML** file full years only, so last year's profit is the last calendar year. **SpaceX** keeps rough figures until its first annual report.
- [ ] **Host the board** and move the daily refresh to a scheduled job there; check EOD's terms on republishing derived figures.
