# Hopeboard

A web app that teaches ordinary people how to read a stock price. Each card shows what the business earns against the safe US bond, the profit growth its price needs over ten years, what analysts expect next year, and what you would make or lose if the price is wrong. The frame is "where people park money for a decade". It is an educational tool, not investment advice.

If something is not in these files, ask the owner.

## Files, in reading order

1. `docs/philosophy.md`: how the board thinks about prices and about teaching. Read this before writing any copy.
2. `docs/background.md`: why the board exists, the ideas it teaches, and the taste rules.
3. `docs/principles.md`: the spec. The formula, the board and card anatomy, wording, data and sources, design, decisions made and rejected, open items.
4. `docs/writing-guide.md`: how card copy is written. Voice, what to emphasise, word lists, number rules, every card part with good and bad examples. Read it before writing any copy.
5. `README.md`: commands, data setup and code layout.
6. `mockup/hopeboard.html`: the original design mockup, kept for reference.

## How we work

The owner talks to you directly in this session. There is no other channel and nobody in between, so ask questions here and do not wait on anyone else.

- **Copy follows the writing guide.** The owner does not approve each phrase. The AI writes card copy to `docs/writing-guide.md`, and the owner reviews the guide. When a case isn't covered, write in its spirit, add a line to the entry's `notes`, and propose a guide addition. Keep all card copy in `data/cards.json`, separate from layout code. `npm test` checks the guide's word lists and the no-share-price rule.
- **Accuracy.** The owner holds a high standard. Every figure needs a named source and is computed from data, never typed in. Mark rough estimates with ≈; no ~ on rounded figures (the footer says once that figures are rounded). Flag soft claims on the card or in the footer.
- **Open items are the owner's calls.** Bring them up yourself, one at a time, in the order the build needs them.
- **Push back.** The owner has said they welcome it. If a suggestion would make a card less clear or less accurate, say so and give the reason.
- **Nothing personal in the repo.** It is public. No API keys (they live in `.env.local`), and nothing about the owner's own finances or plans.

## How to talk to the owner

- The owner is an experienced software developer, so technical talk about the build can be technical.
- Finance explanations must be plain words and concrete pictures, such as people and piles of money. Do not use formulas, statistical terms or jargon in conversation. If a source's wording is jargon, translate it.
- Keep the same vocabulary as the cards (see the language rules below), so the owner never has to translate between what you say and what the board says.
- Do not use AI-sounding phrases: aphorisms, "X, not Y" turns, taglines, filler that explains the concept.

## The formula

```
r  = (1 + g) * (1 + y) * (18 / PE)^(1/10) - 1
g* = 1.10 / ((1 + y) * (18 / PE)^(1/10)) - 1
```

- `g`: profit-per-share growth per year. `g*`: the required growth, the g that makes r equal the S&P 500's 10%/year.
- `y`: dividends paid to holders per year, as a share of the price. Buybacks are left out: they already show up in profit-per-share growth, so counting them here too would count them twice.
- `PE`: years of profit today. `18`: the ordinary number of years people pay, assumed for 2036.
- Loss or gain over the decade is `(1 + r)^10 - 1`.

The design-stage tables in `test/formula.test.ts` are test cases. The app should reproduce every required-growth figure within one percentage point.

## Language

Cards read as if a real analyst wrote them, in mainstream words. Use one term for one thing. The full lists are in the writing guide.

- Use: "priced at 35 years of last year's profit", "profit" (per share), "the price needs profit to grow at X%/year", "returns", "make", "lose", "the safe US bond", "up from / down from / the same as", Pricey / Normal / Bargain / Losing money.
- Avoid: P/E, multiple, EPS, "the ask", "pts" or "percentage points", "about", "the bond", margin of safety, room for error, mood, sentiment, Mr Market.
- No taglines, no aphorisms, no "X, not Y" turns, no lines that explain the concept. Every word must help the reader decide.
- Never show the dollar share price.
- Scenario growth rates must be anchored: the company's own last decade, no growth, or the average big US company (the S&P 500's last-decade profit growth, computed).
- Loss lines read "you're liable to lose X% of your investment", with the percentage in red.

## Data

Figures are computed from SEC filings, EOD prices and dividends, and Alpha Vantage forecasts (see `README.md`). A daily job refreshes them and keeps the new figures only if the tests still pass. Open questions about the data are in `docs/principles.md`, under Open items.
