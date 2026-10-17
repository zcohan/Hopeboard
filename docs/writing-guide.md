# Writing guide: how the Hopeboard talks

This guide is for whoever writes card copy, usually an AI agent. The owner reviews this guide, not each phrase. If the guide is followed, the copy is right. If a case comes up that the guide doesn't cover, write it in the spirit of the guide, add a line to the entry's `notes`, and propose an addition to this guide in the same change.

Read `philosophy.md` first. It holds the thinking. This guide turns that thinking into sentences.

Contents:

1. The reader
2. What every card does
3. What to emphasise, in order
4. What not to emphasise
5. Voice
6. Words
7. Numbers
8. The card, part by part
9. Past views
10. Baselines and History
11. Constructions that are banned
12. Worked examples
13. Rewrites
14. Flags and soft claims
15. Checklist

---

## 1. The reader

The reader is an ordinary adult deciding where to park money for a decade. They have no finance training. They know what a share is, what a savings rate is, and what "the market went up" means. They read a rising stock chart as "this company is doing well".

They are not stupid and they don't want to be taught. They want to know whether a spot is a sensible place to leave money. Write for someone smart who is short of time and has never needed these words.

After reading a card, the reader should be able to say, in their own words:

- what the price needs to happen,
- whether the business has ever done that,
- and roughly what they'd make or lose if it doesn't.

If a sentence doesn't help with one of those three, cut it.

## 2. What every card does

Every company card connects three numbers:

| | Where it shows | Example (Costco) |
| --- | --- | --- |
| What the price needs | The opening line, `{req}` | ~21%/year |
| What the business has done | The opening line (`{last}`) and the forecast line | ~14%/year over the last decade |
| What you'd make or lose | The consequence line, `{outcome}` | ~1.5%/year less than the safe US bond |

The bubble behind the link ("Why so pricey?") says why people pay what they pay: the beliefs the price rests on.

A card is a short argument with no conclusion. It lays out the need, the record and the consequence, and stops. The reader draws the conclusion. Never write "so it's overpriced", "avoid", "a buy", "worth a look".

## 3. What to emphasise, in order

When there is room for only one point, take the first one on this list that applies.

### 3.1 The gap between what the price needs and what the business has done

This is the board's central fact. Lead with it whenever the gap is large in either direction.

- Costco needs ~21%/year and has done ~14%. The card is about that gap.
- Alphabet needs ~8%/year and has done ~23%. The card is about that gap the other way.
- Apple needs ~15% and has done ~15%. The card is about there being no gap, and no room for a stumble.

### 3.2 What the reader would make or lose, in money

Turn every gap into a consequence. "Needs more growth than it has shown" is abstract. "You'd make ~1.5%/year less than the safe US bond" is a decision.

The safe US bond is the reference because it is the price of taking no risk. A stock that returns less than the bond has paid the reader to take risk for nothing.

### 3.2a Put big numbers in perspective

A profit of "$290 billion a year" means nothing on its own. Next to "Apple earns ~$130 billion" it means the price needs SpaceX to become more than twice the most profitable company most people can name. The owner singled this out as the board's clearest kind of line. The skill is the perspective, not Apple: pick whatever comparison makes this card's number land.

- A dollar profit the price needs: compare with a profit the reader can place. Another company's (SpaceX against Apple), the company's own best year (Intel against its best years), or its revenue today.
- A long stretch of years: compare with a span the reader knows. A price of 160 years of profit is longer than the US has had a stock market.
- A growth rate: compare with what the company has done ("up from the ~14% it grew at over the last decade").
- One comparison per number, and only where the bare number would be abstract. Every compared figure is a placeholder from the data, never typed.
- Don't repeat the same comparison across cards. If two cards would both reach for Apple, find another for one of them.

### 3.3 The one thing the price depends on

Each price rests on something specific. Find it and test it. This is what makes the consequence line different on every card.

| Company | What the price depends on | So the test is |
| --- | --- | --- |
| Costco | Repeating a record it has never beaten | Its own record repeating |
| Nvidia | This year's boom profit being the new normal | Profit that doesn't grow from here |
| Exxon | Cash handed back while you wait | No growth at all, with the cash counted |
| Palantir, Tesla | Growth far above anything on record | The average big US company |
| Microsoft, Meta, TSMC, Amazon, Alphabet | Staying above an average company | The average big US company (~11%) |

