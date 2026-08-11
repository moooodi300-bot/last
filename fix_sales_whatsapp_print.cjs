const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

const oldWhatsApp = `return \`أهلاً بك \${custName} 👋\\nنشكرك لزيارتك *\${company}* 🚗✨\\n\\n📄 *فاتورة خدمة رقم:* #\${lastInvoice.id.slice(0, 8)}\\n📅 *التاريخ:* \${formatDateTime(lastInvoice.created_at, lang)}\\n💳 *طريقة الدفع:* \${tr(lastInvoice.payment_method, lang)}\\n\\n*تفاصيل الخدمات:*\\n\${itemsList}\\n\\n💰 *الإجمالي النهائي:* \${formatSAR(lastInvoice.total, lang)}\\n\\nسعدنا بخدمتك وننتظر زيارتك القادمة! 🌟\`;`;
const newWhatsApp = `let text = \`أهلاً بك \${custName} 👋\\nنشكرك لزيارتك *\${company}* 🚗✨\\n\\n📄 *فاتورة خدمة رقم:* #\${lastInvoice.id.slice(0, 8)}\\n📅 *التاريخ:* \${formatDateTime(lastInvoice.created_at, lang)}\\n💳 *طريقة الدفع:* \${tr(lastInvoice.payment_method, lang)}\\n\\n*تفاصيل الخدمات:*\\n\${itemsList}\\n\\n\`;
    if ((lastInvoice as any).discount > 0) {
      text += \`🎁 *الخصم \${(lastInvoice as any).discount_code ? \`(\${(lastInvoice as any).discount_code})\` : ''}:* -\${(lastInvoice as any).discount} ريال\\n\`;
    }
    text += \`💰 *الإجمالي النهائي:* \${formatSAR(lastInvoice.total, lang)}\\n\\nسعدنا بخدمتك وننتظر زيارتك القادمة! 🌟\`;
    return text;`;

code = code.replace(oldWhatsApp, newWhatsApp);

const oldPrint = `<div class="row bold mt-2" style="font-size:14px;border-top:2px dashed #94a3b8;padding-top:8px;">
            <span>الإجمالي:</span>
            <span>\${formatSAR(lastInvoice.total, lang)}</span>
          </div>`;
const newPrint = `<div class="row mt-2" style="border-top:1px dashed #cbd5e1;padding-top:8px;">
            <span>الإجمالي قبل الخصم:</span>
            <span>\${formatSAR((lastInvoice as any).subtotal || lastInvoice.total, lang)}</span>
          </div>
          \${(lastInvoice as any).discount > 0 ? \`<div class="row" style="color: #e11d48; margin-top:2px;">
            <span>الخصم \${(lastInvoice as any).discount_code ? \`(\${(lastInvoice as any).discount_code})\` : ''}:</span>
            <span>- \${(lastInvoice as any).discount} ريال</span>
          </div>\` : ''}
          <div class="row bold" style="font-size:14px;border-top:2px dashed #94a3b8;padding-top:8px; margin-top:4px;">
            <span>الإجمالي النهائي:</span>
            <span>\${formatSAR(lastInvoice.total, lang)}</span>
          </div>`;

code = code.replace(oldPrint, newPrint);

fs.writeFileSync('src/pages/SalesPage.tsx', code);
