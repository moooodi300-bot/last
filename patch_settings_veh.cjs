const fs = require('fs');

let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
  /{ id: '', name: '', worker_name: '', worker_phone: '', plate_number: '', type: 'car', working_hours: 8 }/g,
  "{ id: Math.random().toString(), name: '', worker_name: '', worker_phone: '', plate_number: '', type: 'car', working_hours: 8 }"
);
fs.writeFileSync('src/pages/SettingsPage.tsx', code);
