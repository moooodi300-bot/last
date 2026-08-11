const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
  /useState\<'facility' \| 'services' \| 'costs' \| 'roles' \| 'fleet' \| 'loyalty' \| 'whatsapp' \| 'backup'\>\('facility'\);/,
  "useState<'facility' | 'services' | 'costs' | 'roles' | 'fleet' | 'loyalty' | 'whatsapp' | 'backup' | 'discounts'>('facility');"
);

// Add the tab button
const oldTabButtons = `        <button onClick={() => setActiveTab('backup')} className={\`whitespace-nowrap px-4 py-2 font-medium rounded-t-lg transition-colors \${activeTab === 'backup' ? 'bg-white text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-500 hover:text-slate-700'}\`}>النسخ الاحتياطي</button>
      </div>`;

const newTabButtons = `        <button onClick={() => setActiveTab('backup')} className={\`whitespace-nowrap px-4 py-2 font-medium rounded-t-lg transition-colors \${activeTab === 'backup' ? 'bg-white text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-500 hover:text-slate-700'}\`}>النسخ الاحتياطي</button>
        <button onClick={() => setActiveTab('discounts')} className={\`whitespace-nowrap px-4 py-2 font-medium rounded-t-lg transition-colors \${activeTab === 'discounts' ? 'bg-white text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-500 hover:text-slate-700'}\`}>أكواد الخصم</button>
      </div>`;

code = code.replace(oldTabButtons, newTabButtons);

// We need to render the Discounts tab content. Let's create a new component `DiscountsSettings` in src/components/DiscountsSettings.tsx
// Then import it and render it.

if (!code.includes('DiscountsSettings')) {
  code = code.replace(
    /import \{ RolesSettings \} from '@\/components\/RolesSettings';/,
    "import { RolesSettings } from '@/components/RolesSettings';\nimport { DiscountsSettings } from '@/components/DiscountsSettings';"
  );
  
  code = code.replace(
    /\{activeTab === 'backup' && \(/,
    "{activeTab === 'discounts' && (\n        <div className=\"space-y-6\">\n          <DiscountsSettings />\n        </div>\n      )}\n      {activeTab === 'backup' && ("
  );
}

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
