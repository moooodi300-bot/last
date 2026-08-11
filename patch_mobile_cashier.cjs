const fs = require('fs');

let code = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

if (!code.includes('const [services, setServices] = useState')) {
   code = code.replace(
      "const [selectedCustomerId, setSelectedCustomerId] = useState('');",
      "const [selectedCustomerId, setSelectedCustomerId] = useState('');\n  const [services, setServices] = useState<any[]>([]);\n  const [cart, setCart] = useState<any[]>([]);\n  const [cashierCustId, setCashierCustId] = useState('');\n  const [cashierSearch, setCashierSearch] = useState('');"
   );
   
   code = code.replace(
      "if (saved) setVehicles(JSON.parse(saved));\n    } catch(e) {}\n    setCustomers(mergeCustomerLists([]));",
      "if (saved) setVehicles(JSON.parse(saved));\n    } catch(e) {}\n    setCustomers(mergeCustomerLists([]));\n    const loadSrvs = async () => {\n       const { data } = await supabase.from('services').select('*').eq('active', true);\n       if (data) setServices(data);\n    };\n    loadSrvs();"
   );
}

// Add supabase import if missing
if (!code.includes('import { supabase }')) {
    code = code.replace(
        "import { mergeCustomerLists }",
        "import { supabase } from '@/lib/supabase';\nimport { mergeCustomerLists }"
    );
}

// Re-write cashier tab
const oldCashierTab = `<div className="lg:col-span-2 space-y-4">
             <Card>
                <CardBody className="p-6 text-center text-slate-500">
                   <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p className="font-bold text-slate-700">تحديد العميل والخدمة</p>
                   <p className="text-sm">يرجى البحث عن العميل أو اختيار الاشتراك الشهري لخصم غسلة</p>
                </CardBody>
             </Card>
          </div>
          <div className="lg:col-span-1">
             <Card className="bg-slate-900 border-0 text-white">
                <CardBody className="p-6">
                  <h3 className="font-bold text-lg mb-4">ملخص الطلب المتنقل</h3>
                  <div className="space-y-3 pb-4 border-b border-slate-700">
                    <div className="flex justify-between text-slate-400 text-sm"><span>الخدمة الأساسية:</span> <span>-</span></div>
                    <div className="flex justify-between text-slate-400 text-sm"><span>رسوم التنقل:</span> <span>-</span></div>
                  </div>
                  <div className="pt-4 flex justify-between font-black text-xl text-cyan-400">
                    <span>الإجمالي</span>
                    <span>0 ريال</span>
                  </div>
                  <Button className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 font-bold">تأكيد وتحويل للأسطول</Button>
                </CardBody>
             </Card>
          </div>`;

const newCashierTab = `<div className="lg:col-span-2 space-y-4">
             <Card>
                <CardBody className="p-4">
                   <h4 className="font-bold text-slate-800 mb-3">تحديد العميل</h4>
                   {!cashierCustId ? (
                     <div className="relative">
                       <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <Input placeholder="ابحث باسم العميل أو الجوال" value={cashierSearch} onChange={(e) => setCashierSearch(e.target.value)} className="pr-10" />
                       {cashierSearch && (
                         <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                           {customers.filter(c => c.name.includes(cashierSearch) || (c.phone ?? '').includes(cashierSearch)).slice(0, 5).map(c => (
                             <button key={c.id} onClick={() => { setCashierCustId(c.id); setCashierSearch(''); }} className="w-full text-right px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                               <p className="text-sm font-medium text-slate-700">{c.name}</p>
                               <p className="text-xs text-slate-400">{c.phone}</p>
                             </button>
                           ))}
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                       <div>
                         <p className="text-sm font-medium text-slate-700">{customers.find(c => c.id === cashierCustId)?.name}</p>
                         <p className="text-xs text-slate-500">{customers.find(c => c.id === cashierCustId)?.phone}</p>
                       </div>
                       <button onClick={() => setCashierCustId('')} className="text-xs text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                     </div>
                   )}
                </CardBody>
             </Card>
             
             <Card>
                <CardBody className="p-4">
                   <h4 className="font-bold text-slate-800 mb-3">الخدمات المتوفرة</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {services.map(s => {
                        const inCart = cart.find(c => c.id === s.id);
                        return (
                          <div key={s.id} onClick={() => {
                             if (inCart) {
                               setCart(cart.filter(c => c.id !== s.id));
                             } else {
                               setCart([...cart, {...s, qty: 1}]);
                             }
                          }} className={\`p-3 border rounded-xl cursor-pointer transition-colors \${inCart ? 'bg-cyan-50 border-cyan-400' : 'bg-slate-50 border-slate-200 hover:border-cyan-300'}\`}>
                            <p className={\`text-sm font-bold \${inCart ? 'text-cyan-900' : 'text-slate-700'}\`}>{s.name}</p>
                            <p className="text-xs text-slate-500">{s.price} ريال</p>
                          </div>
                        )
                     })}
                   </div>
                </CardBody>
             </Card>
          </div>
          <div className="lg:col-span-1">
             <Card className="bg-slate-900 border-0 text-white">
                <CardBody className="p-6">
                  <h3 className="font-bold text-lg mb-4">ملخص الفاتورة المتنقلة</h3>
                  <div className="space-y-3 pb-4 border-b border-slate-700">
                    {cart.map(c => (
                      <div key={c.id} className="flex justify-between text-slate-300 text-sm">
                         <span>{c.name}</span>
                         <span>{c.price * c.qty} ريال</span>
                      </div>
                    ))}
                    {cart.length === 0 && <p className="text-slate-500 text-sm">لا توجد خدمات مضافة</p>}
                  </div>
                  <div className="pt-4 flex justify-between font-black text-xl text-cyan-400">
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
                  }} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 font-bold">إصدار الفاتورة وإرسال واتساب</Button>
                </CardBody>
             </Card>
          </div>`;
          
code = code.replace(oldCashierTab, newCashierTab);

fs.writeFileSync('src/pages/MobilePage.tsx', code);
