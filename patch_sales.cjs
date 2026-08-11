const fs = require('fs');

let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

// 1. Update loadData to merge local storage subscriptions
const loadDataFind = "const loadedSub = (s.data as Subscription[]) ?? [];";
const loadDataReplace = `const loadedSub = (s.data as Subscription[]) ?? [];
    let localSubs = [];
    try {
      const savedSubs = localStorage.getItem('subscriptions');
      if (savedSubs) localSubs = JSON.parse(savedSubs);
    } catch(e) {}
    const finalSubs = localSubs.length > 0 ? localSubs : (loadedSub.length > 0 ? loadedSub : SAMPLE_SUBSCRIPTIONS);`;

code = code.replace(loadDataFind, loadDataReplace);
code = code.replace(
  "setSubs(loadedSub.length > 0 ? loadedSub : SAMPLE_SUBSCRIPTIONS);",
  "setSubs(finalSubs);"
);

// 2. Update subForm state
code = code.replace(
  "const [subForm, setSubForm] = useState({ manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });",
  "const [subForm, setSubForm] = useState({ subscription_id: '', manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });"
);

// 3. Update addCarSubscription to use subForm.subscription_id
code = code.replace(
  "subscription_id: subs[0]?.id ?? null,",
  "subscription_id: subForm.subscription_id || (subs[0]?.id ?? null),"
);

// 4. Update the Modal content to add Subscription dropdown
const modalFind = "<div><Label>{tr('manualPrice', lang)} (ر.س) *</Label><Input type=\"number\" value={subForm.manual_price} onChange={(e) => setSubForm({ ...subForm, manual_price: Number(e.target.value) })} /></div>";
const modalReplace = `<div>
            <Label>اختر الباقة / الاشتراك</Label>
            <Select value={subForm.subscription_id} onChange={(e) => {
               const sub = subs.find(s => s.id === e.target.value);
               if (sub) {
                  setSubForm({ ...subForm, subscription_id: sub.id, manual_price: sub.monthly_price || 0, wash_limit: sub.washes_included || 0 });
               } else {
                  setSubForm({ ...subForm, subscription_id: e.target.value });
               }
            }}>
               <option value="">-- تخصيص يدوي --</option>
               {subs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.monthly_price} ريال - {s.washes_included} غسلة)</option>)}
            </Select>
          </div>
          <div><Label>{tr('manualPrice', lang)} (ر.س) *</Label><Input type="number" value={subForm.manual_price} onChange={(e) => setSubForm({ ...subForm, manual_price: Number(e.target.value) })} /></div>`;
code = code.replace(modalFind, modalReplace);

// 5. Update reset form
code = code.replace(
  "setSubForm({ manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });",
  "setSubForm({ subscription_id: '', manual_price: 0, car_type: '', car_color: '', plate_number: '', wash_limit: 0, start_date: new Date().toISOString().slice(0, 10), end_date: '' });"
);

// Fix "ولما تنتهي ما تظهر" -> filter customer_subscriptions by end_date being valid
code = code.replace(
  /const hasActiveSub = \!\!customerSub \&\& \(customerSub\.washes_remaining \?\? 0\) \> 0;/g,
  "const hasActiveSub = !!customerSub && (customerSub.washes_remaining ?? 0) > 0 && (!customerSub.end_date || new Date(customerSub.end_date) >= new Date());"
);

fs.writeFileSync('src/pages/SalesPage.tsx', code);
