const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const oldLogic = `        // 1. Operating Expenses from Settings
        const appSettingsStr = localStorage.getItem('raqm_app_settings');
        if (appSettingsStr) {
          const appSettings = JSON.parse(appSettingsStr);
          if (appSettings.custom_costs) {
            const { costs2Y, costs1Y, costs1M } = appSettings.custom_costs;`;

const newLogic = `        // 1. Operating Expenses from Settings
        if (settings && (settings as any).custom_costs) {
          const { costs2Y, costs1Y, costs1M } = (settings as any).custom_costs;`;

code = code.replace(oldLogic, newLogic);
// Oh wait, one brace might be missing. Wait, `if (appSettingsStr)` matched one brace, and `if (settings)` matches one brace. 

code = code.replace(
  "}, [currentTenantId]);",
  "}, [currentTenantId, settings]);"
);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
