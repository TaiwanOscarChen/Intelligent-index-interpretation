const YahooFinance = require('yahoo-finance2').default;
console.log('YahooFinance:', typeof YahooFinance);
try {
  const yahooFinance = new YahooFinance();
  console.log('Successfully created instance of YahooFinance');
  yahooFinance.quote('2330.TW')
    .then(res => console.log('success:', res.regularMarketPrice))
    .catch(err => console.error('error:', err));
} catch (e) {
  console.error('Failed to create instance:', e);
}