### 3.4 How long a good thing lasts

Markets are good at facts and weaker on duration. When a price is low because people doubt something will last (Alphabet and AI answers, Apple in 2016 and "peak iPhone"), say what the doubt is in plain terms. When a price is high because people assume it will last forever (Costco, Apple now), say what "forever" requires.

### 3.5 Cash paid while you wait

Dividends are part of the return; buybacks work through profit per share (each share owns more of the profit). Don't present buybacks as cash returned. Where they are large (Exxon ~5%, Adobe, Salesforce), say so, because they are why the required growth is low. Where the figure is rough, say "(rough figure)".

### 3.6 What changed the years people pay

In past views, the gap between profit growth and the stock's return is the change in how many years of profit people paid. Name it with the numbers: "people went from paying 11 years to 38". This is how the board shows that a chart is two numbers multiplied together.

## 4. What not to emphasise

- **The chart and the stock's past return as a headline.** A past return appears only in past views and History, and always next to profit growth, so the reader sees which part was the business and which part was people paying more.
- **Product excitement.** "The new chip is incredible" is not a reason. "Every AI chip still gets made here" is: it explains why people pay.
- **News flow.** A week's headlines go stale. Write the belief underneath ("The market isn't sure search survives the AI answer box"), not the event ("Google unveiled X on Tuesday").
- **The dollar share price.** Never. It means nothing on its own. Company-wide dollar amounts (profit, revenue, spending, value) are fine: "$175bn a year on AI data centres".
- **Our opinion of the company.** "A great business" or "a fading brand" is opinion. Say what the price assumes and what the record shows.
- **Who said it.** No "analysts warn", "critics say", "bulls argue". If a belief is in the price, state it as what the price assumes.

## 5. Voice

Explain the price the way Charlie Munger or Mohnish Pabrai would explain an investment to a ten-year-old: what you pay, what the business earns, and what has to happen for the deal to work. Simple enough for a child, and every step backed by a reason and a number. The owner holds this up as the board's model.

The cards read like a sharp analyst writing for a friend who doesn't work in finance.

- **State facts.** "Palantir has been profitable since 2023." Not "Palantir has only recently become profitable, which is worth bearing in mind."
- **Statements, not questions.** The only questions on the board are the bubble links.
- **No hedging on the card.** No "may", "might", "could potentially", "it's possible that", "arguably". The numbers are already scenarios; the footer says so. Uncertainty about a figure goes in a flag (section 14), not in hedged prose.
- **No disclaimers on the card.** The not-advice line lives in the footer, once.
- **Precise.** "Data-centre sales were up 57% last quarter" beats "data-centre sales are booming".
- **Short.** One idea per sentence. Most sentences under 20 words. Bullets under 12.
- **Concrete.** People, piles of money, years. "People pay 35 years of last year's profit" is a picture. "A 35× multiple" is not.
- **Spelling.** British, as the board already uses: centre, favourite, sceptical.
- **No exclamation marks, no italics for emphasis, no capitals for emphasis.** Bold is used only where the templates put it: the required growth and the consequence figure.

## 6. Words

Use one word for one thing, everywhere. If the reader learns a word on one card, it must mean the same on every other.

| Use | Never use |
| --- | --- |
| priced at 35 years of last year's profit | P/E, multiple, valuation, multiple expansion, rerating |
| next year's forecast | forward P/E, forward earnings, consensus |
| profit (always per share) | earnings, EPS, net income, bottom line |
| the price needs profit to grow ~X%/year | the ask, asks, implied growth, priced in, baked in |
| profit grows at ~X%/year | profit grows ~X%/year (drops the "at") |
| returns, make, lose | pays, yields, total shareholder return |
| the safe US bond (US Bond as the card name) | the bond, Treasuries, risk-free rate |
| up from, down from, the same as | pts, points, percentage points, bps |
| ~ | about, around, roughly (for a figure) |
| dividends and buybacks; cash returned | capital return, shareholder yield, payout |
| Pricey, Normal, Bargain | Expensive, Cheap, Overvalued, Undervalued (as labels) |
| the average big US company | the market average, the median company |
| the index | the market, SPX (in prose) |

