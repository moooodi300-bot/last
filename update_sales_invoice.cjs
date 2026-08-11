const fs = require('fs');
let content = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const totalCardPattern = /<div class="total-card">\s*<div class="row bold" style="font-size:15px;color:#0f172a;margin:0;">\s*<span>الإجمالي المدفوع:<\/span>\s*<span>\$\{formatSAR\(lastInvoice\.total, lang\)\}<\/span>\s*<\/div>\s*<\/div>/;

const replacement = `
        <%
          let originalTotal = lastInvoiceItems.reduce((sum, item) => sum + item.line_total, 0);
          let discountAmt = originalTotal - lastInvoice.total;
          let hasDiscount = discountAmt > 0 && lastInvoice.total > 0;
          let discountStr = '';
          if (hasDiscount) {
            // Try to extract discount code from notes
            let codeMatch = lastInvoice.notes ? lastInvoice.notes.match(/كود الخصم: ([A-Z0-9]+)/i) : null;
            let codeStr = codeMatch ? codeMatch[1] : 'قسيمة خصم';
            discountStr = \`
              <div class="row" style="font-size:13px;color:#64748b;margin-bottom:6px;">
                <span>الإجمالي قبل الخصم:</span>
                <span>\$\{formatSAR(originalTotal, lang)\}</span>
              </div>
              <div class="row" style="font-size:13px;color:#ef4444;margin-bottom:8px;border-bottom:1px dashed #cbd5e1;padding-bottom:8px;">
                <span>خصم (\$\{codeStr\}):</span>
                <span>-\$\{formatSAR(discountAmt, lang)\}</span>
              </div>
            \`;
          }
        %>
        <div class="total-card">
          \${hasDiscount ? \`
            <div class="row" style="font-size:12px;color:#64748b;margin-bottom:4px;">
              <span>الإجمالي قبل الخصم:</span>
              <span style="text-decoration:line-through;">\$\{formatSAR(lastInvoiceItems.reduce((s,i)=>s+i.line_total,0), lang)\}</span>
            </div>
            <div class="row" style="font-size:12px;color:#ef4444;margin-bottom:6px;border-bottom:1px dashed #cbd5e1;padding-bottom:6px;">
              <span>قيمة الخصم:</span>
              <span>-\$\{formatSAR(lastInvoiceItems.reduce((s,i)=>s+i.line_total,0) - lastInvoice.total, lang)\}</span>
            </div>
          \` : ''}
          <div class="row bold" style="font-size:15px;color:#0f172a;margin:0;">
            <span>\${hasDiscount ? 'الإجمالي بعد الخصم:' : 'الإجمالي المدفوع:'}</span>
            <span>\$\{formatSAR(lastInvoice.total, lang)\}</span>
          </div>
        </div>
`;

// we can't use <% %> in template strings directly like EJS, we just put the JS before the w.document.write
const jsBeforeWrite = `
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

const newTotalCard = `        <div class="total-card">
          \${discountInfo}
          <div class="row bold" style="font-size:15px;color:#0f172a;margin:0;">
            <span>\${hasDiscount ? 'الإجمالي بعد الخصم:' : 'الإجمالي المدفوع:'}</span>
            <span>\$\{formatSAR(lastInvoice.total, lang)\}</span>
          </div>
        </div>`;

content = content.replace(totalCardPattern, newTotalCard);
content = content.replace('w.document.write(`', jsBeforeWrite + '\n    w.document.write(`');

fs.writeFileSync('src/pages/SalesPage.tsx', content);
