const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/if \(\!session\) \{[\s\S]*?return <LoginPage onSignUpClick=\{\(\) => setIsSignUp\(true\)\} \/>;\n  \}/m, '');

fs.writeFileSync('src/App.tsx', content);
