const fs = require('fs');
let content = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

content = content.replace(
  /\{!hasActiveSub && \(/g,
  `{loyaltyEnabled && !hasActiveSub && (`
);

content = content.replace(
  /\{selectedCustomer\.free_washes_earned > 0 && \(/g,
  `{loyaltyEnabled && selectedCustomer.free_washes_earned > 0 && (`
);

content = content.replace(
  /<p className="text-xs text-slate-400">\{c.plate_number\} • \{c.loyalty_stamps\}\/\{loyaltyTarget\}<\/p>/g,
  `<p className="text-xs text-slate-400">{c.plate_number} {loyaltyEnabled && \`• \${c.loyalty_stamps}/\${loyaltyTarget}\`}</p>`
);

fs.writeFileSync('src/pages/SalesPage.tsx', content);
