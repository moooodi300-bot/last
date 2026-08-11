const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldCode = `    const invoiceItems = cart.map((i) => {
      const isW = isWash(i.service.category, !!(i.service as any).is_product);
      const shouldZero = (hasActiveSub || isFree) && isW;
      return {
        sale_id: finalSale.id,
        service_id: i.service.id,
        service_name: i.service.name,
        qty: i.qty,
        price: shouldZero ? 0 : i.service.price,
        line_total: shouldZero ? 0 : i.service.price * i.qty,
      };
    });`;

const newCode = `    const invoiceItems = cart.map((i) => {
      const isW = isWash(i.service.category, !!(i.service as any).is_product);
      const shouldZero = (hasActiveSub || isFree) && isW;
      return {
        sale_id: finalSale.id,
        service_id: i.service.id,
        service_name: (shouldZero && hasActiveSub) ? \`\${i.service.name} (غسيل اشتراك)\` : i.service.name,
        qty: i.qty,
        price: shouldZero ? 0 : i.service.price,
        line_total: shouldZero ? 0 : i.service.price * i.qty,
      };
    });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/pages/SalesPage.tsx', code);
