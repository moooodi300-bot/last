const fs = require('fs');

let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!code.includes('ClipboardList')) {
  code = code.replace(
    /Menu, X, ChevronDown, CreditCard, LogOut, MapPin,/,
    "Menu, X, ChevronDown, CreditCard, LogOut, MapPin, ClipboardList,"
  );
  code = code.replace(
    /BookOpen, UserCog, BarChart3, FileText, Settings: SettingsIcon, CreditCard,/,
    "BookOpen, UserCog, BarChart3, FileText, Settings: SettingsIcon, CreditCard, ClipboardList,"
  );
  fs.writeFileSync('src/components/Layout.tsx', code);
}
