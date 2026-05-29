const YahooFinanceClass = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceClass();
const { INITIAL_STOCKS } = require('../dist/server.cjs'); // wait, server.cjs might not be fully built or export INITIAL_STOCKS, let's just define a few or import it from src/initial_stocks.ts using tsx or just hardcode some or load from json

async function test() {
  const otcIds = new Set(["4966", "3529", "6138", "5347", "8299", "3324", "3363", "4979", "3163", "4908", "3081", "6640", "3680", "6274", "8069"]);
  // Let's load the 86 stocks from the source
  const fs = require('fs');
  const path = require('path');
  
  // We can read src/initial_stocks.ts and parse it using a regex or simple eval
  const tsContent = fs.readFileSync(path.join(__dirname, '../src/initial_stocks.ts'), 'utf8');
  const jsonMatch = tsContent.match(/export const INITIAL_STOCKS: StockBasicInfo\[] = (\[[\s\S]*?\]);/);
  if (!jsonMatch) {
    console.error('Could not find INITIAL_STOCKS in ts file');
    return;
  }
  
  // Clean up any TS types or export references if any, then parse
  // The JSON in initial_stocks.ts has double quotes and looks like standard JSON array
  let stocksStr = jsonMatch[1];
  // Remove possible trailing semicolons or comments
  stocksStr = stocksStr.replace(/;\s*$/, '');
  const stocks = JSON.parse(stocksStr);
  
  const tickers = [
    '^VIX', '^SOX',
    ...stocks.map(s => {
      const id = s.id;
      return otcIds.has(id) ? `${id}.TWO` : `${id}.TW`;
    })
  ];
  
  console.log(`Prepared ${tickers.length} tickers. Fetching...`);
  const startTime = Date.now();
  try {
    const res = await yahooFinance.quote(tickers);
    const elapsed = Date.now() - startTime;
    console.log(`Fetched ${res.length} quotes in ${elapsed}ms!`);
    console.log('Sample quote:', res[0].symbol, res[0].regularMarketPrice);
  } catch (err) {
    console.error('Error fetching all:', err);
  }
}

test();