Never use: mood, sentiment, Mr Market, margin of safety, room for error, moat, priced for perfection (as a stock phrase), headwinds, tailwinds, catalyst, upside, downside, bullish, bearish, compounder, story stock, multiple compression.

"Record" and "hope" are the board's internal words. The page name uses "hope". On cards, write what they stand for: "what the business has done" and "the years of profit people pay".

### Translating a source

Sources use jargon. Translate before it reaches a card.

| Source says | Card says |
| --- | --- |
| trades at 46x trailing earnings | priced at ≈46 years of last year's profit |
| forward P/E of 30 | ≈30 years of next year's forecast |
| EPS fell 18% YoY | profit fell ~18% last year |
| guidance implies 21% EPS growth | next year's profit is guided to rise ~21% |
| margin compression from input costs | higher memory costs squeeze its margins |
| capex of $220bn | $220bn a year of building |
| FCF yield 5% | (only if needed) ~5% a year in dividends and buybacks |
| multiple contracted from 38x to 29x | people went from paying 38 years of profit to 29 |
| trading below its trailing figure | next year's profit is expected to be higher than last year's |

## 7. Numbers

### 7.1 Never type a computed number

Required growth, returns, gains, losses and gaps to the bond are computed by the app. In `data/cards.json`, write a placeholder:

- Write `{opening} profit grows at **{req}/year**.`, never `…grows at ~21%/year.`
- Write `{outcome}`, never `you'd make ~1.5%/year less than the safe US bond`.

Placeholders are listed in `README.md`. If you need a number that has no placeholder, add the figure to `data/figures.json` with a source and add a placeholder. Don't type it.

Facts that are inputs, not results, may be typed in bullets and stories when they are sourced: "Data-centre sales were up 57% last quarter", "Micron lost money as recently as 2023". Record the source in `notes` if it isn't already in `figures.json`.

### 7.2 Marks

- No `~` on figures (the owner found it visually dirty, October 2026). Every figure is rounded, and the footer says once that figures are rounded and approximate.
- `≈` before an estimated years-of-profit figure (set in `figures.json`, shown by the app).
- No mark on a scenario growth rate that is an anchor. Write "If profit only grows at 11%/year (the average big US company)". The anchor is a definition, not an estimate.
- A range where sources disagree: "$70–95 billion", "20–42% of your investment". Say why in `notes`.

### 7.3 Units

- Growth and returns per year: "~15%/year". Write "/year" every time, so the reader never has to guess whether a figure is yearly or total.
- Losses over the whole decade: "you're liable to lose 34% of your investment". This is the one total figure.
- One-year past views: "Profit grew ~30%. The stock returned ~39%." (no "/year", because it is one year).
- Years of profit: "35 years", never "35x".
- Dollars: "$175bn" in bullets, "~$21 billion" in sentences. Never a share price.

### 7.4 Rounding

The app rounds: required growth to whole percent, gaps to the nearest half percent, the bond to one decimal. Don't write prose that depends on a finer figure ("just over 14%").

### 7.5 Scenario growth rates must be anchored

The consequence line's growth rate must be one a reader can check. Four anchors are allowed:

| Anchor | `scenario` | Reads |
| --- | --- | --- |
| The company's own last decade | `{"anchor":"last"}` | If the last decade's 14%/year growth repeats |
| No growth | `{"anchor":"none"}` | If profit doesn't grow |
| The average big US company | `{"anchor":"average"}` | If profit only grows at 11%/year (the average big US company) |

Never pick a round number because it sounds reasonable ("if growth drops to 8%"). If none of the four anchors tests what the price depends on, flag it in `notes` and propose an anchor to the owner. Until then, use the nearest allowed anchor.

How to choose:

- No decade of profit to repeat, and growth needed above the average → test the average big US company (Tesla, Palantir, AMD).
- The price needs more than the company has ever done → test its own record (Costco).
- The record ends on a boom → test no growth (Nvidia, Micron).
- Cash returned is most of the return → test no growth, and say the cash carries it (Exxon).
- Otherwise test the average big US company (Microsoft, Meta, Dell, Cisco).

## 8. The card, part by part

