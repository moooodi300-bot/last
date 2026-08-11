const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

code = code.replace(
  "const cartWashes = cart.reduce((s, i) => s + i.qty, 0);",
  "const cartWashes = cart.reduce((s, i) => s + (i.service.category !== 'اشتراكات' && i.service.category !== 'products' && !(i.service as any).is_product ? i.qty : 0), 0);"
);

code = code.replace(
  "const hasActiveSub = !!customerSub && (customerSub.washes_remaining ?? 0) > 0 && (!customerSub.end_date || new Date(customerSub.end_date) >= new Date());",
  "const hasActiveSub = !!customerSub && (customerSub.washes_remaining ?? 0) > 0 && (!customerSub.end_date || new Date(customerSub.end_date) >= new Date()) && cartWashes > 0;"
);

// We should also make sure that if a cart has a mix of washes and products, the subscription ONLY pays for the washes, not the products!
// Wait, currently if hasActiveSub is true, total = 0.
