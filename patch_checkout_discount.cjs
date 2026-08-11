const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldCode = `    if (hasActiveSub && customerSub) {
      total = cartTotal - washesCost;
      usedSubId = customerSub.id;
      notes = tr('subscriptionDeducted', lang);
    } else if (isFreeWash) {
      total = cartTotal - washesCost;
      isFree = true;
      notes = tr('free', lang);
    } else if (appliedDiscount) {
      total = cartTotal - discountAmount;
      notes = \`تم تطبيق كود الخصم: \${appliedDiscount.code}\`;
      incrementDiscountUsage(appliedDiscount.code, currentTenantId);
    }`;

const newCode = `    total = cartTotal;
    
    if (hasActiveSub && customerSub) {
      total -= washesCost;
      usedSubId = customerSub.id;
      notes = tr('subscriptionDeducted', lang);
    } else if (isFreeWash) {
      total -= washesCost;
      isFree = true;
      notes = tr('free', lang);
    }
    
    if (appliedDiscount) {
      total -= discountAmount;
      notes = notes ? \`\${notes} | خصم: \${appliedDiscount.code}\` : \`تم تطبيق كود الخصم: \${appliedDiscount.code}\`;
      incrementDiscountUsage(appliedDiscount.code, currentTenantId);
    }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/pages/SalesPage.tsx', code);
