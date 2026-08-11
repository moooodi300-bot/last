const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf8');

content = content.replace(
  /if \(signUpRes\.error\) \{\n\s*return \{ error: signUpRes\.error\.message \};\n\s*\}/,
  `if (signUpRes.error) {
          if (signUpRes.error.message.toLowerCase().includes('rate limit')) {
             return { error: 'تم تجاوز الحد الأقصى للتسجيل (حماية من الحسابات الوهمية). يرجى تجربة الحساب الأول (أحمد) لأنه مسجل مسبقاً.' };
          }
          return { error: signUpRes.error.message };
        }`
);

fs.writeFileSync('src/lib/auth.tsx', content);
