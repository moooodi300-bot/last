const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const topbarReplacement = `
            {/* Direct Logout Button */}
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title={tr('logout', lang)}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr('logout', lang)}</span>
            </button>

            {/* Role switcher */}`;

content = content.replace(/\n\s*\{\/\* Role switcher \*\/\}/m, topbarReplacement);

fs.writeFileSync('src/components/Layout.tsx', content);