### 8.0 The description (`about`)

One line under the company's name saying what the business does, in words the owner's mum would understand: products people know, not industry terms. "Facebook & Instagram", "Makes Apple's & Nvidia's chips", "Holiday home rentals". Never "infrastructure software", "semiconductors" or "platform". Check claims: "makes all computer chips" is not true of TSMC; "makes Apple's & Nvidia's chips" is.

### 8.1 The top right

Set by the app from `figures.json`: "priced at / 35–38 years / of last year's profit". Nothing to write.

### 8.2 The opening line (`assumes`)

What the price needs, tied to what the business has done.

Frames:

| Case | Template |
| --- | --- |
| Usual | `{opening} profit grows at **{req}/year** {vsLast}.` |
| No decade of profit | `{opening} profit grows at **{req}/year**. Palantir has been profitable since 2023.` |
| Needs exactly its record | `{opening} profit keeps growing at the same rate as over the last decade ({last}/year).` |
| Needs shrinking profit | `Reasonably priced even if profit shrinks **{req:abs}/year**.` |
| No profit at all | `Reasonably priced only if you assume Intel earns **{reqProfit}** a year by 2036.` |

`{opening}` writes "Reasonably priced only if you assume" for Pricey cards and "Reasonably priced if you assume" otherwise. `{cmp}` writes "up from", "down from" or "the same as".

A short qualifier after the record is allowed when it changes how to read it:

- "— down from the ~70%/year of the last decade, ending on a boom year." (Nvidia)
- "— down from the ~40%/year of the last decade, from almost nothing." (Amazon)
- "— down from the ~14%/year of the last decade, from a bad year for oil." (Exxon)

If there is no decade of profit, state the fact plainly and stop. Good: "Tesla became reliably profitable in 2020, and profit per share has fallen since 2022." Bad: "Tesla's profit record is too short to judge." That sentence comments on the record instead of stating it.

For a no-profit card, give the scale with two anchors the reader knows: last year's result, and the company's best year or a famous comparison.

> Reasonably priced only if you assume Intel earns **~$70–95 billion** a year by 2036. Intel lost ~$11 billion last year. Its best years were ~$21 billion.

> Reasonably priced only if you assume profit grows to **~$290 billion** a year by 2036. SpaceX lost ~$9 billion on $23 billion of revenue last year. Apple earns ~$130 billion.

### 8.3 The farm line and the forecast line (shared, `company-lines`)

Every company card carries two lines written once for all cards, in the `company-lines` entry. Don't write them per card.

Company cards show three labelled sections (labels in `company-lines.labels`), each a headline figure with small notes under it:

| Label | Headline | Notes |
| --- | --- | --- |
| EARNS | **0.7%** of its price a year | 4.5% less than the safe US bond; dividends, when 1% or more |
| PRICED FOR GROWTH | **+35%**/year | Up from the 15%/year of the last decade; Analysts expect 107% profit growth next year |
| RISK, or CUSHION when the outcome is good news | If profit only grows at 13%/year (the average big US company), you're liable to lose 55% of your investment. | |

`assumes` holds the headline, a newline, then its note: `**{reqSigned}**/year\n{vsLastNote}.` The forecast note is added by the app.

Each row holds one number. Background (when it became profitable, what fell since when) goes in the bubble; only a comparison that makes the requirement readable stays in the row ("— up from the ~15%/year of the last decade", "Apple earns ~$130 billion"). On a card that lost money there is no farm line, and the opening line leads.

**The farm line** says what the business earns each year as a share of its price, against the safe US bond. It is Buffett's farm: a farm that costs $1,000 and earns $70 a year earns 7% of its price.

> **~0.6%** of its price a year (~4.5% less than the safe US bond)
> **~8.3%** of its price a year, ~6.3% of it paid to you as dividends (~3% more than the safe US bond)

- Percentages only, against the bond. Never "each $100 buys" (the owner prefers percentages to dollar amounts).
- The dividend clause appears only when dividends are 1% or more.
- Left off cards that lost money: there's nothing earned to compare.

**The forecast line** is the analysts' average forecast for the company's next fiscal year against this one:

> ~40% profit growth

