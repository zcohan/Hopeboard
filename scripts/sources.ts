// Where each company's figures come from. `cik` is the SEC's company id (more
// than one when a company re-registered); `eod` is EOD's symbol for its US
// shares. `fx` is EOD's currency pair when the filings aren't in dollars, and
// `perShare` is how many reported shares one US-traded share stands for.
export interface Source {
  id: string;
  cik: number[];
  eod: string;
  fx?: string;
  perShare?: number;
  /** When `perShare` changed (Alibaba split its shares eight for one in July 2019, its US shares unchanged; Toyota's
   * five-for-one split in 2021): the ratio
   * for figures filed before `filedBefore`. */
  perShareEarlier?: { filedBefore: string; perShare: number };
  forecast?: false;
  /** Alpha Vantage's symbol when it differs from `id`. */
  av?: string;
  /** Figures read from the filed reports (see xbrl.ts), added to the SEC summary data under `as`. */
  supplement?: { concept: string; as: string; member?: string }[];
  /** Profit per share leaves out investment gains after their tax (Berkshire's operating profit). */
  operating?: boolean;
  /** Where its gains on investments are filed, when not under the standard labels (compute.ts GAINS). */
  gains?: string[];
  /** Banks: buying and selling investments is part of the business, so the gains stay in profit. */
  keepGains?: true;
  /** Cash and debt the standard labels miss, from supplements (`as` names), added to what they find. */
  balance?: { cash?: string[]; debt?: string[] };
  /** Stakes in other companies held among its marketable securities (supplement `as` names): counted as stakes, not cash. */
  stakesInCash?: string[];
  /** Checked against the latest filed report: it has no borrowing, so no debt label is no debt. */
  debtFree?: true;
}

/** The board's companies that are in the S&P 500 (Wikipedia's list of its members, October 2026): their gains on
 * investments and stakes come off the index's profit and price the way they come off their own cards'. */
export const SPX_MEMBERS = new Set(['TSLA', 'PLTR', 'COST', 'AAPL', 'NVDA', 'MSFT', 'META', 'AMZN', 'ORCL', 'GOOGL', 'XOM', 'AVGO', 'AMD', 'INTC', 'MU', 'CRM', 'ADBE', 'NOW', 'NFLX', 'UBER', 'ABNB', 'CSCO', 'DELL', 'BRK.B', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'VZ', 'T', 'TMUS', 'LLY', 'WMT', 'JNJ', 'ABBV', 'CVX', 'KO', 'PG', 'BLK', 'UNH', 'MRK', 'CAT', 'LRCX', 'GE', 'AMAT', 'PM', 'HD', 'PANW', 'RTX', 'TMO', 'TXN', 'GEV', 'AMGN', 'CRWD', 'LIN']);
/** The S&P 500's total market value at a date (Seeking Alpha's quarterly snapshot), carried to today with the index's
 * level: what the gains and stakes above are a share of. */
export const SPX_VALUE = { trillions: 68.45, on: '2026-09-30', source: 'Seeking Alpha, Fall 2026 snapshot of the S&P 500’s market cap (end of September 2026)' };

const us = (id: string, ...cik: number[]): Source => ({ id, cik, eod: `${id}.US` });

/** An IFRS company's yearly figures, read from its filed reports when the SEC summary lags. */
const IFRS_ANNUAL: Source['supplement'] = [
  { concept: 'ifrs-full:DilutedEarningsLossPerShare', as: 'DilutedEarningsLossPerShare' }, { concept: 'ifrs-full:Revenue', as: 'Revenue' },
  { concept: 'ifrs-full:ProfitLossAttributableToOwnersOfParent', as: 'ProfitLossAttributableToOwnersOfParent' },
  { concept: 'ifrs-full:CashAndCashEquivalents', as: 'CashAndCashEquivalents' },
];

