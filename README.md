# Hopeboard

Hopeboard shows what today's price of popular investments assumes: what the business earns against the safe US bond, the profit growth the price needs over ten years, and what you'd make or lose if it doesn't come.

**It is an educational tool, not investment advice.** Nothing here recommends buying or selling anything. Figures are computed from public data, rounded, and may be out of date or wrong.

Read `CLAUDE.md` first. It is the brief, and it points to the docs.

```
npm install
npm run dev          # board at http://localhost:5173
npm test             # typecheck, formula tests against the spec tables, card and writing-guide checks
npm run build        # production build
```

## Data

The figures are computed from downloaded data, never typed in. Put the keys in `.env.local` (git-ignored, never committed):

```
EOD_API_KEY=…            # EOD Historical Data: prices, dividends, splits, the 10-year Treasury yield
ALPHAVANTAGE_API_KEY=…   # Alpha Vantage: analysts' forecasts (free plan: 25 calls a day)
SEC_CONTACT=you@example.com   # the SEC asks for a contact email on its downloads
CLOUDFLARE_API_TOKEN=…        # Cloudflare Pages: Edit, for publishing
CLOUDFLARE_ACCOUNT_ID=…
```

```
npm run fetch        # download into .cache/ (git-ignored); repeat runs only fetch what's stale
npx tsx scripts/supplements.ts   # figures read from filed reports (share classes, lagging quarters)
npm run figures      # show what the new data changes; add `-- --write` to save data/figures.json
npm run refresh      # all of the above, kept only if the tests still pass, then published to Cloudflare Pages
npm run refresh:install   # run the refresh every morning at 8:00 (macOS launchd)
```

Sources: company filings from SEC EDGAR (profit per share, share classes, Berkshire's investment gains); prices, dividends, splits and Treasury yields from EOD; forecasts from Alpha Vantage. `scripts/sources.ts` says where each company's figures come from.

## Layout

- `data/figures.json`: every number and its source, written by `scripts/figures.ts`. Required growth, returns and gains or losses are never stored. They are computed.
- `data/cards.json`: every word on the board, written to `docs/writing-guide.md`. `notes` are flags for whoever writes next and never reach the board (the build strips them).
- `src/formula.ts`: the formula. `src/engine.ts`: figures to numbers. `src/tokens.ts` and `src/copy.ts`: placeholders in the wording (`{req}`, `{outcome}`, …). `src/board.ts`: the board HTML. `src/popover.ts`: places the comment bubble under its link.
- `scripts/`: `fetch.ts`, `xbrl.ts` and `supplements.ts` download; `compute.ts` and `figures.ts` compute.
- `public/logos/`: company logos from Wikimedia Commons; `sources.json` lists each file's page and licence.

## Placeholders

`{opening}` ("Only if" or "If", set by section), `{req}`, `{vsLast}` (up from / down from the last decade, or "the same rate"), `{last}`, `{g}` (scenario growth), `{outcome}` (lose X% in red, or X%/year more or less than the safe US bond; `:index`, `:its` variants), `{earns}`, `{earnsVsBond}`, `{pays}`, `{fcastValue}`, `{vsBond}`, `{pe}`, `{pef}`, `{peNow}`, `{reqProfit}`, `{p:key}`, `{bond}`, `{highSince}`, `{goldReturn}`, `{index}`, `{normalYears}`, `{profit}`, `{stock}`, `{era}`. Arguments: `:bare` drops the `≈`, `:abs` drops the sign.

Scenario anchors (`scenario` on a card entry): `none`, `last`, `average` (the S&P 500’s last-decade profit growth, from three-year averages at each end), plus `endsAt` and `profit` for cards that need a dollar or level test.
