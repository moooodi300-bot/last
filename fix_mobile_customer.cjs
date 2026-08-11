const fs = require('fs');
let content = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

// 1. Replace the cashier search block
const cashierSearchBlock = `                  {!cashierCustId ? (
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
                   )}`;

const newCashierBlock = `                  <Select value={cashierCustId} onChange={(e) => setCashierCustId(e.target.value)}>
                     <option value="">-- اختر العميل من القائمة --</option>
                     {customers.map(c => (
                       <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                     ))}
                  </Select>`;

content = content.replace(cashierSearchBlock, newCashierBlock);


// 2. Replace the modal search block
const modalSearchBlock = `               {!selectedCustomerId ? (
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
               )}`;

const newModalBlock = `               <Select value={selectedCustomerId} onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCustomerId(id);
                  const c = customers.find(x => x.id === id);
                  if (c) {
                     setForm({...form, customerName: c.name, phone: c.phone || ''});
                  } else {
                     setForm({...form, customerName: '', phone: ''});
                  }
               }}>
                  <option value="">-- اختر العميل من القائمة --</option>
                  {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
               </Select>`;

content = content.replace(modalSearchBlock, newModalBlock);

fs.writeFileSync('src/pages/MobilePage.tsx', content);
