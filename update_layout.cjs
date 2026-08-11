const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// replace first logout
content = content.replace(/<button\s+onClick=\{\(\) => signOut\(\)\}\s+className="w-full flex items-center justify-center gap-2[\s\S]*?<\/button>/m, '');

// replace second logout
content = content.replace(/\{?\/\* Direct Logout Button \*\/\}?\n?\s*<button\s+onClick=\{\(\) => signOut\(\)\}[\s\S]*?<\/button>/m, '');

// replace third logout (in dropdown)
content = content.replace(/<div className="border-t border-slate-100">\s*<button\s+onClick=\{\(\) => \{ setRoleMenuOpen\(false\); signOut\(\); \}\}[\s\S]*?<\/button>\s*<\/div>/m, '');

fs.writeFileSync('src/components/Layout.tsx', content);
