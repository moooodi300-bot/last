const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
  "useEffect(() => { \n    loadVehicles(); \n    loadSubs(); \n  }, []);",
  "useEffect(() => { \n    loadVehicles(); \n    loadSubs(); \n  }, [organization?.id]);"
);

// If the above didn't match, maybe it's this:
if (!code.includes("useEffect(() => { \n    loadVehicles(); \n    loadSubs(); \n  }, [organization?.id]);")) {
   code = code.replace(
     /loadVehicles\(\);\s*loadSubs\(\);\s*\}, \[\]\);/m,
     "loadVehicles(); \n    loadSubs(); \n  }, [organization?.id]);"
   );
}

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
