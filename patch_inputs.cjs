const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Replace value={X} with value={X ?? ''} but only inside <Input 
// Actually, let's just do it manually with regex.
code = code.replace(/<Input([^>]*)value=\{([^}]+)\}/g, (match, p1, p2) => {
  if (p2.includes("??") || p2.includes("||")) return match; // Already handled
  return `<Input${p1}value={${p2} ?? ''}`;
});

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
