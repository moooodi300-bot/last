const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

// Imports
if (!code.includes('import { validateAndCalculateDiscount, incrementDiscountUsage }')) {
  code = code.replace(
    /import \{ mergeCustomerLists, saveLocalCustomer \} from '@\/lib\/customerStore';/,
    `import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';\nimport { validateAndCalculateDiscount, incrementDiscountUsage, DiscountCode } from '@/lib/discountStore';`
  );
}

// State
code = code.replace(
  /const \[vehicles, setVehicles\] = useState<any\[\]>\(\[\]\);/,
  `const [vehicles, setVehicles] = useState<any[]>([]);\n  const [discountCode, setDiscountCode] = useState('');\n  const [discountAmount, setDiscountAmount] = useState(0);\n  const [discountError, setDiscountError] = useState('');\n  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);`
);

// Discount apply function inside component
const discountFunc = `  const applyDiscount = () => {
    const total = cart.reduce((s, c) => s + (c.price * c.qty), 0);
    if (!discountCode) {
      setDiscountAmount(0);
      setDiscountError('');
      setAppliedDiscount(null);
      return;
    }
    const res = validateAndCalculateDiscount(discountCode, total, currentTenantId);
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

// We inject it before handleBook
code = code.replace(
  /const handleBook = \(\) =\> \{/,
  `${discountFunc}\n\n  const handleBook = () => {`
);

// UI block
const checkoutBlockOld = `                  <div className="pt-4 flex justify-between font-black text-xl text-cyan-400">
                    <span>الإجمالي</span>
                    <span>{cart.reduce((s, c) => s + (c.price * c.qty), 0)} ريال</span>
                  </div>
                  <Button disabled={!cashierCustId || cart.length === 0} onClick={() => {
                     const total = cart.reduce((s, c) => s + (c.price * c.qty), 0);
                     const cData = customers.find(c => c.id === cashierCustId);
                     const msg = \`تم استلام الدفعة بنجاح (بدون سداد مسبق)\\nفاتورة غسيل متنقل:\\nالعميل: \${cData?.name}\\nالمبلغ الإجمالي: \${total} ريال\\nشكراً لكم!\`;
                     window.open(\`https://wa.me/\${cData?.phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
                     setCart([]);
                     setCashierCustId('');
                  }} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 font-bold">إصدار الفاتورة وإرسال واتساب</Button>`;

const checkoutBlockNew = `                  <div className="pt-4 mt-4 border-t border-slate-700 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">كود الخصم</Label>
                      <div className="flex gap-2">
                        <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="أدخل الكود" className="bg-slate-800 text-white border-slate-700 flex-1" />
                        <Button variant="secondary" onClick={applyDiscount} className="px-3 bg-slate-700 hover:bg-slate-600 text-white border-none">تطبيق</Button>
                      </div>
                      {discountError && <p className="text-xs text-rose-500">{discountError}</p>}
                      {appliedDiscount && <p className="text-xs text-emerald-400">تم تطبيق خصم: {discountAmount} ريال</p>}
                    </div>

                    <div className="flex justify-between font-black text-xl text-cyan-400 pt-2">
                      <span>الإجمالي</span>
                      <div className="text-left">
                        {appliedDiscount && <div className="text-sm line-through text-slate-500">{cart.reduce((s, c) => s + (c.price * c.qty), 0)} ريال</div>}
                        <span>{cart.reduce((s, c) => s + (c.price * c.qty), 0) - discountAmount} ريال</span>
                      </div>
                    </div>
                  </div>
                  <Button disabled={!cashierCustId || cart.length === 0} onClick={() => {
                     const cartTotal = cart.reduce((s, c) => s + (c.price * c.qty), 0);
                     const finalTotal = cartTotal - discountAmount;
                     const cData = customers.find(c => c.id === cashierCustId);
                     let msg = \`تم استلام الدفعة بنجاح (بدون سداد مسبق)\\nفاتورة غسيل متنقل:\\nالعميل: \${cData?.name}\\nالإجمالي: \${cartTotal} ريال\`;
                     if (appliedDiscount) {
                       msg += \`\\nخصم (\${appliedDiscount.code}): -\${discountAmount} ريال\\nالصافي: \${finalTotal} ريال\`;
                       incrementDiscountUsage(appliedDiscount.code, currentTenantId);
                     }
                     msg += '\\nشكراً لكم!';
                     window.open(\`https://wa.me/\${cData?.phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
                     setCart([]);
                     setCashierCustId('');
                     setDiscountCode('');
                     setDiscountAmount(0);
                     setAppliedDiscount(null);
                  }} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 font-bold">إصدار الفاتورة وإرسال واتساب</Button>`;

code = code.replace(checkoutBlockOld, checkoutBlockNew);

fs.writeFileSync('src/pages/MobilePage.tsx', code);
