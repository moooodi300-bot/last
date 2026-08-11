const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

if (!code.includes('import { mergeCustomerLists }')) {
    code = code.replace(
        "import { PageHeader, Card",
        "import { Search, UserPlus, X } from 'lucide-react';\nimport { mergeCustomerLists } from '@/lib/customerStore';\nimport type { Customer } from '@/lib/types';\nimport { PageHeader, Card"
    );
}

// Add state for customers
if (!code.includes('const [customers, setCustomers] = useState')) {
    code = code.replace(
        "const [assignVehicleId, setAssignVehicleId] = useState('');",
        "const [assignVehicleId, setAssignVehicleId] = useState('');\n  const [customers, setCustomers] = useState<Customer[]>([]);\n  const [customerSearch, setCustomerSearch] = useState('');\n  const [selectedCustomerId, setSelectedCustomerId] = useState('');"
    );
    
    code = code.replace(
        "if (saved) setVehicles(JSON.parse(saved));\n    } catch(e) {}",
        "if (saved) setVehicles(JSON.parse(saved));\n    } catch(e) {}\n    setCustomers(mergeCustomerLists([]));"
    );
}

// Replace the Add Booking modal body with customer search
const oldModalBody = `            <div className="grid grid-cols-2 gap-4">
               <div><Label>اسم العميل *</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} /></div>
               <div><Label>رقم الجوال *</Label><Input dir="ltr" className="text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>`;

const newModalBody = `            <div className="space-y-3">
               <Label>العميل *</Label>
               {!selectedCustomerId ? (
                 <div className="relative">
                   <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <Input placeholder="ابحث باسم العميل أو الجوال" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pr-10" />
                   {customerSearch && (
                     <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).slice(0, 5).map(c => (
                         <button key={c.id} onClick={() => { 
                             setSelectedCustomerId(c.id); 
                             setForm({...form, customerName: c.name, phone: c.phone || ''}); 
                             setCustomerSearch(''); 
                         }} className="w-full text-right px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
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
                     <p className="text-sm font-medium text-slate-700">{form.customerName}</p>
                     <p className="text-xs text-slate-500">{form.phone}</p>
                   </div>
                   <button onClick={() => { setSelectedCustomerId(''); setForm({...form, customerName: '', phone: ''}); }} className="text-xs text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                 </div>
               )}
            </div>`;

code = code.replace(oldModalBody, newModalBody);

// Make sure handleBook resets customer selection
code = code.replace(
    "setForm({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });",
    "setForm({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });\n    setSelectedCustomerId('');"
);

fs.writeFileSync('src/pages/MobilePage.tsx', code);
