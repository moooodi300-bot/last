const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

content = content.replace(
  /نظام رقم يقوم بأخذ نسخ احتياطية تلقائية ومشفرة لبياناتك\./,
  "نظام رقم يقوم بأخذ نسخ احتياطية تلقائية ومشفرة لبياناتك كل 3 أيام."
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
