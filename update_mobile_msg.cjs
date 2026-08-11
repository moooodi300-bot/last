const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

code = code.replace(
  "const { organization } = useAuth();",
  "const { organization, settings } = useAuth();"
);

code = code.replace(
  "let msg = `تم استلام الدفعة بنجاح",
  "const cName = settings?.company_name || 'المغسلة';\n                     let msg = `تم استلام الدفعة بنجاح"
);

code = code.replace(
  "فاتورة غسيل متنقل:\\nالعميل:",
  "فاتورة غسيل متنقل - ${cName}:\\nالعميل:"
);

fs.writeFileSync('src/pages/MobilePage.tsx', code);
