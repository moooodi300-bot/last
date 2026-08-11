const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf8');

content = content.replace(/data = signUpRes.data;/, 'data = signUpRes.data as any;');

fs.writeFileSync('src/lib/auth.tsx', content);
