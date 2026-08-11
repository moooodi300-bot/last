const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const newFleetUI = `          {activeTab === 'fleet' && (
             <Card className="border-0 shadow-sm">
                <CardBody className="p-6 space-y-5">
                   <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3 text-slate-800">
                     <PhoneCall className="w-5 h-5 text-cyan-600" /> إعداد أسطول الغسيل المتنقل
                   </h3>
                   <p className="text-sm text-slate-500">
                     أضف المركبات والعمالة الخاصة بها (بحد أقصى 50 مركبة).
                   </p>
                   
                   <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                     {vehicles.map((v, i) => (
                       <div key={v.id || i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 relative">
                         <div className="absolute top-2 left-2">
                           <button onClick={() => setVehicles(vehicles.filter((_, idx) => idx !== i))} className="text-rose-500 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm hover:bg-rose-50">حذف</button>
                         </div>
                         <h4 className="font-bold text-slate-700 text-sm">المركبة {i + 1}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div><Label>اسم المركبة</Label><Input value={v.name} onChange={e => { const arr=[...vehicles]; arr[i].name=e.target.value; setVehicles(arr); }} placeholder="مثال: سيارة 1" /></div>
                           <div><Label>اسم العامل</Label><Input value={v.worker_name} onChange={e => { const arr=[...vehicles]; arr[i].worker_name=e.target.value; setVehicles(arr); }} /></div>
                           <div><Label>رقم جوال العامل</Label><Input dir="ltr" value={v.worker_phone} onChange={e => { const arr=[...vehicles]; arr[i].worker_phone=e.target.value; setVehicles(arr); }} placeholder="05XXXXXXXX" /></div>
                           <div><Label>لوحة السيارة</Label><Input value={v.plate_number} onChange={e => { const arr=[...vehicles]; arr[i].plate_number=e.target.value; setVehicles(arr); }} placeholder="ABC 1234" /></div>
                           <div><Label>نوع المركبة</Label>
                             <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none" value={v.type} onChange={e => { const arr=[...vehicles]; arr[i].type=e.target.value; setVehicles(arr); }}>
                               <option value="car">سيارة</option>
                               <option value="motorcycle">دباب</option>
                               <option value="van">عربة</option>
                             </select>
                           </div>
                           <div><Label>ساعات العمل (يومياً)</Label><Input type="number" value={v.working_hours} onChange={e => { const arr=[...vehicles]; arr[i].working_hours=Number(e.target.value); setVehicles(arr); }} /></div>
                         </div>
                       </div>
                     ))}
                     {vehicles.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">لا توجد مركبات مضافة</p>}
                   </div>
                   
                   {vehicles.length < 50 && (
                     <Button variant="outline" onClick={() => setVehicles([...vehicles, { id: '', name: '', worker_name: '', worker_phone: '', plate_number: '', type: 'car', working_hours: 8 }])} className="w-full mt-2 border-dashed border-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                       إضافة مركبة جديدة +
                     </Button>
                   )}
                   
                   <div className="pt-4 flex justify-end">
                      <Button onClick={handleSaveVehicles} disabled={loading} className="bg-cyan-600 font-bold px-8"><Save className="w-4 h-4 ml-2" /> حفظ الأسطول</Button>
                   </div>
                </CardBody>
             </Card>
          )}`;

content = content.replace(
  /\{activeTab === 'fleet' && \([\s\S]*?\{\/\* END FLEET \*\/\}\)/, // Not present yet. Let's just do an index-based replace.
  ''
);
// I will replace it accurately.
const fleetStart = content.indexOf("{activeTab === 'fleet' && (");
let fleetEnd = content.indexOf("{activeTab === 'billing' && (");
if (fleetStart > -1 && fleetEnd > -1) {
  content = content.slice(0, fleetStart) + newFleetUI + '\n          ' + content.slice(fleetEnd);
}

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
