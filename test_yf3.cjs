const yf = require('yahoo-finance2');
console.log('yf is:', typeof yf, Object.keys(yf || {}));
console.log('yf.default is:', typeof yf.default);