- One year, and it says so. The reader sets it against the ten-year requirement in the opening line; don't compare them in words.
- It replaced the industry line (October 2026): industry averages were plain averages over hundreds of companies, set in January, and rarely fit the one company on the card.

### 8.4 The consequence line (`consequence`)

One sentence: the scenario, then `{outcome}`.

Forms the app writes for `{outcome}`:

- Loss over the decade: "you're liable to lose **34% of your investment**" (red).
- Better than the bond: "you'd still make **~2%/year more** than the safe US bond".
- Worse than the bond: "you'd make **~1.5%/year less** than the safe US bond".
- Give only the gap to the yardstick: "you'd make **~2.5%/year less** than the safe US bond". Don't add the return itself (`{outcome:r}`); the owner found "you'd make ~2.5%/year, ~2.5%/year less…" harder to read.
- `{outcome:index}` compares with the index: "you'd still make **~2.5%/year more** than the index's ~10% average". Use it when the bond comparison would be trivially good and the index is the real test (a Bargain card).

Write the scenario so it names the anchor in plain words:

| Good | Why |
| --- | --- |
| If profit only grows at 10%/year (the average for carmakers), {outcome}. | Names the anchor. "only" because 10% is below what the price needs. |
| If the last decade's 14%/year growth repeats, {outcome}. | The record repeating is the test. |
| If profit doesn't grow from this year's level, {outcome}. | Says "this year's level" because the level itself is the doubt. |

| Bad | Why |
| --- | --- |
| If growth drops to only 8%/year, … | 8% has no anchor. |
| In a downside scenario, … | Jargon, and doesn't say what happens. |
| If things go wrong, you could lose money. | No number, hedged, says nothing. |
| …you'd make ~5.8%/year. | A return with no comparison means nothing to the reader. Always compare with the bond or the index. |

"only" goes in when the scenario growth is below what the price needs. "still" is written by the app when the result beats the comparison. Never write "still" yourself.

### 8.5 The bubble (`bullets`, opened by the link)

The link under each card opens a bubble. The link text is the section's heading, from `comment-headings`:

| Section | Link |
| --- | --- |
| Pricey | Why so pricey? |
| Normal | What the price assumes |
| Bargain | Why so cheap? |

The bubble holds two or three bullets. Each bullet is one belief the price rests on, or one fact that explains why people pay what they pay.

Rules:

- Two or three bullets. Never one, never four.
- Under 12 words each where possible.
- Sentence case, no full stop.
- Each bullet must be something that could turn out false. "Nvidia makes chips" can't. "Nobody else makes the chip" can.
- Prefer profit terms: what has to keep growing, holding or paying.
- Under "What the price assumes", each bullet completes the thought: "Ads keep growing 20%+ a year", "Ads pay for the AI spend".
- One bullet may give a number that shows the scale: "$220bn a year of building keeps paying".
- A rough figure says so: "Large buybacks do part of the work (rough figure)".

Good bullets, with why:

| Bullet | Card | Why it works |
| --- | --- | --- |
| Priced as if this year's boom profit is the new normal | Nvidia | Names the belief the whole price rests on. |
| Data-centre spending never pauses | Nvidia | A belief that could fail, in plain words. |
| Every AI chip still gets made here | TSMC | Concrete; the reader can picture it failing. |
| Discount for the Taiwan Strait | TSMC | Explains why the price is lower than the record suggests. |
| The market isn't sure search survives the AI answer box | Alphabet | The doubt that makes it cheap, said plainly. |
| OpenAI has to pay its bills in full | Oracle | Specific, checkable, and the hinge of the price. |
| You get paid now: ~5% a year in dividends and buybacks | Exxon | Explains the low requirement in money. |
| Nothing paid out until the building stops | Amazon | Tells the reader why there's no cash return. |

Bad bullets, with fixes:

| Bad | Problem | Better |
| --- | --- | --- |
| Strong competitive moat | Jargon, and can't fail as written | Nobody else makes the chip |
| Investors are bullish on AI | Sentiment, not a belief about profit | Data-centre spending never pauses |
| Great management | Opinion | A slice of the price is trust in Zuckerberg's bets |
| The stock is up 160% this year | A price move, not a reason | The price assumes the chip-factory business wins outside customers |
| Valuation looks stretched | Jargon, and restates the section | (cut it: the section already says Pricey) |
| Risks include competition, regulation and macro | A list of nouns that says nothing | Name the one that matters: The 2-nanometre lead holds |

