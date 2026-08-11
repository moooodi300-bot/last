const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');
content = content.replace(/<Button onClick=\{handleSave\} className="bg-cyan-600 font-bold px-8">/g, '<Button onClick={handleSave} disabled={loading} className="bg-cyan-600 font-bold px-8">');
fs.writeFileSync('src/pages/SettingsPage.tsx', content);
