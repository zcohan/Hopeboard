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
10. Baselines
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

Every company card connects three numbers, each in its own labelled section:

| Section | What it says | Example (Costco) |
| --- | --- | --- |
| EARNS | What the business earns each year as a share of its price, against the safe US bond | **2.1%** of its stock price a year / 3% less than the safe US bond |
| PRICED FOR | The profit growth a year the price needs, against what the business has done | **+21%** growth/year / More than the 15%/year of the last decade |
| RISK or CUSHION | What you'd make or lose if growth comes in at an anchored rate | If the last decade's 15%/year growth repeats & the stock corrects, you'd make **0.5%/year less** than the safe US bond. |

The bubble behind the link ("Why so pricey?") says why people pay what they pay: the beliefs the price rests on.

A card is a short argument with no conclusion. It lays out the need, the record and the consequence, and stops. The reader draws the conclusion. Never write "so it's overpriced", "avoid", "a buy", "worth a look".

## 3. What to emphasise, in order

When there is room for only one point, take the first one on this list that applies.

### 3.1 The gap between what the price needs and what the business has done

This is the board's central fact. The Priced for section shows it on every card; the bullets and the Risk line should follow from it.

- Costco needs 21%/year and has done 15%. The card is about that gap.
- Alphabet needs 9%/year and has done 25%. The card is about that gap the other way.
- Mastercard needs 17% and has done 17%. The card is about there being no gap.

### 3.2 What the reader would make or lose, in money

Turn every gap into a consequence. "Needs more growth than it has shown" is abstract. "You'd make 0.5%/year less than the safe US bond" is a decision.

The safe US bond is the reference because it is the price of taking no risk. A stock that returns less than the bond has paid the reader to take risk for nothing. Every card's Risk or Cushion line compares with the bond, the S&P 500's included.

### 3.2a Put big numbers in perspective

A profit of "$290 billion a year" means nothing on its own. Next to "Apple earns $130 billion" it means the price needs SpaceX to become more than twice the most profitable company most people can name. The owner singled this out as the board's clearest kind of line. The skill is the perspective, not Apple: pick whatever comparison makes this card's number land.

- A dollar profit the price needs: compare with a profit the reader can place. Another company's (SpaceX against Apple), the company's own best year (Intel against its best years), or the cash its business already brings in (CrowdStrike).
- A long stretch of years: compare with a span the reader knows. A price of 160 years of profit is longer than the US has had a stock market.
- A growth rate: compare with what the company has done ("More than the 15%/year of the last decade").
- One comparison per number, and only where the bare number would be abstract. Every compared figure is a placeholder from the data, never typed.
- Don't repeat the same comparison across cards. If two cards would both reach for Apple, find another for one of them.

### 3.3 The one thing the price depends on

Each price rests on something specific. Find it and test it. This is what makes the Risk line different on every card.

| Company | What the price depends on | So the test is |
| --- | --- | --- |
| Costco | Repeating a record it has never beaten | Its own record repeating |
| Nvidia, Micron | This year's boom profit being the new normal | Profit that doesn't grow from here |
| Exxon, Verizon | Cash handed back while you wait | No growth at all |
| Palantir, Tesla, AMD | Growth far above anything on record | The average big US company |
| Microsoft, Meta, TSMC, Amazon, Alphabet | Staying above an average company | The average big US company |
| CrowdStrike, Palo Alto | Profit catching up with the cash the business brings in | Profit growing to that cash |

### 3.4 How long a good thing lasts

Markets are good at facts and weaker on duration. When a price is low because people doubt something will last (Alphabet and AI chatbots, Apple in 2016 when iPhone sales fell), say what the doubt is in plain terms. When a price is high because people assume it will last (Costco, Walmart), say what that requires.

### 3.5 Cash paid while you wait

Dividends are part of the return, and they are a slice of the profit, not extra on top of it. Buybacks work through profit per share (each share owns more of the profit), so they are never presented as cash returned.

The Earns section spells out the dividend only when it is 3% of the price or more (Verizon, AT&T, Chevron, Home Depot), where it explains why the price needs little growth. Smaller dividends still count in Priced for.

### 3.6 What changed the years people pay