A price move can appear as a fact in a bullet only when it explains the current price: "The price halved in a year". Then the next bullet must say why.

## 9. Past views

Past cards show what a price needed then, what people were saying, and what happened. Their job is to show that the same reading worked or failed in hindsight.

### 9.1 The story then (`story`)

One line in the market's own words at the time. Short phrases joined with semicolons are fine. Quotes from the time are good ("Peak iPhone.", "a pet rock.").

| Good | Why |
| --- | --- |
| "Peak iPhone." Sales had just fallen 8%; Icahn had sold; Buffett had quietly started buying. | What people were actually saying, with facts from the time. |
| A gaming-chip company; AI a research sideline. | How the company was seen, in eight words. |
| Recovering from a 2020 loss; kicked out of the Dow the year before; ESG money leaving. | Why nobody wanted it. |

| Bad | Problem |
| --- | --- |
| Before its huge AI run, Nvidia was undervalued. | Hindsight. The story must be what people believed then. |
| Sentiment was negative. | Jargon and vague. |

### 9.2 What happened since (`happened`)

Profit first, then the stock, then the link between them. Use placeholders for the figures (`{profit}`, `{stock}`, `{pe}`, `{peNow}`, `{req}`).

> Profit grew {profit}/year — exactly what was required. The stock returned {stock}/year because people went from paying {pe:bare} years of profit to {peNow:bare}.

> Profit grew {profit}. The stock returned {stock} — profit grew faster than the price, so the years of profit people pay fell from {pe:bare} to {peNow:bare}.

Say which part was the business and which was people paying more or less. That is the lesson of the past views. Don't stop at "the stock returned ~28%/year".

The current past-view wording uses "hope rose from 29 to 50" in several places. Section 6 makes "hope" an internal word, so new wording uses "people went from paying 29 years of profit to 50". See the open list at the end of this guide.

## 10. Baselines and History

The baselines are where people already park money. Write them with the same parts as company cards where they apply: what the price assumes, what it has done, what you'd make or lose.

- **US Bond.** It returns {bond}/year for ten years, guaranteed. It is the floor every other card is measured against. Don't describe it as boring or safe in an emotional way. Its safety is a fact: nothing can go wrong with it.
- **Gold.** No profit, so no required growth. Say that the price is reasonable only if someone pays more later. Give the record (~8%/year since 1971) together with its long flat stretches.
- **S&P 500.** It is the average of everyone's story at the average return. Same parts as a company card, compared with its own ~10% average.

History cards (Cisco in March 2000, Apple in May 2016) use the past frame, plus one line on what was delivered and what the stock did as a result. They are the board's proof. Keep them stark:

> It managed {delivered}/year — good, and not enough. The stock lost {stockDecade:abs} over the decade.

## 11. Constructions that are banned

These read as machine-written, and the owner has rejected every one of them.

### 11.1 "X, not Y"

| Bad | Better |
| --- | --- |
| Priced for reliability, not growth | Priced for profit that rises every year without a stumble |
| Three years of growth from almost nothing is a start, not a record | Palantir has been profitable since 2023. |
| The belief shrank, not the business | Profit grew ~10%. The price halved. |

Also banned: "It's not about X, it's about Y", "Less X, more Y", "X rather than Y" used as a flourish. "AI helps it rather than hurts it" is acceptable because it states the bet with both outcomes. When in doubt, say only the positive half.

### 11.2 Aphorisms and taglines

| Bad | Problem |
| --- | --- |
| Growth that is expected is already paid for. | True, and it's the board's whole idea, so the card shouldn't say it. The numbers show it. |
| The doubt is the discount. | Neat-sounding. Cut it, or replace it with the doubt itself. |
| Excellence is assumed, not a bonus. | Aphorism and "X, not Y". Say what has to happen: Has to become one of the biggest software companies on earth. |
| Time in the market beats timing the market. | Tagline. Never. |

### 11.3 Explaining the concept

The board explains itself through its numbers. Never write a line that explains how the board works on a card.

