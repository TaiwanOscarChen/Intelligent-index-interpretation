const yahooFinance = require('yahoo-finance2').default;
console.log('yahooFinance is:', typeof yahooFinance, Object.keys(yahooFinance || {}));
yahooFinance.quote('2330.TW').then(res => console.log('success:', res.regularMarketPrice)).catch(err => console.error('error:', err));
