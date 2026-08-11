const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(/<\/button>\n                    \}\)\)\}\n                    \n                  <\/div>/m, 
`</button>
                    ))}
                    <div className="border-t border-slate-100">
                      <button
                        onClick={() => { setRoleMenuOpen(false); signOut(); }}
                        className={\`w-full flex items-center gap-2 text-\${isRTL ? 'right' : 'left'} px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors\`}
                      >
                        <LogOut className="w-4 h-4" />
                        {tr('logout', lang)}
                      </button>
                    </div>
                  </div>`);

fs.writeFileSync('src/components/Layout.tsx', content);
