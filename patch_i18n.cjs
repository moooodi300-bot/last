const fs = require('fs');

let code = fs.readFileSync('src/lib/i18n.ts', 'utf8');

if (!code.includes('navJobcards')) {
  code = code.replace(
    /navPurchases: \{ ar: 'المشتريات', en: 'Purchases' \},/,
    "navPurchases: { ar: 'المشتريات', en: 'Purchases' },\n  navJobcards: { ar: 'كروت العمل', en: 'Job Cards' },"
  );
  fs.writeFileSync('src/lib/i18n.ts', code);
}
