const fs = require('fs');
let content = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

// The block I accidentally inserted in printShiftReport:
const accidentalBlock = `
    const originalTotal = lastInvoiceItems.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmt = originalTotal - lastInvoice.total;
    const hasDiscount = discountAmt > 0 && lastInvoice.total > 0;
    const discountInfo = hasDiscount ? \`
            <div class="row" style="font-size:12px;color:#64748b;margin-bottom:4px;">
              <span>الإجمالي قبل الخصم:</span>
              <span style="text-decoration:line-through;">\$\{formatSAR(originalTotal, lang)\}</span>
            </div>
            <div class="row" style="font-size:12px;color:#ef4444;margin-bottom:6px;border-bottom:1px dashed #cbd5e1;padding-bottom:6px;">
              <span>قيمة الخصم:</span>
              <span>-\$\{formatSAR(discountAmt, lang)\}</span>
            </div>
    \` : '';
`;

content = content.replace(accidentalBlock, '');

// Now insert it in printInvoice properly
const beforeWriteInvoice = `
    const originalTotal = lastInvoiceItems.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmt = originalTotal - lastInvoice.total;
    const hasDiscount = discountAmt > 0 && lastInvoice.total > 0;
    const discountInfo = hasDiscount ? \`
            <div class="row" style="font-size:12px;color:#64748b;margin-bottom:4px;">
              <span>الإجمالي قبل الخصم:</span>
              <span style="text-decoration:line-through;">\$\{formatSAR(originalTotal, lang)\}</span>
            </div>
            <div class="row" style="font-size:12px;color:#ef4444;margin-bottom:6px;border-bottom:1px dashed #cbd5e1;padding-bottom:6px;">
              <span>قيمة الخصم:</span>
              <span>-\$\{formatSAR(discountAmt, lang)\}</span>
            </div>
    \` : '';
    w.document.write(\`
      <!DOCTYPE html>
      <html dir="\${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>فاتورة #\${lastInvoice.id.slice(0, 8)}</title>
`;

content = content.replace(/w\.document\.write\(\`\s*<!DOCTYPE html>\s*<html dir="\$\{isRTL \? 'rtl' : 'ltr'\}">\s*<head>\s*<title>فاتورة #\$\{lastInvoice\.id\.slice\(0, 8\)\}<\/title>/m, beforeWriteInvoice);

fs.writeFileSync('src/pages/SalesPage.tsx', content);
