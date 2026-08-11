const fs = require('fs');

// ----- MOBILE PAGE -----
let mob = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

// 1. Restore Cashier Search and remove arbitrary selection
const mobileCashierSearch = `                  {!cashierCustId ? (
                     <div className="relative">
                       <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <Input placeholder="ابحث باسم العميل أو الجوال" value={cashierSearch} onChange={(e) => setCashierSearch(e.target.value)} className="pr-10" />
                       {cashierSearch && (
                         <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                           {customers.filter(c => c.name.includes(cashierSearch) || (c.phone ?? '').includes(cashierSearch)).slice(0, 5).map(c => (
                             <button key={c.id} onClick={() => { setCashierCustId(c.id); setCashierSearch(''); }} className="w-full text-right px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                               <p className="text-sm font-medium text-slate-700">{c.name}</p>
                               <p className="text-xs text-slate-400">{c.phone}</p>
                             </button>
                           ))}
                           {customers.filter(c => c.name.includes(cashierSearch) || (c.phone ?? '').includes(cashierSearch)).length === 0 && (
                             <div className="p-3 text-sm text-center text-slate-500">لا يوجد عميل بهذا الاسم. يرجى إضافته من إدارة العملاء.</div>
                           )}
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

mob = mob.replace(
  /<Select value=\{cashierCustId\}.*?<\/Select>/s,
  mobileCashierSearch
);

// 2. Restore Modal Search and remove arbitrary selection
const mobileModalSearch = `               {!selectedCustomerId ? (
                 <div className="relative">
                   <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <Input placeholder="ابحث باسم العميل أو الجوال" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pr-10" />
                   {customerSearch && (
                     <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white">
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
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).length === 0 && (
                         <div className="p-3 text-sm text-center text-slate-500">لا يوجد عميل بهذا الاسم. يرجى إضافته من إدارة العملاء.</div>
                       )}
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

mob = mob.replace(
  /<Select value=\{selectedCustomerId\}.*?<\/Select>/s,
  mobileModalSearch
);

fs.writeFileSync('src/pages/MobilePage.tsx', mob);

// ----- JOB CARDS PAGE -----
let jc = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

const jcSearchBlock = `               {!selectedCustomerId ? (
                 <div className="relative">
                   <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <Input placeholder="ابحث باسم العميل أو الجوال" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pr-10" />
                   {customerSearch && (
                     <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white absolute z-10 w-full shadow-lg">
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).slice(0, 5).map(c => (
                         <button key={c.id} onClick={() => { 
                             setSelectedCustomerId(c.id); 
                             setForm({...form, customerName: c.name, phone: c.phone || '', plate: c.plate_number || '', carType: c.vehicle_type ? c.vehicle_type + ' ' + (c.vehicle_brand || '') + ' ' + (c.vehicle_model || '') : ''}); 
                             setCustomerSearch(''); 
                         }} className="w-full text-right px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                           <p className="text-sm font-medium text-slate-700">{c.name}</p>
                           <p className="text-xs text-slate-400">{c.phone}</p>
                         </button>
                       ))}
                       {customers.filter(c => c.name.includes(customerSearch) || (c.phone ?? '').includes(customerSearch)).length === 0 && (
                         <div className="p-3 text-sm text-center text-slate-500">لا يوجد عميل بهذا الاسم. يرجى إضافته من إدارة العملاء.</div>
                       )}
                     </div>
                   )}
                 </div>
               ) : (`;

jc = jc.replace(
  /\{!selectedCustomerId \? \([\s\S]*?\) : \(/,
  jcSearchBlock
);

// We need to also disable the save button in Job Cards if selectedCustomerId is null, to force them to select an existing one.
// Let's modify the handleCreate button disable logic.
jc = jc.replace(
  /disabled=\{!form\.customerName \|\| !form\.phone \|\| !form\.carType \|\| formTotal === 0\}/,
  `disabled={!selectedCustomerId || !form.carType || formTotal === 0}`
);

// Do the same for Mobile Book button
mob = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');
mob = mob.replace(
  /disabled=\{!form\.customerName \|\| !form\.phone \|\| !form\.date \|\| !form\.time \|\| !form\.location\}/,
  `disabled={!selectedCustomerId || !form.date || !form.time || !form.location}`
);
fs.writeFileSync('src/pages/MobilePage.tsx', mob);

fs.writeFileSync('src/pages/JobCardsPage.tsx', jc);

