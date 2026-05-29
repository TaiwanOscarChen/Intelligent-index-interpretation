const yfModule = require('yahoo-finance2');
console.log('yfModule keys:', Object.keys(yfModule));
console.log('yfModule default keys:', yfModule.default ? Object.keys(yfModule.default) : 'none');
console.log('yfModule default class prototype keys:', yfModule.default.prototype ? Object.keys(yfModule.default.prototype) : 'none');
