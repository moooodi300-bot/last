const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

if (!code.includes('import { validateAndCalculateDiscount, incrementDiscountUsage }')) {
  code = code.replace(
    /import \{ mergeCustomerLists, saveLocalCustomer \} from '@\/lib\/customerStore';/,
    `import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';\nimport { validateAndCalculateDiscount, incrementDiscountUsage, DiscountCode } from '@/lib/discountStore';`
  );
}

// Add state variables
code = code.replace(
  /const \[cashAmount, setCashAmount\] = useState\(0\);/,
  `const [cashAmount, setCashAmount] = useState(0);\n  const [discountCode, setDiscountCode] = useState('');\n  const [discountAmount, setDiscountAmount] = useState(0);\n  const [discountError, setDiscountError] = useState('');\n  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);`
);

// Apply discount validation when code changes or checkout opens
const handleDiscountCodeBlock = `  const applyDiscount = () => {
    if (!discountCode) {
      setDiscountAmount(0);
      setDiscountError('');
      setAppliedDiscount(null);
      return;
    }
    const res = validateAndCalculateDiscount(discountCode, cartTotal, currentTenantId);
    if (res.valid && res.discount) {
      setDiscountAmount(res.discountAmount);
      setDiscountError('');
      setAppliedDiscount(res.discount);
    } else {
      setDiscountAmount(0);
      setDiscountError(res.error || '');
      setAppliedDiscount(null);
    }
  };`;

// We'll insert this just before `const checkout = async () => {`
code = code.replace(
  /const checkout = async \(\) =\> \{/,
  `${handleDiscountCodeBlock}\n\n  const checkout = async () => {`
);

// In checkout:
// Update total calculation and save discount info
const checkoutTotalBlock = `    let total = cartTotal;
    let isFree = false;
    let usedSubId: string | null = null;
    let notes: string | null = null;

    if (hasActiveSub && customerSub) {
      total = 0;
      usedSubId = customerSub.id;
      notes = tr('subscriptionDeducted', lang);
    } else if (isFreeWash) {
      total = 0;
      isFree = true;
      notes = tr('free', lang);
    } else if (appliedDiscount) {
      total = cartTotal - discountAmount;
      notes = \`تم تطبيق كود الخصم: \${appliedDiscount.code}\`;
      incrementDiscountUsage(appliedDiscount.code, currentTenantId);
    }`;

code = code.replace(
  /let total = cartTotal;[\s\S]*?notes = tr\('free', lang\);\n    \}/,
  checkoutTotalBlock
);

// We need to inject discount fields into the new sale object.
// Wait, the new sale object has 'discount' field? In types.ts it might not, but let's add it to the local state.
code = code.replace(
  /total: total,\n          subtotal: cartTotal,\n          tax: 0,/,
  `total: total,
          subtotal: cartTotal,
          tax: 0,
          discount: discountAmount,
          discount_code: appliedDiscount?.code || null,`
);

// Update Checkout Modal UI
const checkoutModalBody = `        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="flex justify-between mb-2"><span className="text-slate-500">{tr('customer', lang)}</span><span className="font-medium">{selectedCustomer?.name ?? tr('noCustomerSelected', lang)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-slate-500">{tr('washCount', lang)}</span><span className="font-medium">{cartWashes}</span></div>
            <div className="flex justify-between mb-2"><span className="text-slate-500">{tr('paymentMethod', lang)}</span><span className="font-medium">{tr(paymentMethod, lang)}</span></div>
            {hasActiveSub && <div className="flex justify-between mb-2 text-cyan-600"><span>{tr('subscription', lang)}</span><span>{tr('subscriptionDeducted', lang)}</span></div>}
            {isFreeWash && <div className="flex justify-between mb-2 text-emerald-600"><span>{tr('free', lang)}</span><span>✓</span></div>}
            
            {!(hasActiveSub || isFreeWash) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <Label className="text-xs mb-1">كود الخصم (اختياري)</Label>
                <div className="flex gap-2">
                  <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="أدخل الكود" className="text-sm h-9 flex-1" />
                  <Button variant="secondary" onClick={applyDiscount} className="h-9 px-3 text-sm">تطبيق</Button>
                </div>
                {discountError && <p className="text-xs text-rose-500 mt-1">{discountError}</p>}
                {appliedDiscount && <p className="text-xs text-emerald-600 mt-1">تم تطبيق الخصم: {formatSAR(discountAmount, lang)}</p>}
              </div>
            )}

            <div className="flex justify-between pt-3 mt-3 border-t border-slate-200">
               <div className="space-y-1">
                 <span className="font-bold">{tr('total', lang)}</span>
                 {appliedDiscount && <div className="text-xs text-slate-500 line-through">{formatSAR(cartTotal, lang)}</div>}
               </div>
               <span className="font-bold text-lg text-emerald-700">{formatSAR(hasActiveSub || isFreeWash ? 0 : (cartTotal - discountAmount), lang)}</span>
            </div>
          </div>
          <Button onClick={checkout} disabled={processing} className="w-full">{processing ? tr('processing', lang) : tr('confirmAndInvoice', lang)}</Button>
        </div>`;

code = code.replace(
  /<div className="space-y-4">\n          <div className="p-4 rounded-xl bg-slate-50">[\s\S]*?<\/Button>\n        <\/div>/,
  checkoutModalBody
);

// Reset discount when closing modal or clearing cart
code = code.replace(
  /setLoyaltyMsg\(null\);/,
  `setLoyaltyMsg(null);\n    setDiscountCode('');\n    setDiscountAmount(0);\n    setDiscountError('');\n    setAppliedDiscount(null);`
);

// Also reset on close
code = code.replace(
  /onClose=\{\(\) =\> setShowCheckout\(false\)\}/,
  `onClose={() => { setShowCheckout(false); setDiscountCode(''); setDiscountAmount(0); setDiscountError(''); setAppliedDiscount(null); }}`
);

// Add discount info to Invoice Print
const invoiceDiscountBlock = `            {lastCustomer.phone && <span className="font-mono dir-ltr text-slate-600">{lastCustomer.phone}</span>}
          </div>
        </div>
      )}
      <div className="border-t border-b border-slate-200 py-3 mb-3 text-sm space-y-2">
        <div className="flex justify-between"><span>الإجمالي قبل الخصم:</span><span>{lastSale.subtotal} ريال</span></div>
        {lastSale.discount > 0 && <div className="flex justify-between text-rose-600"><span>الخصم {lastSale.discount_code ? \`(\${lastSale.discount_code})\` : ''}:</span><span>- {lastSale.discount} ريال</span></div>}
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200"><span>الإجمالي النهائي:</span><span>{lastSale.total} ريال</span></div>
      </div>
      <div className="text-center text-xs text-slate-500 mb-6">`;

code = code.replace(
  /\{lastCustomer\.phone && <span className="font-mono dir-ltr text-slate-600">\{lastCustomer\.phone\}<\/span>\}\n          <\/div>\n        <\/div>\n      \)\}\n      <div className="border-t border-slate-200 mt-4 pt-4 text-center font-bold text-lg mb-6">\n        الإجمالي: \{lastSale\.total\} ريال\n      <\/div>\n      <div className="text-center text-xs text-slate-500 mb-6">/,
  invoiceDiscountBlock
);


fs.writeFileSync('src/pages/SalesPage.tsx', code);