| Bad |
| --- |
| Remember: a high price means high expectations. |
| This shows why the years of profit matter. |
| The required growth is the growth needed to match the index. |

The footer defines terms once. The cards never do.

### 11.4 Also banned

- Rhetorical questions in body text ("Can it last?").
- Hedges: may, might, could, arguably, potentially, somewhat, fairly.
- Intensifiers: very, extremely, incredibly, massive, huge (use the number instead).
- Filler: "It's worth noting", "Importantly", "In other words", "Simply put", "At the end of the day".
- Second person outside the consequence line. "You" appears in the consequence ("you'd make", "you're liable to lose") and nowhere else.
- Advice: buy, sell, avoid, opportunity, worth a look, steer clear.

## 12. Worked examples

Each example shows the template in `data/cards.json`, then how the card reads, then why it was written that way.

### 12.1 Costco: needs more than it has ever done

```json
"assumes": "{opening} profit grows at **{req}/year** {vsLast}.",
"industry": "Analysts expect general retailers to grow profit {industry}/year.",
"consequence": "If the last decade's {g}/year growth repeats, {outcome}.",
"scenario": { "anchor": "last" },
"bullets": ["Priced as a company that can't fail", "…", "…"]
```

Reads:

> Reasonably priced only if you assume profit grows at **~21%/year** — up from the ~14%/year of the last decade.
> Analysts expect general retailers to grow profit ~12%/year.
> If the last decade's 14%/year growth repeats, you'd make **~1.5%/year less** than the safe US bond.

Why: the hinge is that Costco's price needs more than its own best decade. So the test is its own record, and the result is worse than the bond. The reader sees that a famous, steady company can be a poor place to park money at this price.

### 12.2 Nvidia: the record ends on a boom

> Reasonably priced only if you assume profit grows at **~15%/year** — down from the ~70%/year of the last decade, ending on a boom year.
> Analysts expect chip companies to grow profit ~23%/year.
> If profit doesn't grow from this year's level, you're liable to lose **34% of your investment**.

Why: ~15%/year looks easy next to ~70%. But the ~70% ends on a boom year, so the question is whether this year's profit is the new floor. "Doesn't grow from this year's level" tests exactly that. Testing at the industry's 23% would make the card look safe, and that reading would be wrong.

### 12.3 Exxon: the cash carries it

> Reasonably priced if you assume profit grows at **~6%/year** — down from the ~14%/year of the last decade, from a bad year for oil.
> Analysts expect oil majors to grow profit ~4%/year.
> If profit doesn't grow, you'd make ~4%/year, nearly all from dividends and buybacks — **~1.5%/year less** than the safe US bond.

Why: the requirement is low because ~5% a year comes back as cash. The consequence says where the ~4% comes from. The industry line shows, without comment, that the price needs more than the industry is expected to grow.

### 12.4 Palantir: no decade of profit

> Reasonably priced only if you assume profit grows at **~37%/year**. Palantir has been profitable since 2023.
> Analysts expect software companies to grow profit ~23%/year.
> If profit only grows at 23%/year (the average for software), you're liable to lose **11% of your investment**.

Why: there is no record to compare with, so state the fact and stop. The industry is the test, and growing as fast as the average software company still loses money.

### 12.5 Alphabet: priced for doubt

> Reasonably priced if you assume profit grows at **~8%/year** — down from the ~23%/year of the last decade.
> Analysts expect internet companies to grow profit ~21%/year.
> If profit only grows at 11%/year (the average big US company), you'd still make **~3.5%/year more** than the index's ~10% average.

Bubble ("Why so cheap?"):

- The market isn't sure search survives the AI answer box
- Cloud and YouTube priced as a sideshow

Why: beating the bond is trivial at this price, so the test is the index. The bubble names the doubt in plain words.

