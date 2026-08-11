const fs = require('fs');

let code = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

if (!code.includes('import { mergeCustomerLists }')) {
    code = code.replace(
        "import { supabase } from '@/lib/supabase';",
        "import { supabase } from '@/lib/supabase';\nimport { mergeCustomerLists } from '@/lib/customerStore';\nimport type { Customer } from '@/lib/types';\nimport { Search, X } from 'lucide-react';"
    );
}

if (!code.includes('const [customers, setCustomers] = useState')) {
    code = code.replace(
        "const [availableServices, setAvailableServices] = useState<any[]>([]);",
        "const [availableServices, setAvailableServices] = useState<any[]>([]);\n  const [customers, setCustomers] = useState<Customer[]>([]);\n  const [customerSearch, setCustomerSearch] = useState('');\n  const [selectedCustomerId, setSelectedCustomerId] = useState('');\n  const [customItem, setCustomItem] = useState({ name: '', price: '' });"
    );
}

// Modify the initial load to also fetch customers
const oldUseEffect = `    const fetchServices = async () => {
      try {
        const { data } = await supabase.from('services').select('*');
        if (data && data.length > 0) {
          setAvailableServices(data);
        } else {
          setAvailableServices([
            { id: '1', name: 'غسيل خارجي', price: 35 },
            { id: '2', name: 'غسيل داخلي وخارجي', price: 50 },
            { id: '3', name: 'غسيل بخار', price: 80 },
            { id: '4', name: 'تلميع ساطع', price: 250 },
          ]);
        }
      } catch(e) {`;
      
const newUseEffect = `    const fetchServices = async () => {
      try {
        const { data } = await supabase.from('services').select('*');
        if (data && data.length > 0) {
          setAvailableServices(data.filter(d => d.active));
        } else {
          setAvailableServices([
            { id: '1', name: 'غسيل خارجي', price: 35 },
            { id: '2', name: 'غسيل داخلي وخارجي', price: 50 },
            { id: '3', name: 'غسيل بخار', price: 80 },
            { id: '4', name: 'تلميع ساطع', price: 250 },
          ]);
        }
        
        const custRes = await supabase.from('customers').select('*');
        setCustomers(mergeCustomerLists((custRes.data as Customer[]) ?? []));
        
      } catch(e) {`;

code = code.replace(oldUseEffect, newUseEffect);

// Replace Customer Data form
const oldCustForm = `              <h4 className="font-bold text-slate-800 border-b pb-2">بيانات العميل</h4>
              <div><Label>اسم العميل *</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} /></div>
              <div><Label>رقم الجوال *</Label><Input dir="ltr" className="text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="05XXXXXXXX" /></div>`;

const newCustForm = `              <h4 className="font-bold text-slate-800 border-b pb-2">بيانات العميل</h4>
               {!selectedCustomerId ? (
                 <div className="relative">
                   <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <Input placeholder="ابحث باسم العميل أو الجوال" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pr-10" />
                   {customerSearch && (
                     <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white absolute z-10 w-full shadow-lg">
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).slice(0, 5).map(c => (
                         <button key={c.id} onClick={() => { 
                             setSelectedCustomerId(c.id); 
                             setForm({...form, customerName: c.name, phone: c.phone || '', plate: c.plate_number || ''}); 
                             setCustomerSearch(''); 
                         }} className="w-full text-right px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                           <p className="text-sm font-medium text-slate-700">{c.name}</p>
                           <p className="text-xs text-slate-400">{c.phone}</p>
                         </button>
                       ))}
                     </div>
                   )}
                   <div className="mt-3 space-y-3">
                      <div><Label>اسم العميل *</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} /></div>
                      <div><Label>رقم الجوال *</Label><Input dir="ltr" className="text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="05XXXXXXXX" /></div>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                   <div>
                     <p className="text-sm font-medium text-slate-700">{form.customerName}</p>
                     <p className="text-xs text-slate-500">{form.phone}</p>
                   </div>
                   <button onClick={() => { setSelectedCustomerId(''); setForm({...form, customerName: '', phone: ''}); }} className="text-xs text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                 </div>
               )}`;

code = code.replace(oldCustForm, newCustForm);

// Add custom service block
const customBlock = `             </div>
             
             <div className="mt-4 pt-4 border-t border-slate-100">
                <Label className="mb-2">إضافة صنف/خدمة يدوية</Label>
                <div className="flex gap-2">
                   <Input placeholder="اسم الخدمة" value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} className="flex-1" />
                   <Input type="number" placeholder="السعر" value={customItem.price} onChange={e => setCustomItem({...customItem, price: e.target.value})} className="w-24" />
                   <Button variant="outline" onClick={() => {
                      if (customItem.name && customItem.price) {
                         const srv = { id: 'custom-' + Date.now(), name: customItem.name, price: Number(customItem.price) };
                         setAvailableServices([...availableServices, srv]);
                         setForm({...form, selectedServices: [...form.selectedServices, srv]});
                         setCustomItem({ name: '', price: '' });
                      }
                   }} className="bg-slate-100">إضافة</Button>
                </div>
             </div>`;
             
code = code.replace("</div>\n          </div>", customBlock + "\n          </div>");

// Update handleCreate
const createReset = "setForm({ customerName: '', phone: '', carType: '', plate: '', mileage: '', notes: '', photosCount: 0, selectedServices: [] });";
code = code.replace(createReset, createReset + "\n    setSelectedCustomerId('');\n    const msg = `تم استلام مركبتك بنجاح في مركز الخدمة 🚗\\nرقم الكرت: ${newCard.id}\\nالمركبة: ${newCard.carType}\\nنحن نهتم بسيارتك!`;\n    window.open(`https://wa.me/${newCard.phone}?text=${encodeURIComponent(msg)}`, '_blank');");

// Update handleChangeStatus
const changeStatusFn = `  const handleChangeStatus = (id: string, newStatus: 'in_progress' | 'paid', amt: number) => {
    const updated = cards.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCards(updated);
    localStorage.setItem('job_cards', JSON.stringify(updated));
    setViewCard(updated.find(c => c.id === id) || null);
    
    const card = updated.find(c => c.id === id);
    if (!card) return;
    
    if (newStatus === 'in_progress') {
       const msg = \`جاري العمل على سيارتك الآن 🔧✨\\nرقم الكرت: \${card.id}\\nسيتم إشعارك فور الانتهاء.\`;
       window.open(\`https://wa.me/\${card.phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
    } else if (newStatus === 'paid') {
       let srvs = card.services.map(s => \`- \${s.name}: \${s.price} ريال\`).join('\\n');
       const msg = \`تم الانتهاء من سيارتك وهي جاهزة للاستلام 🎉\\n\\nرقم الكرت: \${card.id}\\n\\nالخدمات المقدمة:\\n\${srvs}\\n\\nالإجمالي: \${card.totalAmount} ريال (شامل الضريبة)\\nشكراً لثقتكم بنا.\`;
       window.open(\`https://wa.me/\${card.phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
    }
  };`;

const oldStatusMatch = /const handleChangeStatus = [\s\S]*?setViewCard\(updated\.find\(c => c\.id === id\) \|\| null\);\n  };/;
code = code.replace(oldStatusMatch, changeStatusFn);

fs.writeFileSync('src/pages/JobCardsPage.tsx', code);
