const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
  /useEffect\(\(\) => \{ \n    loadVehicles\(\); \n    loadSubs\(\); \n  \}, \[\]\);/g,
  "useEffect(() => { \n    loadVehicles(); \n    loadSubs(); \n  }, [organization?.id]);"
);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
