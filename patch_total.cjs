const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldCheckoutStart = `    if (hasActiveSub && customerSub) {
      total = 0;
      usedSubId = customerSub.id;
      notes = tr('subscriptionDeducted', lang);
    } else if (isFreeWash) {
      total = 0;
      isFree = true;
      notes = tr('free', lang);
    } else if (appliedDiscount) {`;

const newCheckoutStart = `    const isWash = (cat: string, isProd: boolean) => cat !== 'اشتراكات' && cat !== 'products' && !isProd;
    const washesCost = cart.reduce((s, i) => s + (isWash(i.service.category, !!(i.service as any).is_product) ? i.service.price * i.qty : 0), 0);
    
    if (hasActiveSub && customerSub) {
      total = cartTotal - washesCost;
      usedSubId = customerSub.id;
      notes = tr('subscriptionDeducted', lang);
    } else if (isFreeWash) {
      total = cartTotal - washesCost;
      isFree = true;
      notes = tr('free', lang);
    } else if (appliedDiscount) {`;

code = code.replace(oldCheckoutStart, newCheckoutStart);

const oldInvoiceItems = `    const invoiceItems = cart.map((i) => ({
      sale_id: finalSale.id,
      service_id: i.service.id,
      service_name: i.service.name,
      qty: i.qty,
      price: (hasActiveSub || isFree) ? 0 : i.service.price,
      line_total: (hasActiveSub || isFree) ? 0 : i.service.price * i.qty,
    }));`;

const newInvoiceItems = `    const invoiceItems = cart.map((i) => {
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

code = code.replace(oldInvoiceItems, newInvoiceItems);

fs.writeFileSync('src/pages/SalesPage.tsx', code);
