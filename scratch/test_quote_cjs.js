const yahooFinance = require('yahoo-finance2').default;

async function test() {
  try {
    const res = await yahooFinance.quote(['2330.TW', '2454.TW', '^VIX']);
    console.log('Results length:', res.length);
    res.forEach((r) => {
      console.log('Result:', r.symbol, r.regularMarketPrice);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
