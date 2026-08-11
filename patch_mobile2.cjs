const fs = require('fs');

let code = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

// Update Interface
code = code.replace(
  "status: 'pending' | 'completed';",
  "status: 'pending' | 'assigned' | 'completed';\n  verificationCode?: string;"
);

// Form State update
code = code.replace(
  "const [form, setForm] = useState({ customerName: '', phone: '', location: '', date: '', time: '', service: '', vehicleId: '' });",
  "const [form, setForm] = useState({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });\n  const [assignAppId, setAssignAppId] = useState<string | null>(null);\n  const [assignVehicleId, setAssignVehicleId] = useState('');"
);

// handleBook update
const oldHandleBook = `const handleBook = () => {
    if (!form.customerName || !form.phone || !form.date || !form.time || !form.vehicleId) return;
    
    // Extract just the hour to compare (e.g., "10:00" -> "10")
    const formHour = form.time.split(':')[0];
    
    // Check if the same vehicle has an appointment on the same date and hour
    const isConflict = appointments.some(app => {
       if (app.vehicleId === form.vehicleId && app.date === form.date) {
          const appHour = app.time.split(':')[0];
          return appHour === formHour;
       }
       return false;
    });

    if (isConflict) {
       alert('لا يمكن حجز نفس المركبة في نفس الوقت. الرجاء اختيار مركبة أخرى أو وقت آخر.');
       return;
    }

    const newApp: Appointment = {
      id: Math.random().toString(),
      ...form,
      status: 'pending'
    };
    setAppointments([newApp, ...appointments]);
    setShowAddModal(false);
    setForm({ customerName: '', phone: '', location: '', date: '', time: '', service: '', vehicleId: '' });
  };`;

const newHandleBook = `const handleBook = () => {
    if (!form.customerName || !form.phone || !form.date || !form.time || !form.location) return;
    const vCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newApp: Appointment = {
      id: Math.random().toString(),
      ...form,
      verificationCode: vCode,
      status: 'pending'
    };
    setAppointments([newApp, ...appointments]);
    setShowAddModal(false);
    setForm({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });
    
    // Option to message customer with code
    if (confirm(\`تم الحجز برمز التحقق: \${vCode}. هل تريد إرسال الرمز للعميل عبر الواتساب؟\`)) {
      window.open(\`https://wa.me/\${form.phone}?text=مرحباً \${form.customerName}، تم تأكيد حجزك للغسيل المتنقل. رمز التحقق الخاص بك هو: \${vCode}. يرجى إعطاؤه للعامل بعد الانتهاء من الخدمة.\`, '_blank');
    }
  };`;

code = code.replace(oldHandleBook, newHandleBook);

// Update Modal Form
const oldModalForm = `<div>
               <Label>موقع العميل (الحي/العنوان) *</Label>
               <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>`;
const newModalForm = `<div>
               <Label>العنوان الوطني (4 حروف و 4 أرقام) *</Label>
               <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="مثال: ABCD1234" />
            </div>`;
code = code.replace("<div><Label>موقع العميل (الحي/العنوان) *</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>", newModalForm);

const vehicleSelectForm = `<div>
               <Label>مركبة الأسطول (العامل) *</Label>
               <Select value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
                  <option value="">-- اختر المركبة --</option>
                  {vehicles.map(v => (
                     <option key={v.id} value={v.id}>{v.name} - {v.worker_name}</option>
                  ))}
               </Select>
            </div>`;
code = code.replace(vehicleSelectForm, "");

code = code.replace(
  "disabled={!form.customerName || !form.phone || !form.date || !form.time || !form.vehicleId}",
  "disabled={!form.customerName || !form.phone || !form.date || !form.time || !form.location}"
);

// Remove the old notification text in Modal
code = code.replace(
  "<p>سيتم إرسال تنبيه آلي لعامل الأسطول عبر الواتساب فور تأكيد الحجز، يحتوي على بيانات الموعد ورقم جوال العميل للتواصل قبل التوجه.</p>",
  "<p>قم بتسجيل بيانات الحجز أولاً، ثم يمكنك توجيه الطلب للعامل لاحقاً من قائمة المواعيد.</p>"
);
code = code.replace(
  "تأكيد الحجز وإرسال التنبيه",
  "تأكيد الحجز"
);

// Table Actions
const tableActionsOld = `<td className="py-3 px-4">
                         <Button variant="outline" size="sm" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300">
                           <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> إنهاء الموعد
                         </Button>
                       </td>`;
const tableActionsNew = `<td className="py-3 px-4 flex flex-col gap-2">
                         {app.status === 'pending' && (
                           <Button variant="outline" size="sm" onClick={() => setAssignAppId(app.id)} className="text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                             توجيه للأسطول
                           </Button>
                         )}
                         {app.status === 'assigned' && (
                           <Button variant="outline" size="sm" onClick={() => {
                             setAppointments(appointments.map(a => a.id === app.id ? {...a, status: 'completed'} : a));
                             // optionally ask for verification code here in a real app
                           }} className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                             <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> إنهاء الموعد
                           </Button>
                         )}
                         {app.status === 'completed' && <span className="text-xs font-bold text-emerald-600">مكتمل</span>}
                       </td>`;
code = code.replace(tableActionsOld, tableActionsNew);

// Add Assign Modal
const assignModal = `
      <Modal open={!!assignAppId} onClose={() => setAssignAppId(null)} title="توجيه الموعد للأسطول" size="sm">
         <div className="space-y-4">
            <div>
               <Label>اختر المركبة / العامل</Label>
               <Select value={assignVehicleId} onChange={e => setAssignVehicleId(e.target.value)}>
                  <option value="">-- اختر المركبة --</option>
                  {vehicles.map(v => (
                     <option key={v.id} value={v.id}>{v.name} - {v.worker_name}</option>
                  ))}
               </Select>
            </div>
            <Button onClick={() => {
               if (!assignVehicleId) return;
               const app = appointments.find(a => a.id === assignAppId);
               const vehicle = vehicles.find(v => v.id === assignVehicleId);
               if (app && vehicle) {
                  setAppointments(appointments.map(a => a.id === assignAppId ? {...a, status: 'assigned', vehicleId: assignVehicleId} : a));
                  setAssignAppId(null);
                  setAssignVehicleId('');
                  
                  // Send to worker
                  const workerMsg = \`موعد غسيل متنقل جديد 🚗\\nالعميل: \${app.customerName}\\nالجوال: \${app.phone}\\nالعنوان الوطني: \${app.location}\\nالموعد: \${app.date} الساعة \${app.time}\\nالخدمة: \${app.service}\\n\\nالرجاء طلب رمز التحقق من العميل عند الانتهاء.\`;
                  window.open(\`https://wa.me/\${vehicle.worker_phone}?text=\${encodeURIComponent(workerMsg)}\`, '_blank');
               }
            }} disabled={!assignVehicleId} className="w-full bg-blue-600 hover:bg-blue-700">
               تأكيد وإرسال للعامل (واتساب)
            </Button>
         </div>
      </Modal>
`;

code = code.replace(
  "</Modal>\n    </div>\n  );\n}",
  "</Modal>\n" + assignModal + "    </div>\n  );\n}"
);

// Import MapPin if not present
if (!code.includes('MapPin')) {
  code = code.replace("import { Calendar, Clock", "import { Calendar, Clock, MapPin");
}

fs.writeFileSync('src/pages/MobilePage.tsx', code);
