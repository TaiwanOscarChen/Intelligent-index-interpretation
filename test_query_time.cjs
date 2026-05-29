const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const keyTickers = ["^VIX", "^SOX"];
const stocks = [
  "2330", "2454", "2303", "3711", "2308", "3034", "2379", "3035", "4966", "3443", 
  "3661", "3529", "8016", "6138", "5347", "6770", "2408", "2344", "2449", "2301", 
  "2382", "2357", "3231", "2395", "4938", "2356", "6669", "3017", "3324", "3533", 
  "2059", "2421", "2376", "2324", "1504", "1513", "1519", "1503", "1605", "1609", 
  "2603", "2609", "2615", "2618", "2610", "2201", "2105", "1319", "1301", "1303", 
  "1326", "1101", "1102", "2002", "9910", "9921", "9914", "9904", "2912", "1216", 
  "5871", "2881", "2882", "2891", "2884", "9958", "1514", "2383", "6274", "3037", 
  "3189", "8069", "2492", "2327", "2353", "2354", "1402", "1590", "1802", "2601", 
  "3003", "3450", "6442", "2345", "5388", "6285", "3596", "3062", "2419", "4562", 
  "3019"
];

const otcIds = new Set([
  "4966", "3529", "6138", "5347", "8299", 
  "3324", "3363", "4979", "3163", "4908", 
  "3081", "6640", "3680", "6274", "8069"
]);

const stockTickers = stocks.map(id => otcIds.has(id) ? `${id}.TWO` : `${id}.TW`);
const tickersList = [...keyTickers, ...stockTickers];

console.log('Fetching', tickersList.length, 'tickers...');
const start = Date.now();
yahooFinance.quote(tickersList)
  .then(res => {
    console.log('Success in', Date.now() - start, 'ms. Count:', Array.isArray(res) ? res.length : 1);
  })
  .catch(err => {
    console.error('Failed in', Date.now() - start, 'ms. Error:', err.message);
  });
