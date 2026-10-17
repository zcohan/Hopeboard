#!/bin/zsh
# Daily refresh: download new prices, dividends, filings and forecasts, recompute
# data/figures.json, and keep the new figures only if every card still passes the
# tests (the wording checks catch lines the new numbers have made untrue).
# Run by launchd (scripts/com.hopeboard.refresh.plist); logs to .cache/refresh.log.
set -u
export PATH=/opt/homebrew/bin:/usr/bin:/bin
cd "${0:A:h}/.."
log=.cache/refresh.log
mkdir -p .cache
exec >>"$log" 2>&1
echo "\n=== $(date '+%Y-%m-%d %H:%M') refresh"

notify() { osascript -e "display notification \"$1\" with title \"Hopeboard\"" >/dev/null 2>&1 || true }

cp data/figures.json .cache/figures.before.json
if ! npx tsx scripts/fetch.ts; then notify "Refresh failed while downloading. See .cache/refresh.log"; exit 1; fi
if ! npx tsx scripts/supplements.ts; then notify "Refresh failed reading filings. See .cache/refresh.log"; exit 1; fi
if ! npx tsx scripts/figures.ts --write; then
  cp .cache/figures.before.json data/figures.json
  notify "Refresh failed computing figures; kept yesterday's. See .cache/refresh.log"; exit 1
fi
if ! npx vitest run; then
  cp .cache/figures.before.json data/figures.json
  notify "New figures broke a card's wording; kept yesterday's. See .cache/refresh.log"; exit 1
fi
echo "ok"
