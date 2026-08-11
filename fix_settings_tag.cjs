const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
  /Trash2 \} from 'lucide-react';/,
  "Trash2, Tag } from 'lucide-react';"
);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
