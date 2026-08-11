const fs = require('fs');
let code = fs.readFileSync('src/components/DiscountsSettings.tsx', 'utf8');
code = code.replace(/\\\`/g, '`');
code = code.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/DiscountsSettings.tsx', code);
