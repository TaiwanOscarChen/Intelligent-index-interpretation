import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const res = await yahooFinance.quote(['2330.TW', '2454.TW', '^VIX']);
    console.log('Results length:', res.length);
    res.forEach((r: any) => {
      console.log('Result:', r.symbol, r.regularMarketPrice);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
