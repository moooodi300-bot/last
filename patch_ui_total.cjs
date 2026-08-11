const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldWashes = "  const cartWashes = cart.reduce((s, i) => s + (i.service.category !== 'اشتراكات' && i.service.category !== 'products' && !(i.service as any).is_product ? i.qty : 0), 0);";
const newWashes = "  const cartWashes = cart.reduce((s, i) => s + (i.service.category !== 'اشتراكات' && i.service.category !== 'products' && !(i.service as any).is_product ? i.qty : 0), 0);\n  const washesCost = cart.reduce((s, i) => s + (i.service.category !== 'اشتراكات' && i.service.category !== 'products' && !(i.service as any).is_product ? i.service.price * i.qty : 0), 0);\n  const adjustedCartTotal = (hasActiveSub || isFreeWash) ? cartTotal - washesCost : cartTotal;";
code = code.replace(oldWashes, newWashes);

code = code.replace(
  "{hasActiveSub || isFreeWash ? formatSAR(0, lang) : formatSAR(cartTotal, lang)}",
  "{formatSAR(adjustedCartTotal, lang)}"
);

code = code.replace(
  "{formatSAR(hasActiveSub || isFreeWash ? 0 : (cartTotal - discountAmount), lang)}",
  "{formatSAR(adjustedCartTotal - discountAmount, lang)}"
);

// We should also always allow discount for non-wash items, so we should change `!(hasActiveSub || isFreeWash)` to `adjustedCartTotal > 0`
code = code.replace(
  "{!(hasActiveSub || isFreeWash) && (",
  "{adjustedCartTotal > 0 && ("
);

fs.writeFileSync('src/pages/SalesPage.tsx', code);