In past views, the gap between profit growth and the stock's return is the change in how many years of profit people paid. Name it with the numbers: "the years of profit people paid rose from 14 to 39". This is how the board shows that a chart is two numbers multiplied together.

## 4. What not to emphasise

- **The chart and the stock's past return as a headline.** A past return appears only in past views, and always next to profit growth, so the reader sees which part was the business and which part was people paying more.
- **Product excitement.** "The new chip is incredible" is not a reason. "Makes almost all of the most advanced AI chips" is: it explains why people pay.
- **News flow.** A week's headlines go stale. Write the belief underneath ("Investors doubt Google search holds up against AI chatbots"), not the event ("Google unveiled X on Tuesday").
- **Prices.** Never a dollar share price, and no dollar price for gold. The board's units are years of profit and percentages. Company-wide dollar amounts (profit, revenue, spending, value) are fine, and so is the oil price on oil companies.
- **Our opinion of the company.** "A great business" or "a fading brand" is opinion. Say what the price assumes and what the record shows.
- **Who said it.** No "analysts warn", "critics say", "bulls argue". If a belief is in the price, state it as what the price assumes. (The analysts' forecast note is the exception: it is a figure, and it says whose.)

## 5. Voice

Explain the price the way Charlie Munger or Mohnish Pabrai would explain an investment to a ten-year-old: what you pay, what the business earns, and what has to happen for the deal to work. Simple enough for a child, and every step backed by a reason and a number. The owner holds this up as the board's model.

The cards read like a sharp analyst writing for a friend who doesn't work in finance. The owner's edits all point the same way: fewer words, neutral rather than dramatic, nothing clever.

- **State facts.** "Palantir has been profitable since 2023." Not "Palantir has only recently become profitable, which is worth bearing in mind."
- **Neutral.** "Has returned 8%/year since 1971, unevenly", not "with twenty-year stretches of nothing". "Uncertainty", not "risk", when describing stocks in general.
- **No metaphors.** "Pull rabbits out of hats", "no profit underneath to catch it", "priced as a sideshow", "a pet rock" were all cut. Say the plain thing.
- **Exact about what is measured.** "of its stock price", "of an index fund's price", "of its yearly interest".
- **Statements, not questions.** The only questions on the board are the bubble links.
- **No hedging on the card.** No "might", "could potentially", "it's possible that", "arguably". The one allowed softener is "you may lose" in the Risk line, the owner's choice. Uncertainty about a figure goes in a flag (section 14), not in hedged prose.
- **No disclaimers on the card.** The not-advice line lives in the footer, once.
- **Precise.** "Revenue grew 40% last year, led by AI chips" beats "sales are booming".
- **Short.** One idea per sentence. Most sentences under 20 words. Bullets under 12.
- **One thought per line.** A second, separate thought goes on its own line (the US Bond's guarantee and what it means for stocks are two lines).
- **Concrete.** People, piles of money, years. "People pay 35 years of last year's profit" is a picture. "A 35× multiple" is not.
- **Spelling.** British, as the board already uses: centre, favourite, sceptical.
- **No exclamation marks, no italics for emphasis, no capitals for emphasis.** Bold is used only where the templates put it: the headline figures and the Risk line's result.

## 6. Words

Use one word for one thing, everywhere. If the reader learns a word on one card, it must mean the same on every other.

| Use | Never use |
| --- | --- |
| priced at 35 years of last year's profit | P/E, multiple, valuation, multiple expansion, rerating |
| next year's forecast | forward P/E, forward earnings, consensus |
| profit (always per share) | earnings, EPS, net income, bottom line |
| what it keeps from each sale | margins |
| orders it hasn't delivered yet | backlog |
| spending on buildings and equipment, data centres | capex |
| big cloud companies | hyperscalers |
| Priced for +21% growth/year; the price needs profit to grow at 21%/year | the ask, asks, implied growth, priced in, baked in |
| profit grows at 21%/year | profit grows 21%/year (drops the "at") |
| returns, make, lose | pays, yields, total shareholder return |
| the safe US bond (US Bond as the card name) | the bond, Treasuries, risk-free rate |
| more than, less than, the same as | up from, down from, pts, points, percentage points, bps |
| the stock corrects | (the owner's word for buyers going back to ordinary years of profit) |
| dividends | capital return, shareholder yield, payout |
| Pricey, Normal, Bargain, Not profitable | Expensive, Cheap, Overvalued, Undervalued (as labels) |
| the average big US company | the market average, the median company |
| the index | the market, SPX (in prose) |
| individual investors | retail, retail investors |

Never use: mood, sentiment, Mr Market, margin of safety, room for error, moat, priced for perfection, headwinds, tailwinds, catalyst, upside, downside, bullish, bearish, compounder, story stock, multiple compression, foundry, ESG.

"Record" and "hope" are the board's internal words. The page name uses "hope". On cards, write what they stand for: "what the business has done" and "the years of profit people pay".

### Translating a source

Sources use jargon. Translate before it reaches a card.

| Source says | Card says |
| --- | --- |
| trades at 46x trailing earnings | priced at 46 years of last year's profit |
| forward P/E of 30 | 30 years of next year's forecast |
| EPS fell 18% YoY | profit fell 18% last year |
| guidance implies 21% EPS growth | analysts expect 21% profit growth next year |
| margin compression from input costs | memory chips have got more expensive, which cuts what it keeps from each sale |
| capex of $220bn | spent $220 billion on buildings and equipment last year |
| multiple contracted from 38x to 29x | the years of profit people paid fell from 38 to 29 |
| a foundry | a company that makes other companies' chips |

## 7. Numbers

### 7.1 Never type a computed number

Required growth, returns, gains, losses and gaps to the bond are computed by the app. In `data/cards.json`, write a placeholder:

- Write `**{reqSigned}** growth/year`, never `+21% growth/year`.
- Write `{outcome}`, never `you'd make 0.5%/year less than the safe US bond`.

Placeholders are listed in `README.md`. If you need a number that has no placeholder, add the figure to `data/figures.json` with a source and add a placeholder. Don't type it.

Facts that are inputs, not results, may be typed in bullets and stories when they are sourced: "Micron lost money as recently as 2023", "Bought Hess in 2025". Record the source in `notes` if it isn't already in `figures.json`.

### 7.2 Marks

- No `~` on figures (the owner found it visually dirty, October 2026). Every figure is rounded, and the footer says so once.
- `≈` before an estimated figure (set in `figures.json`, shown by the app), such as SpaceX's years of revenue.
- No mark on a scenario growth rate that is an anchor. "If profit only grows at 13%/year (the average big US company)": the anchor is a definition, not an estimate.
- A range where sources disagree: "$70–95 billion", "20–42% of your investment". Say why in `notes`.

### 7.3 Units

- Growth and returns per year: "15%/year". Write "/year" every time, so the reader never has to guess whether a figure is yearly or total. That includes short labels: the compare badge reads "Better deal · needed 48%/year, now 47%/year", never "needed 48%, now 47%".
- Losses over the whole decade: "you may lose 34% of your investment". This is the one total figure.
- One-year past views: "Profit grew 30%. The stock returned 39%." (no "/year", because it is one year).
- Years of profit: "35 years", never "35x". The US Bond is in the same unit: "20 years of its yearly interest".
- Dollars: "$175 billion". Never a share price.

### 7.4 Rounding

The app rounds: required growth to whole percent, gaps to the nearest half percent, the bond to one decimal. Don't write prose that depends on a finer figure ("just over 14%").

### 7.5 Scenario growth rates must be anchored

The Risk line's growth rate must be one a reader can check. These anchors are allowed:

| Anchor | `scenario` | Reads |
| --- | --- | --- |
| The company's own last decade | `{"anchor":"last"}` | If the last decade's {g}/year growth repeats |
| No growth | `{"anchor":"none"}` | If profit doesn't grow |
| The average big US company | `{"anchor":"average"}` | If profit only grows at {g}/year (the average big US company) |
| A dollar profit (cards in dollars) | `{"anchor":"profit","key":"…"}` | If profit reaches Intel's best year ({p:best:bare}) |

The average big US company is the S&P 500's profit growth over the last decade, computed from Shiller's data. Never type it.

Never pick a round number because it sounds reasonable ("if growth drops to 8%"). If none of the anchors tests what the price depends on, flag it in `notes` and propose an anchor to the owner.

How to choose:

- No decade of profit to repeat, and growth needed above the average → the average big US company (Tesla, Palantir, AMD).
- The price needs more than the company has ever done → its own record (Costco, Walmart).
- The record ends on a boom → no growth (Nvidia, Micron).
- Cash returned is most of the return → no growth (Exxon, Verizon).
- No profit, or barely any → a dollar profit the reader can place (Intel's best year, Apple's profit, the cash the business brings in).
- Otherwise → the average big US company (Microsoft, Meta, Dell, Cisco).

## 8. The card, part by part

### 8.0 The description (`about`)

One line under the company's name saying what the business does, in words the owner's mum would understand: products people know, not industry terms. "Facebook & Instagram", "Makes Apple's & Nvidia's chips", "Holiday home rentals". Never "infrastructure software", "semiconductors" or "platform". Check claims: "makes all computer chips" is not true of TSMC; "makes Apple's & Nvidia's chips" is.

The name links to the company's page on Yahoo Finance, for readers who want the stock itself. The board doesn't show it.

### 8.1 The top right

Set by the app from `figures.json`: "priced at / 35 years / of last year's profit". Nothing to write. Gold has nothing here: with no profit or interest there are no years to count.

### 8.2 Earns (shared, `company-lines.farm`)

What the business earns each year as a share of its price, against the safe US bond. It is Buffett's farm: a farm that costs $1,000 and earns $70 a year earns 7% of its price. Written once for every card; don't write it per card.

> **0.6%** of its stock price a year
> 4.5% less than the safe US bond

> **8.3%** of its stock price a year
> 3% more than the safe US bond
> 6.3% of it paid to you as dividends

- Percentages only, against the bond. Never "each $100 buys" (the owner prefers percentages to dollar amounts).
- The dividend note appears only when dividends are 3% or more (section 3.5).
- Left off cards that are Not profitable: there's nothing earned to compare.
- The S&P 500 has its own wording: "of an index fund's price a year".

### 8.3 Priced for (`assumes`)

The profit growth a year the price needs, as a headline, then notes:

```
"assumes": "**{reqSigned}** growth/year\n{vsLastNote}."
```

> **+21%** growth/year
> More than the 15%/year of the last decade. Analysts expect 10% profit growth next year.

- `{vsLastNote}` writes "More than the 15%/year of the last decade", "Less than…" or "The same rate as over the last decade".
- The analysts' forecast note is added by the app when there is a forecast. One year, and it says so; don't compare it with the ten-year figure in words.
- The notes under Priced for are sentences, end with a full stop, and run on as one short paragraph rather than a line each (owner, October 2026).
- A short qualifier after the record is allowed when it changes how to read it: "Less than the 68%/year of the last decade, ending on a boom year" (Nvidia), "…from almost nothing" (Amazon). The three-year averages already smooth over a single bad year, so don't add a qualifier for one.
- No decade of profit: the headline alone (`**{reqSigned}** growth/year`). The fact goes in the bubble: "Profitable only since 2023, so there's little record to go on".
- Profit allowed to shrink: the record in plain words, "Over the last decade it shrank 1%/year". When the record rounds to 0%, "Over the last decade its profit barely changed" (Verizon); a test checks it still rounds to 0%.

**Cards in dollars.** A company that lost money, or earns under 0.2% of its price (more than 500 years of profit), sits in Not profitable and is priced in dollars, with two anchors the reader knows:

> **$65 billion** profit/year by 2036
> Intel lost $11 billion last year. Its best years were $21 billion.

> **$290 billion** profit/year by 2036
> SpaceX lost $9 billion on $23 billion of revenue last year. Apple earns $130 billion.

### 8.3a Finances (shared, `company-lines`)

A link at the foot of the card, "Finances", opens one bubble on the company's health. It stays out of the three sections, which are the card's core (owner, October 2026). Written once for every card; the app picks the wording from the data. Three small headings, each left off when its figure isn't in the data:

> **Cash**: Holds **8 years** of profit in cash, beyond its debt
> **Debt**: It would take **10 years** of profit to pay off its debt, after using its cash
> **Cash & debt**: Cash and debt close to even (within a quarter of a year of profit)
> **Dividends**: Pays **2.4%** of its stock price a year as dividends / Pays no dividend
> **Shares**: Bought back **4.3%** of its shares a year over the last 10 years, so each share owns a bigger slice / Issued **6.3%** more shares a year…, so each share owns a smaller slice

Relative only: years of profit and percentages, no dollar amounts (owner, October 2026). Not profitable cards have no profit to measure against, so the cash line says only which is bigger: "Holds more in cash than it owes". Banks get no cash or debt line: their debts are mostly deposits. A missing figure never reads as zero.

### 8.4 Risk or Cushion (`consequence`)

One if-then sentence: the scenario, then `{outcome}`. The owner tried the result as a headline with the scenario as a note (October 2026) and preferred the sentence.

```
"consequence": "If profit only grows at {g}/year (the average big US company){corrects}, {outcome}."
```

- `{corrects}` goes straight after the scenario. On Pricey cards it writes " & the stock corrects", because buyers going back to an ordinary 18 years of profit is most of the loss there. Elsewhere it writes nothing. (Tesla keeps its own clause, "and buyers stop paying extra for the story", which the owner likes.)
- The label is RISK when you'd make less than the safe US bond (a loss counts as less), and CUSHION when you'd make at least as much. The app sets it.

Forms the app writes for `{outcome}`:

- Loss over the decade: "you may lose **34% of your investment**" (red). "May lose" is the owner's choice: shorter than "liable to lose", and less certain.
- Better than the bond: "you'd still make **2%/year more** than the safe US bond".
- Worse than the bond: "you'd make **1.5%/year less** than the safe US bond".
- Level with it: "you'd make **the same** as the safe US bond".
- Give only the gap to the bond. Don't add the return itself (`{outcome:r}`); the owner found "you'd make 2.5%/year, 2.5%/year less…" harder to read.

Write the scenario so it names the anchor in plain words:

| Good | Why |
| --- | --- |
| If profit only grows at 13%/year (the average big US company), {outcome}. | Names the anchor. "only" because 13% is below what the price needs. |
| If the last decade's 15%/year growth repeats, {outcome}. | The record repeating is the test. |
| If profit doesn't grow from this year's level, {outcome}. | Says "this year's level" because the level itself is the doubt. |

| Bad | Why |
| --- | --- |
| If growth drops to only 8%/year, … | 8% has no anchor. |
| In a downside scenario, … | Jargon, and doesn't say what happens. |
| If things go wrong, you could lose money. | No number, hedged, says nothing. |
| …you'd make 5.8%/year. | A return with no comparison means nothing to the reader. Always compare with the bond. |

"only" goes in when the scenario growth is below what the price needs. "still" is written by the app when the result beats the bond. Never write "still" yourself.

### 8.5 The bubble (`bullets`, opened by the link)

The link under each card opens a bubble. The link text is the section's heading, from `comment-headings`:

| Section | Link |
| --- | --- |
| Pricey | Why so pricey? |
| Normal | What the price assumes |
| Bargain | Why so cheap? |
| Not profitable | Why this price? |

The bubble holds two or three bullets. Each bullet is one belief the price rests on, or one fact that explains why people pay what they pay.

Rules:

- Two or three bullets. Never one, never four. If the third would repeat the first two, stop at two.
- Under 12 words each where possible.
- Sentence case, no full stop.
- Each belief is a full statement, usually "The price assumes…" or "It assumes…". A fragment like "Loan losses stay low" or "Markets stay busy" reads as broken under a heading; write "The price assumes few of its loans go bad".
- Facts that explain the price are fine as they are: "Revenue grew 40% last year, led by AI chips", "Micron lost money as recently as 2023".
- Each belief must be something that could turn out false. "Nvidia makes chips" can't. "It assumes no rival catches up" can.
- Explain a product name the reader may not know: "AWS, its cloud business", "Azure, its cloud business".
- One bullet may give a number that shows the scale: "It assumes the $173 billion it spent on buildings and equipment last year pays off".

Good bullets, with why:

| Bullet | Card | Why it works |
| --- | --- | --- |
| The price assumes this year's boom profit is the new normal | Nvidia | Names the belief the whole price rests on. |
| Makes almost all of the most advanced AI chips | TSMC | A fact the reader can picture, and the reason people pay. |
| Part of the price reflects the risk of conflict over Taiwan | TSMC | Why the price is lower than the record suggests, said plainly. |
| Investors doubt Google search holds up against AI chatbots | Alphabet | The doubt that makes it cheap. |
| The price assumes OpenAI, its biggest new customer, pays its bills in full | Oracle | Specific, checkable, and the hinge of the price. |
| It pays no dividend while it keeps building | Amazon | Tells the reader why there's no cash return. |

Bad bullets, with fixes:

| Bad | Problem | Better |
| --- | --- | --- |
| Strong competitive moat | Jargon, and can't fail as written | It assumes no rival catches up |
| Investors are bullish on AI | Sentiment, not a belief about profit | It assumes data-centre spending doesn't slow |
| Priced for Elon Musk continuing to pull rabbits out of hats | Metaphor | The price assumes Elon Musk keeps building big new businesses |
| The doubt is the discount | Aphorism | (cut it, or say the doubt itself) |
| Discount for the Taiwan Strait | Clipped, needs decoding | Part of the price reflects the risk of conflict over Taiwan |
| Azure and Office keep growing mid-teens | Jargon ("mid-teens"), unexplained name | The price assumes Azure, its cloud business, and Office keep growing fast |
| Busy markets stay busy | Says nothing | The price assumes markets stay busy |

A price move can appear as a fact in a bullet only when it explains the current price: "The stock is down 30% this year on fears that AI makes creative tools cheap".

## 9. Past views

Past cards show what a price needed then, what people were saying, and what happened. Their job is to show that the same reading worked or failed in hindsight. They use the same Priced for section as today's cards; the story and what happened sit behind the link.

### 9.1 The story then (`story`)

One line on how the company was seen at the time, in plain words. Short phrases joined with semicolons are fine. No quotes, nicknames or market slang ("Peak iPhone", "a pet rock", "the AI king", "retail favourite" were all replaced). Don't repeat the years of profit; the card shows them.

| Good | Why |
| --- | --- |
| iPhone sales falling for the first time in years; Carl Icahn had sold, and Warren Buffett had started buying. | What people saw then, as facts. |
| Mostly a maker of gaming chips; AI a small research business. | How the company was seen, in plain words. |
| Recovering from a 2020 loss; dropped from the Dow Jones index the year before; some funds selling out of oil companies. | Why nobody wanted it. |

| Bad | Problem |
| --- | --- |
| Before its huge AI run, Nvidia was undervalued. | Hindsight. The story must be what people believed then. |
| The AI king. | A nickname. Say what it was: the leading AI chip maker. |
| Sentiment was negative. | Jargon and vague. |

### 9.2 What happened since (`happened`)

Profit first, then the stock, then the link between them. Use placeholders for the figures (`{profitMove}`, `{stock}`, `{peMove}`, `{vsReq}`, `{goldMove}`).

> Profit {profitMove} {vsReq}. The stock returned {stock}/year, and the years of profit people paid {peMove}.

Reads: "Profit grew 15%/year — more than the 5% required. The stock returned 29%/year, and the years of profit people paid rose from 14 to 39."

Say which part was the business and which was people paying more or less. That is the lesson of the past views. Don't stop at "the stock returned 28%/year". Never hard-code "grew" or "rose": the placeholders pick the word from the sign.

## 10. Baselines

The baselines are where people already park money: US Bond, S&P 500, Gold, in that order.

- **US Bond.** Priced at "20 years of its yearly interest", the same unit as the stocks. Two lines: "Guaranteed to return **{bond}/year** for ten years." and "Stock prices generally promise a higher return than this, or they aren't worth the uncertainty." Its past views say only what it was guaranteed to return then, plus a line where the rate itself was the story (2021's near-zero).
- **S&P 500.** The company layout: Earns ("of an index fund's price a year"), Priced for, Risk or Cushion against the safe US bond. The note "Has returned {index}/year since 1928, dividends included" stays, because that 10% is what every card's growth figure is measured against.
- **Gold.** No profit and no price. "Has returned **{goldReturn}/year** since 1971, unevenly." and "Can fall for decades: from 1980 to 2000 gold lost half its value after inflation." (the owner's wording).

## 11. Constructions that are banned

These read as machine-written, and the owner has rejected every one of them.

### 11.1 "X, not Y"

| Bad | Better |
| --- | --- |
| Priced for reliability, not growth | The price assumes people keep buying iPhones and stay with Apple's services |
| Three years of growth from almost nothing is a start, not a record | Palantir has been profitable since 2023. |
| The belief shrank, not the business | Profit grew 10%. The price halved. |

Also banned: "It's not about X, it's about Y", "Less X, more Y", "X rather than Y" used as a flourish, and "pays for X more than for Y". When in doubt, say only the positive half.

### 11.2 Aphorisms, taglines and metaphors

| Bad | Problem |
| --- | --- |
| Growth that is expected is already paid for. | True, and it's the board's whole idea, so the card shouldn't say it. The numbers show it. |
| The doubt is the discount. | Neat-sounding. Cut it, or replace it with the doubt itself. |
| If the fear fades, there is no profit underneath to catch it. | Metaphor. Say what happened: gold lost half its value from 1980 to 2000. |
| Time in the market beats timing the market. | Tagline. Never. |

A colon that sets up a reveal ("Earns nothing: no interest, no profit.") and a one-word ending ("…since 1971, unevenly.") read as machine-written when they're used for effect. The gold line keeps "unevenly" because the owner chose it.

### 11.3 Explaining the concept

The board explains itself through its numbers. Never write a line that explains how the board works on a card.

| Bad |
| --- |
| Remember: a high price means high expectations. |
| This shows why the years of profit matter. |
| The required growth is the growth needed to match the index. |

The Methodology page defines terms once. The cards never do.

### 11.4 Also banned

- Rhetorical questions in body text ("Can it last?").
- Hedges: might, could, arguably, potentially, somewhat, fairly. ("may" is allowed only in "you may lose".)
- Intensifiers: very, extremely, incredibly, massive, huge (use the number instead).
- Filler: "It's worth noting", "Importantly", "In other words", "Simply put", "At the end of the day".
- Second person outside the Risk line and the Earns dividend note. "You" appears in "you'd make", "you may lose" and "paid to you as dividends", and nowhere else.
- Advice: buy, sell, avoid, opportunity, worth a look, steer clear.

## 12. Worked examples

Each example shows how the card reads today, then why it was written that way.

### 12.1 Costco: needs more than it has ever done

> EARNS **2.1%** of its stock price a year / 3% less than the safe US bond
> PRICED FOR **+21%** growth/year / More than the 15%/year of the last decade
> RISK If the last decade's 15%/year growth repeats & the stock corrects, you'd make **0.5%/year less** than the safe US bond.

Why: the hinge is that Costco's price needs more than its own best decade. So the test is its own record, and the result is worse than the bond. The reader sees that a famous, steady company can be a poor place to park money at this price.

### 12.2 Nvidia: the record ends on a boom

> PRICED FOR **+14%** growth/year / Less than the 68%/year of the last decade, ending on a boom year / Analysts expect 71% profit growth next year
> RISK If profit doesn't grow from this year's level & the stock corrects, you may lose **32% of your investment**.

Why: 14%/year looks easy next to 68%. But the 68% ends on a boom year, so the question is whether this year's profit is the new floor. "Doesn't grow from this year's level" tests exactly that.

### 12.3 Verizon: the dividend carries it

> EARNS **8.3%** of its stock price a year / 3% more than the safe US bond / 6.3% of it paid to you as dividends
> PRICED FOR **−1%** growth/year / Over the last decade it shrank 1%/year
> CUSHION If profit doesn't grow, you'd still make **5.5%/year more** than the safe US bond.

Why: the requirement is below zero because most of the profit comes back as cash. The dividend note is there because it explains the −1%.

### 12.4 Palantir: no decade of profit

> PRICED FOR **+37%** growth/year
> RISK If profit only grows at 13%/year (the average big US company) & the stock corrects, you may lose **62% of your investment**.
> Bubble: Profitable only since 2023, so there's little record to go on

Why: there is no record to compare with, so Priced for stands alone and the fact goes in the bubble. Growing as fast as the average big US company still loses most of the money.

### 12.5 Alphabet: priced for doubt

> PRICED FOR **+9%** growth/year / Less than the 25%/year of the last decade / Analysts expect 27% fall in profit next year
> CUSHION If profit only grows at 13%/year (the average big US company), you'd still make **9%/year more** than the safe US bond.
> Bubble ("Why so cheap?"): Investors doubt Google search holds up against AI chatbots / The price gives little value to its cloud business and YouTube

Why: the price needs much less than the record, and the bubble names the doubt in plain words.

### 12.6 Intel: no profit to price

> PRICED FOR **$65 billion** profit/year by 2036 / Intel lost $11 billion last year. Its best years were $21 billion.
> RISK If profit reaches Intel's best year ($21 billion), you may lose **17% of your investment**.

Why: with no profit there's no growth rate to quote, so the card works in dollars, with two anchors the reader can hold: last year's loss and the best year ever.

### 12.7 A past view: Apple, October 2016

> priced at 14 years of that year's profit
> PRICED FOR **+5%** growth/year
> The story then: iPhone sales falling for the first time in years; Carl Icahn had sold, and Warren Buffett had started buying.
> What happened since: Profit grew 15%/year — more than the 5% required. The stock returned 29%/year, and the years of profit people paid rose from 14 to 39.

Why: the reader sees that the doubt was in the price, that the business beat a small requirement easily, and that most of the stock's return came from people paying more years of profit, which can't repeat the same way.

## 13. Rewrites

Lines the owner rejected or changed, with what replaced them.

| Before | After | Rule |
| --- | --- | --- |
| Reasonably priced if you assume profit grows at 21%/year | PRICED FOR **+21%** growth/year | Three sections |
| Up from the 13%/year of the last decade | More than the 13%/year of the last decade | more/less, not up/down |
| 5%/year more than over the last decade | More than the 13%/year of the last decade | Show the record, not the gap (the owner found the gap less clear) |
| you're liable to lose 32% | you may lose 32% | Owner's choice |
| If profit doesn't grow from this year's level, you may lose… | If profit doesn't grow from this year's level & the stock corrects, you may lose… | Name the correction on Pricey cards |
| of its price a year | of its stock price a year / of an index fund's price a year | Exact about what's measured |
| Returns 5.1%/year for ten years, guaranteed. It reached 5.3% in October, the highest since 2002. Every stock below has to promise more than this, or it isn't worth the risk. | Guaranteed to return 5.1%/year for ten years. / Stock prices generally promise a higher return than this, or they aren't worth the uncertainty. | Fewer words, neutral, one thought per line |
| Pays nothing and produces nothing, so there is no profit to grow… with twenty-year stretches of nothing. | Has returned 8%/year since 1971, unevenly. | Neutral, no flourish |
| ≈$4,165 an ounce, no profit | (nothing) | No prices |
| Why so much hope? | Why so pricey? | Board words |
| Room for error: 3% | (removed) | Banned phrase |
| The ask is 15% | The price needs profit to grow at 15%/year | Words |
| 9 pts above the bond | 9%/year more than the safe US bond | Words, units |
| The stock took 25 years to get back to $80 | The stock took 25 years to get back to its March 2000 price | No share price |

## 14. Flags and soft claims

The owner holds a high standard for accuracy and wants soft claims flagged where the reader can see them. Three places:

1. **On the card**, when the reader needs it to read the line correctly: "≈", a range with both ends.
2. **On the Methodology page and in the footer**, for assumptions that apply to every card: the 18 years in 2036, analyst forecasts running optimistic, "may lose" being a scenario, not advice, and that figures are rounded.
3. **In `notes`**, for whoever writes next: open questions, disagreeing sources, judgement calls, figures from memory. Notes never reach the board.

Flag when:

- the figure comes from memory or one unchecked search result,
- sources disagree by more than a few years of profit or a few percent,
- a bullet goes stale with the news (a price move, a deal, a quarter's sales),
- the frame or anchor bends a rule of this guide.

## 15. Checklist

Before committing card copy:

- [ ] Every computed number is a placeholder.
- [ ] The scenario uses one of the anchors in 7.5, or the departure is flagged in `notes`.
- [ ] No word from the "never use" lists in section 6.
- [ ] No share price, no gold price.
- [ ] No "X, not Y", aphorism, metaphor, tagline, hedge, rhetorical question or concept explainer.
- [ ] Two or three bullets, each a full statement.
- [ ] Past views say which part was the business and which part was the years people paid.
- [ ] `npm test` passes. It renders every card in every view and checks the word lists.
- [ ] `npm run figures` shows only the changes you meant.

### Open

- The bullets and stories are hand-written and go stale. Re-read them when the figures move a section.
