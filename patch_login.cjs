const fs = require('fs');
let code = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');
code = code.replace(/const \[clientCode, setClientCode\] = useState\(''\);/g, "");
code = code.replace(/phone/g, "email");
code = code.replace(/setPhone/g, "setEmail");
fs.writeFileSync('src/pages/LoginPage.tsx', code);
