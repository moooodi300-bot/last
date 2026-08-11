const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

content = content.replace(
  /    <\/div>\n    \n    \{showSubsModal/,
  '    {showSubsModal'
);

content = content.replace(
  /    \)\}\n  \);\n\}/,
  '    )}\n    </div>\n  );\n}'
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
