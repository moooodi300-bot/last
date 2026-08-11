const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// We will add a new state for subscriptions
content = content.replace(
  /const \[loading, setLoading\] = useState\(false\);/,
  "const [loading, setLoading] = useState(false);\n  const [showSubsModal, setShowSubsModal] = useState(false);\n  const [subs, setSubs] = useState<any[]>([]);"
);

// We need a way to fetch and save subscriptions. Let's add a function to fetch.
content = content.replace(
  /const handleSave = async \(\) => \{/,
  `const loadSubs = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: true });
    if (data) setSubs(data);
  };
  
  // Call loadSubs on mount
  useState(() => { loadSubs(); });
  
  const handleSave = async () => {`
);

// Let's add the button in the UI
content = content.replace(
  /<div className="p-4 bg-purple-50 border border-purple-100 rounded-xl mt-4">/,
  `<div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mt-4">
                      <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
                         <Star className="w-4 h-4" /> باقات اشتراكات العملاء
                      </h4>
                      <p className="text-xs text-emerald-700 mb-3">إدارة باقات الغسيل (مثلاً: 500 ريال مدة شهر لـ 30 غسلة)</p>
                      <Button variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => setShowSubsModal(true)}>
                         تعديل باقات الاشتراكات
                      </Button>
                   </div>
                   
                   <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl mt-4">`
);

// Let's add the modal at the end of the return statement
content = content.replace(
  /<\/div>\n    <\/div>\n  \);\n\}/,
  `</div>
    </div>
    
    {showSubsModal && (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
           <h3 className="text-xl font-bold mb-4">باقات اشتراكات العملاء</h3>
           <p className="text-sm text-slate-500 mb-6">أضف باقات الاشتراكات لتتمكن من بيعها للعملاء.</p>
           
           <div className="space-y-4 mb-6">
             {subs.map(sub => (
               <div key={sub.id} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50">
                 <div>
                   <h4 className="font-bold text-slate-800">{sub.name}</h4>
                   <p className="text-xs text-slate-500">{sub.monthly_price} ريال / شهر • {sub.washes_included} غسلة</p>
                 </div>
                 <button onClick={async () => {
                    if(confirm('هل أنت متأكد من حذف الباقة؟')) {
                      await supabase.from('subscriptions').delete().eq('id', sub.id);
                      loadSubs();
                    }
                 }} className="text-rose-500 text-sm font-bold">حذف</button>
               </div>
             ))}
             
             {subs.length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد باقات حالياً</p>}
           </div>
           
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm mb-3">إضافة باقة جديدة</h4>
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 const name = fd.get('name') as string;
                 const price = Number(fd.get('price'));
                 const washes = Number(fd.get('washes'));
                 if(!name || price <= 0 || washes <= 0) return;
                 
                 await supabase.from('subscriptions').insert({
                   name, monthly_price: price, washes_included: washes, active: true
                 });
                 (e.target as HTMLFormElement).reset();
                 loadSubs();
              }} className="space-y-3">
                 <div><Label>اسم الباقة (مثال: اشتراك بلاتيني)</Label><Input name="name" required /></div>
                 <div className="grid grid-cols-2 gap-3">
                    <div><Label>السعر الشهري (ريال)</Label><Input name="price" type="number" required /></div>
                    <div><Label>عدد الغسلات</Label><Input name="washes" type="number" required /></div>
                 </div>
                 <Button type="submit" className="w-full">إضافة الباقة</Button>
              </form>
           </div>
           
           <Button variant="outline" className="w-full mt-4" onClick={() => setShowSubsModal(false)}>إغلاق</Button>
        </div>
      </div>
    )}
  );
}`
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
