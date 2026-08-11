const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const modalStart = content.indexOf("{showSubsModal && (");
if (modalStart > -1) {
  content = content.substring(0, modalStart) + "\n    </div>\n  );\n}";
}

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