(Alphabet's live card still tests at an unanchored 10%/year. Section 15 lists it.)

### 12.6 Intel: no profit to price

> Reasonably priced only if you assume Intel earns **~$70–95 billion** a year by 2036. Intel lost ~$11 billion last year. Its best years were ~$21 billion.
> If profit reaches Intel's best year (~$21 billion), you're liable to lose **20–42% of your investment**.

Why: with no profit there's no growth rate to quote, so the card works in dollars, with two anchors the reader can hold: last year's loss and the best year ever. The range comes from two sources that disagree on Intel's value, and `notes` says so.

### 12.7 Adobe: the price allows profit to shrink

> Reasonably priced even if profit shrinks **~3%/year**.
> Analysts expect software companies to grow profit ~23%/year.

Why: "only if you assume" would be wrong when the price allows decline, so the frame changes. Large buybacks drive this, and the figure is rough. The bubble must say so.

### 12.8 A past view: Apple, October 2016

> priced at ≈13 years of that year's profit
> This price was reasonable assuming profit grew **~4%/year** over the following decade.
> The story then: "Peak iPhone." Sales had just fallen 8%; Icahn had sold; Buffett had quietly started buying.
> What happened since: Profit grew ~15%/year. The stock returned ~28%/year — the business beat a small requirement, and people went from paying 13 years of profit to 35–38.

Why: the reader sees that the "dying phone-maker" story was priced in, that the business beat it easily, and that most of the stock's return came from people paying more years of profit, which can't repeat the same way.

## 13. Rewrites

Lines the owner rejected or that break this guide, with what replaced them or would replace them.

| Before | After | Rule |
| --- | --- | --- |
| Reasonable investment assuming… | Reasonably priced if you assume… | Frame |
| No rate to compare | Palantir has been profitable since 2023. | State the fact |
| Why so much hope? | Why so pricey? | Board words |
| Room for error: ~3% | (removed) | Banned phrase |
| The ask is 15% | The price needs profit to grow ~15%/year | Words |
| Mood: optimistic | (removed) | Banned word |
| 9 pts above the bond | ~9%/year more than the safe US bond | Words, units |
| The stock took 25 years to get back to $80 | The stock took 25 years to get back to its March 2000 price | No share price |
| gold lost about half its value | gold lost ~half its value | ~ not "about" |
| Stocks have historically paid ~5 points more than this | Stocks have returned ~5%/year more than this over the long run, for taking the risk | Words |

## 14. Flags and soft claims

The owner holds a high standard for accuracy and wants soft claims flagged where the reader can see them. Three places:

1. **On the card**, when the reader needs it to read the line correctly: "(rough figure)", "≈", a range with both ends.
2. **In the footer**, for assumptions that apply to every card: the 18 years in 2036, analyst forecasts running optimistic, "liable to lose" being a scenario, not advice.
3. **In `notes`**, for whoever writes next: open questions, disagreeing sources, judgement calls on industry buckets, figures from memory. Notes never reach the board.

Flag when:

- the figure comes from memory or one unchecked search result,
- sources disagree by more than a few years of profit or a few percent,
- the industry bucket is a judgement call,
- a bullet goes stale with the news (a price move, a deal, a quarter's sales),
- the frame or anchor bends a rule of this guide.

## 15. Checklist

Before committing card copy:

- [ ] Every computed number is a placeholder.
- [ ] The scenario uses one of the four anchors, or the departure is flagged in `notes`.
- [ ] No word from the "never use" lists in section 6.
- [ ] No dollar share price.
- [ ] No "X, not Y", aphorism, tagline, hedge, rhetorical question or concept explainer.
- [ ] Two or three bullets, each one something that could fail.
- [ ] Past views say which part was the business and which part was the years people paid.
- [ ] `npm test` passes. It renders every card in every view and checks the word lists.
- [ ] `npm run reconcile` shows only the changes you meant.

### Open: existing wording that breaks this guide

To be rewritten in one pass once the owner has read this guide.

- "X, not Y": "Priced for reliability, not growth" (Apple); "Certainty, not growth" (Costco); "Excellence is assumed, not a bonus" (Palantir); "the belief shrank, not the business" (Oracle); "the belief shrank, the business didn't" (Oracle, 1 year ago).
- Aphorism: "The doubt is the discount" (Alphabet).
- "hope" on cards: Costco, Apple, Nvidia, Microsoft, Meta, Tesla and S&P 500 past views; the US Bond bullet "every stock's hope is worth less".
- Unanchored scenarios: Microsoft, Meta, TSMC, Amazon and Alphabet (10%/year); Apple (8%/year); Adobe (falls 5%/year); Micron (half this year's level).