export const SOURCES: Source[] = [
  us('TSLA', 1318605),
  { ...us('PLTR', 1321655), debtFree: true },
  us('COST', 909832),
  us('AAPL', 320193),
  us('NVDA', 1045810),
  us('MSFT', 789019),
  us('META', 1326801),
  // its latest annual report is missing from the SEC summary; read it from the filing
  { ...us('TSM', 1046179), fx: 'USDTWD.FOREX', perShare: 5, supplement: [{ concept: 'ifrs-full:DilutedEarningsLossPerShare', as: 'DilutedEarningsLossPerShare' }, { concept: 'ifrs-full:Revenue', as: 'Revenue' }, { concept: 'ifrs-full:RevenueFromContractsWithCustomers', as: 'Revenue' },
    // cash, and debt as bonds and bank loans (the current portion covers both)
    { concept: 'ifrs-full:ProfitLossAttributableToOwnersOfParent', as: 'ProfitLossAttributableToOwnersOfParent' },
    { concept: 'ifrs-full:CashAndCashEquivalents', as: 'CashAndCashEquivalents' }, { concept: 'ifrs-full:NoncurrentPortionOfNoncurrentBondsIssued', as: 'BondsNoncurrent' }, { concept: 'ifrs-full:LongtermBorrowings', as: 'BorrowingsNoncurrent' }, { concept: 'ifrs-full:CurrentPortionOfLongtermBorrowings', as: 'DebtCurrentPortion' }],
    balance: { debt: ['BondsNoncurrent', 'BorrowingsNoncurrent', 'DebtCurrentPortion'] } },
  // its gains on its stakes (Anthropic, Rivian) are filed only inside other income
  { ...us('AMZN', 1018724), gains: ['OtherNonoperatingIncomeExpense'] },
  us('ORCL', 1341439),
  // Google re-registered as Alphabet in 2015; its early profit per share is filed per share class
  // its SpaceX shares (listed in June 2026) sit among its marketable securities: a stake, not cash
  {
    ...us('GOOGL', 1288776, 1652044), stakesInCash: ['MarketableStakes'],
    supplement: [
      { concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted', member: 'ClassA' },
      { concept: 'us-gaap:EquitySecuritiesFvNi', as: 'MarketableStakes', member: '^us-gaap:FairValueMeasurementsRecurringMember$' },
    ],
  },
  us('XOM', 34088, 2115436),
  us('AVGO', 1730168),
  us('AMD', 2488),
  us('INTC', 50863),
  { ...us('ASML', 937966), fx: 'EURUSD.FOREX' },
  us('MU', 723125),
  us('CRM', 1108524),
  us('ADBE', 796343),
  us('NOW', 1373715),
  { ...us('SHOP', 1594805), debtFree: true },
  us('NFLX', 1065280),
  us('UBER', 1543151),
  us('ABNB', 1559720),
  us('CSCO', 858877),
  us('DELL', 1571996),
  // listed in June 2026: the 2025 full year is in its listing document, read from the filing
  // listed in June 2026: its share count is on its reports' cover page, by share class
  { ...us('SPCX', 1181412), supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted' }, { concept: 'us-gaap:NetIncomeLoss', as: 'NetIncomeLoss' }, { concept: 'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax', as: 'RevenueFromContractWithCustomerExcludingAssessedTax' }, { concept: 'dei:EntityCommonStockSharesOutstanding', as: 'EntityCommonStockSharesOutstanding', member: 'CommonClass' }] },
  // Berkshire reports profit per class A share; one class B share is 1/1500 of one
  // Its official profit swings with the paper gains on its stock holdings, so the board uses
  // operating profit: profit less investment gains, less the tax on them, all as filed.
  {
    id: 'BRK.B', cik: [1067983], eod: 'BRK-B.US', av: 'BRK-B', perShare: 1 / 1500, operating: true,
    balance: { cash: ['TreasuryBillsHeld'], debt: ['DebtInsuranceAndOther', 'DebtRailroadUtilities'] },
    supplement: [
      { concept: 'us-gaap:EarningsPerShareBasic', as: 'EarningsPerShareDiluted', member: 'ClassA' },
      // its cash pile is mostly US Treasury bills, and its debt is split between insurance and the railroad and utilities
      { concept: 'brka:USTreasuryBills', as: 'TreasuryBillsHeld', member: 'InsuranceAndOtherMember' },
      { concept: 'us-gaap:DebtAndCapitalLeaseObligations', as: 'DebtInsuranceAndOther', member: 'InsuranceAndOtherMember' },
      { concept: 'us-gaap:DebtAndCapitalLeaseObligations', as: 'DebtRailroadUtilities', member: 'RailroadUtilitiesAndEnergyMember' },
      { concept: 'us-gaap:NetIncomeLoss', as: 'NetIncomeLoss' },
      { concept: 'us-gaap:GainLossOnInvestments', as: 'InvestmentGains' },
      { concept: 'brka:GainLossOnInvestmentsAndGainLossOnDerivativeInstrumentsTax', as: 'InvestmentGainsTax', member: 'MaterialReconcilingItems' },
    ],
  },
  { ...us('JPM', 19617), keepGains: true },
  { ...us('BAC', 70858), keepGains: true },
  // profit per share is filed per share class; the board's shares are class A
  { ...us('V', 1403161), supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted', member: 'ClassA' }] },
  us('MA', 1141391),
  { ...us('WFC', 72971), keepGains: true },
  // the SEC summary lags Citigroup's recent quarters
  { ...us('C', 831001), keepGains: true, supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted' }] },
  { ...us('GS', 886982), keepGains: true },
  { ...us('MS', 895421), keepGains: true },
  us('VZ', 732712),
  us('T', 732717),
  // T-Mobile files its total debt under a breakdown (third-party debt), which the summary data leaves out
  { ...us('TMUS', 1283699), supplement: [{ concept: 'us-gaap:LongTermDebt', as: 'TotalDebt', member: '^tmus:TotalDebtMember$' }], balance: { debt: ['TotalDebt'] } },
  // the 50 largest S&P 500 companies by market value (October 2026), added to the earlier cards
  us('LLY', 59478),
  us('WMT', 104169),
  us('JNJ', 200406),
  us('ABBV', 1551152),
  us('CVX', 93410),
  us('KO', 21344),
  us('PG', 80424),
  us('BLK', 1364742, 2012383), // BlackRock re-registered in 2024
  us('UNH', 731766),
  us('MRK', 310158),
  // Caterpillar: the machinery business's debt only. Its finance arm borrows to lend to customers, like a bank
  { ...us('CAT', 18230), supplement: [{ concept: 'us-gaap:LongTermDebtAndCapitalLeaseObligations', as: 'DebtMachinery', member: 'MachineryPowerEnergyMember' }, { concept: 'us-gaap:LongTermDebtAndCapitalLeaseObligationsCurrent', as: 'DebtMachineryCurrent', member: 'MachineryPowerEnergyMember' }, { concept: 'us-gaap:ShortTermBorrowings', as: 'BorrowingMachinery', member: 'MachineryPowerEnergyMember' }], balance: { debt: ['DebtMachinery', 'DebtMachineryCurrent', 'BorrowingMachinery'] } },
  us('LRCX', 707549),
  us('GE', 40545),
  us('AMAT', 6951),
  us('PM', 1413329),
  us('HD', 354950),
  us('PANW', 1327567),
  us('RTX', 101829),
  us('TMO', 97745),
  us('TXN', 97476),
  // the gain on remeasuring its Prolec GE stake when it bought the rest ($4bn, early 2026), from its filed reports
  {
    ...us('GEV', 1996810), gains: ['StakeRemeasurementGain'],
    supplement: [{ concept: 'us-gaap:BusinessCombinationStepAcquisitionEquityInterestInAcquireeRemeasurementGain', as: 'StakeRemeasurementGain', member: 'ProlecGE' }],
  },
  us('AMGN', 318154),
  us('CRWD', 1535527),
  us('LIN', 1707925),
  // companies based outside the US, added October 2026. Toyota and Sony report in yen under IFRS; their latest annual
  // reports are missing from the SEC summary, so they're read from the filings too. One Toyota US share is ten of its
  // shares; one Alibaba US share is eight, one PDD (Temu) US share four.
  // Toyota split its shares five for one in October 2021: one US share was two shares before
  { ...us('TM', 1094517), fx: 'USDJPY.FOREX', perShare: 10, perShareEarlier: { filedBefore: '2021-10-01', perShare: 2 },
    // its US GAAP years (to March 2020) with its IFRS ones, so there's a decade of profit to compare
    supplement: [...IFRS_ANNUAL!, { concept: 'us-gaap:EarningsPerShareDiluted', as: 'DilutedEarningsLossPerShare' }] },
  // Sony: profit from its continuing businesses. Spinning off its finance arm (October 2025) put a ¥1.4 trillion loss
  // on discontinued operations in its year to March 2026, which would show Sony as losing money
  {
    ...us('SONY', 313838), fx: 'USDJPY.FOREX',
    supplement: [
      { concept: 'ifrs-full:DilutedEarningsLossPerShareFromContinuingOperations', as: 'DilutedEarningsLossPerShare' }, { concept: 'ifrs-full:Revenue', as: 'Revenue' },
      { concept: 'ifrs-full:ProfitLossFromContinuingOperationsAttributableToOwnersOfParent', as: 'ProfitLossAttributableToOwnersOfParent' },
      { concept: 'ifrs-full:CashAndCashEquivalents', as: 'CashAndCashEquivalents' },
    ],
  },
  { ...us('RACE', 1648416), fx: 'EURUSD.FOREX' },
  { ...us('BABA', 1577552), fx: 'USDCNY.FOREX', perShare: 8, perShareEarlier: { filedBefore: '2019-07-30', perShare: 1 } },
  { ...us('PDD', 1737806), fx: 'USDCNY.FOREX', perShare: 4 },
  // Wise trades on Nasdaq as WSE (since May 2026), and files its profit per share in cents
  { ...us('WSE', 2099039), perShare: 0.01 },
  us('TEAM', 1650372),
  us('ARM', 1973239),
];
