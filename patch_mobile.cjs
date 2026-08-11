const fs = require('fs');

let code = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

if (!code.includes('vehicleId')) {
  // Add useEffect import if not there
  code = code.replace(/import \{ useState \} from 'react';/, "import { useState, useEffect } from 'react';");
  
  // Add vehicleId to interface
  code = code.replace(
    "service: string;",
    "service: string;\n  vehicleId?: string;"
  );
  
  // Update state form
  code = code.replace(
    "const [form, setForm] = useState({ customerName: '', phone: '', location: '', date: '', time: '', service: '' });",
    "const [form, setForm] = useState({ customerName: '', phone: '', location: '', date: '', time: '', service: '', vehicleId: '' });\n  const [vehicles, setVehicles] = useState<any[]>([]);\n  useEffect(() => {\n    try {\n      const saved = localStorage.getItem('mobile_vehicles');\n      if (saved) setVehicles(JSON.parse(saved));\n    } catch(e) {}\n  }, []);"
  );
  
  // Update handleBook
  code = code.replace(
    /const handleBook = \(\) => \{[\s\S]*?setForm\(\{ customerName: '', phone: '', location: '', date: '', time: '', service: '' \}\);\n  \};/,
    `const handleBook = () => {
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
  };`
  );

  // Update modal form to include vehicle select
  code = code.replace(
    /<div>\s*<Label>الخدمة المطلوبة<\/Label>[\s\S]*?<\/Select>\s*<\/div>/,
    `<div>
               <Label>الخدمة المطلوبة</Label>
               <Select value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                  <option value="">-- اختر الخدمة --</option>
                  <option value="غسيل متنقل VIP">غسيل متنقل VIP</option>
                  <option value="باقة اشتراك">باقة اشتراك شهري</option>
               </Select>
            </div>
            <div>
               <Label>مركبة الأسطول (العامل) *</Label>
               <Select value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
                  <option value="">-- اختر المركبة --</option>
                  {vehicles.map(v => (
                     <option key={v.id} value={v.id}>{v.name} - {v.worker_name}</option>
                  ))}
               </Select>
            </div>`
  );
  
  // Update disabled condition for button
  code = code.replace(
    /disabled=\{\!form\.customerName \|\| \!form\.phone \|\| \!form\.date \|\| \!form\.time\}/,
    "disabled={!form.customerName || !form.phone || !form.date || !form.time || !form.vehicleId}"
  );

  fs.writeFileSync('src/pages/MobilePage.tsx', code);
}
