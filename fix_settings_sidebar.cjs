const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const backupButton = `<button onClick={() => setActiveTab('backup')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all \${activeTab === 'backup' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}\`}>
            <Database className="w-5 h-5" /> النسخ الاحتياطي
          </button>`;

const newButtons = `<button onClick={() => setActiveTab('discounts')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all \${activeTab === 'discounts' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}\`}>
            <Tag className="w-5 h-5" /> أكواد الخصم
          </button>
          ` + backupButton;

if (!content.includes("setActiveTab('discounts')")) {
  content = content.replace(backupButton, newButtons);
  fs.writeFileSync('src/pages/SettingsPage.tsx', content);
}
