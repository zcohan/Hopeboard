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
  forecast?: false;
  /** Alpha Vantage's symbol when it differs from `id`. */
  av?: string;
  /** Figures read from the filed reports (see xbrl.ts), added to the SEC summary data under `as`. */
  supplement?: { concept: string; as: string; member?: string }[];
  /** Profit per share leaves out investment gains after their tax (Berkshire's operating profit). */
  operating?: boolean;
}

const us = (id: string, ...cik: number[]): Source => ({ id, cik, eod: `${id}.US` });

export const SOURCES: Source[] = [
  us('TSLA', 1318605),
  us('PLTR', 1321655),
  us('COST', 909832),
  us('AAPL', 320193),
  us('NVDA', 1045810),
  us('MSFT', 789019),
  us('META', 1326801),
  // its latest annual report is missing from the SEC summary; read it from the filing
  { ...us('TSM', 1046179), fx: 'USDTWD.FOREX', perShare: 5, supplement: [{ concept: 'ifrs-full:DilutedEarningsLossPerShare', as: 'DilutedEarningsLossPerShare' }, { concept: 'ifrs-full:Revenue', as: 'Revenue' }, { concept: 'ifrs-full:RevenueFromContractsWithCustomers', as: 'Revenue' }] },
  us('AMZN', 1018724),
  us('ORCL', 1341439),
  // Google re-registered as Alphabet in 2015; its early profit per share is filed per share class
  { ...us('GOOGL', 1288776, 1652044), supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted', member: 'ClassA' }] },
  us('XOM', 34088, 2115436),
  us('AVGO', 1730168),
  us('AMD', 2488),
  us('INTC', 50863),
  { ...us('ASML', 937966), fx: 'EURUSD.FOREX' },
  us('MU', 723125),
  us('CRM', 1108524),
  us('ADBE', 796343),
  us('NOW', 1373715),
  us('SHOP', 1594805),
  us('NFLX', 1065280),
  us('UBER', 1543151),
  us('ABNB', 1559720),
  us('CSCO', 858877),
  us('DELL', 1571996),
  // listed in June 2026: the 2025 full year is in its listing document, read from the filing
  { ...us('SPCX', 1181412), supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted' }, { concept: 'us-gaap:NetIncomeLoss', as: 'NetIncomeLoss' }, { concept: 'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax', as: 'RevenueFromContractWithCustomerExcludingAssessedTax' }] },
  // Berkshire reports profit per class A share; one class B share is 1/1500 of one
  // Its official profit swings with the paper gains on its stock holdings, so the board uses
  // operating profit: profit less investment gains, less the tax on them, all as filed.
  {
    id: 'BRK.B', cik: [1067983], eod: 'BRK-B.US', av: 'BRK-B', perShare: 1 / 1500, operating: true,
    supplement: [
      { concept: 'us-gaap:EarningsPerShareBasic', as: 'EarningsPerShareDiluted', member: 'ClassA' },
      { concept: 'us-gaap:NetIncomeLoss', as: 'NetIncomeLoss' },
      { concept: 'us-gaap:GainLossOnInvestments', as: 'InvestmentGains' },
      { concept: 'brka:GainLossOnInvestmentsAndGainLossOnDerivativeInstrumentsTax', as: 'InvestmentGainsTax', member: 'MaterialReconcilingItems' },
    ],
  },
  us('JPM', 19617),
  us('BAC', 70858),
  // profit per share is filed per share class; the board's shares are class A
  { ...us('V', 1403161), supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted', member: 'ClassA' }] },
  us('MA', 1141391),
  us('WFC', 72971),
  // the SEC summary lags Citigroup's recent quarters
  { ...us('C', 831001), supplement: [{ concept: 'us-gaap:EarningsPerShareDiluted', as: 'EarningsPerShareDiluted' }] },
  us('GS', 886982),
  us('MS', 895421),
  us('VZ', 732712),
  us('T', 732717),
  us('TMUS', 1283699),
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
  us('CAT', 18230),
  us('LRCX', 707549),
  us('GE', 40545),
  us('AMAT', 6951),
  us('PM', 1413329),
  us('HD', 354950),
  us('PANW', 1327567),
  us('RTX', 101829),
  us('TMO', 97745),
  us('TXN', 97476),
  us('GEV', 1996810),
  us('AMGN', 318154),
  us('CRWD', 1535527),
  us('LIN', 1707925),
];
