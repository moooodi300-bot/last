const fs = require('fs');
let content = fs.readFileSync('src/components/OnboardingWizard.tsx', 'utf8');

// Update facility state
content = content.replace(
  /const \[facility, setFacility\] = useState\(\{ name: 'مغسلتي', phone: '0501234567', vat: '', city: 'الرياض', district: '' \}\);/,
  "const [facility, setFacility] = useState({ name: 'مغسلتي', phone: '0501234567', vat: '', city: 'الرياض', district: '', cr: '', national_address: '' });"
);

// Update step 1 UI
content = content.replace(
  /<div className="grid grid-cols-2 gap-2">\n\s*<div><Label>المدينة \*\<\/Label><Input value=\{facility.city\}/,
  '<div><Label className="text-black font-bold">السجل التجاري (CR)</Label><Input value={facility.cr} onChange={e => setFacility({...facility, cr: e.target.value})} /></div>\n                     <div><Label className="text-black font-bold">العنوان الوطني</Label><Input value={facility.national_address} onChange={e => setFacility({...facility, national_address: e.target.value})} /></div>\n                     <div className="grid grid-cols-2 gap-2">\n                        <div><Label className="text-black font-bold">المدينة *</Label><Input value={facility.city}'
);

// Fix other labels in step 1 to be black
content = content.replace(
  /<Label>اسم المنشأة \/ المغسلة \*\<\/Label>/g,
  '<Label className="text-black font-bold">اسم المنشأة / المغسلة *</Label>'
);
content = content.replace(
  /<Label>رقم جوال المالك \(المدير\) \*\<\/Label>/g,
  '<Label className="text-black font-bold">رقم جوال المالك (المدير) *</Label>'
);
content = content.replace(
  /<Label>الرقم الضريبي \(VAT\)<\/Label>/g,
  '<Label className="text-black font-bold">الرقم الضريبي (VAT)</Label>'
);
content = content.replace(
  /<Label>الحي<\/Label>/g,
  '<Label className="text-black font-bold">الحي</Label>'
);

// Update step 2 breakeven colors
content = content.replace(
  /className="p-5 rounded-xl bg-cyan-950 text-white space-y-4"/,
  'className="p-5 rounded-xl border border-slate-200 bg-white text-black space-y-4 shadow-sm"'
);
content = content.replace(
  /<h4 className="font-bold text-cyan-300">نقطة التعادل التلقائية \(Breakeven\)<\/h4>/,
  '<h4 className="font-bold text-black text-lg">نقطة التعادل التلقائية (Breakeven)</h4>'
);
content = content.replace(
  /<Label className="text-cyan-100">سعر أقل خدمة غسيل<\/Label>/,
  '<Label className="text-black font-bold">سعر أقل خدمة غسيل</Label>'
);
content = content.replace(
  /<Input type="number" value=\{lowWash\} onChange=\{e => setLowWash\(Number\(e.target.value\)\)\} className="bg-cyan-900 border-cyan-700 text-white mt-1" \/>/,
  '<Input type="number" value={lowWash} onChange={e => setLowWash(Number(e.target.value))} className="mt-1 text-black font-bold" />'
);
content = content.replace(
  /<Label className="text-cyan-100">سعر أعلى خدمة غسيل<\/Label>/,
  '<Label className="text-black font-bold">سعر أعلى خدمة غسيل</Label>'
);
content = content.replace(
  /<Input type="number" value=\{highWash\} onChange=\{e => setHighWash\(Number\(e.target.value\)\)\} className="bg-cyan-900 border-cyan-700 text-white mt-1" \/>/,
  '<Input type="number" value={highWash} onChange={e => setHighWash(Number(e.target.value))} className="mt-1 text-black font-bold" />'
);
content = content.replace(
  /<div className="bg-cyan-900\/50 p-3 rounded-lg border border-cyan-800">/,
  '<div className="bg-slate-50 p-3 rounded-lg border border-slate-200">'
);
content = content.replace(
  /<div className="text-xs text-cyan-300 mb-1">متوسط سعر الغسيل<\/div>/,
  '<div className="text-xs font-bold text-slate-500 mb-1">متوسط سعر الغسيل</div>'
);
content = content.replace(
  /<div className="bg-cyan-900\/50 p-3 rounded-lg border border-cyan-800">/,
  '<div className="bg-rose-50 p-3 rounded-lg border border-rose-200">'
);
content = content.replace(
  /<div className="text-xs text-amber-300 mb-1">تحتاج يومياً \(للتغطية\)<\/div>/,
  '<div className="text-xs font-bold text-rose-600 mb-1">تحتاج يومياً (للتغطية)</div>'
);
content = content.replace(
  /<div className="font-black text-xl text-amber-400">\{dailyBreakEven\} سيارة<\/div>/,
  '<div className="font-black text-xl text-rose-700">{dailyBreakEven} سيارة</div>'
);
content = content.replace(
  /<Label className="text-cyan-100 mb-1">الهدف اليومي الطموح \(عدد السيارات المتوقع\)<\/Label>/,
  '<Label className="text-black font-bold mb-1">الهدف اليومي الطموح (عدد السيارات المتوقع)</Label>'
);
content = content.replace(
  /<Input type="number" value=\{expectedDaily\} onChange=\{e => setExpectedDaily\(Number\(e.target.value\)\)\} className="bg-cyan-900 border-cyan-700 text-white" \/>/,
  '<Input type="number" value={expectedDaily} onChange={e => setExpectedDaily(Number(e.target.value))} className="text-black font-bold" />'
);

// We need to also apply this to input texts in step 2 (costs section) 
content = content.replace(
  /className="flex-1 text-sm bg-white text-slate-900"/g,
  'className="flex-1 text-sm bg-white text-black font-semibold"'
);

fs.writeFileSync('src/components/OnboardingWizard.tsx', content);
