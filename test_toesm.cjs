const __toESM = (mod, isNode) => {
  return mod && mod.__esModule ? mod : Object.create(null, {
    default: { value: mod, enumerable: true }
  });
};
const import_yahoo_finance2 = __toESM(require("yahoo-finance2"), 1);
console.log('import_yahoo_finance2:', typeof import_yahoo_finance2, Object.keys(import_yahoo_finance2));
console.log('import_yahoo_finance2.default:', typeof import_yahoo_finance2.default);
console.log('import_yahoo_finance2.default.default:', typeof import_yahoo_finance2.default.default);
const target = import_yahoo_finance2.default.default || import_yahoo_finance2.default;
console.log('target is:', typeof target);
try {
  const instance = new target();
  console.log('instance created successfully');
} catch (e) {
  console.error('instance creation failed:', e.message);
}
