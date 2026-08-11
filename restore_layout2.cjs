const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const sidebarReplacement = `          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: \`linear-gradient(135deg, \${brand}, \${accent})\` }}>
              {staffName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{staffName}</p>
              <p className="text-xs text-slate-400">{roleLabel(role, lang)}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700 hover:border-rose-800"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            {tr('logout', lang)}
          </button>`;

content = content.replace(/          <div className="flex items-center gap-3">[\s\S]*?<\/div>\n          <\/div>\n          \n        <\/div>/m, sidebarReplacement + '\n        </div>');

fs.writeFileSync('src/components/Layout.tsx', content);
