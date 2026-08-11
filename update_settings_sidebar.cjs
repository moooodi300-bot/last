const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const backupButtonStr = `<button onClick={() => setActiveTab('backup')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all \${activeTab === 'backup' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}\`}>
            <Database className="w-5 h-5" /> النسخ الاحتياطي
          </button>`;

const newSidebar = `<button onClick={() => setActiveTab('discounts')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all \${activeTab === 'discounts' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}\`}>
            <Tag className="w-5 h-5" /> أكواد الخصم
          </button>
          <button onClick={() => setActiveTab('backup')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all \${activeTab === 'backup' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}\`}>
            <Database className="w-5 h-5" /> النسخ الاحتياطي
          </button>`;

code = code.replace(backupButtonStr, newSidebar);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
