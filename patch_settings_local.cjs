const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// For Fleet
content = content.replace(
  /const loadVehicles = async \(\) => \{[\s\S]*?\}\n  \};/,
  `const loadVehicles = () => {
    try {
      const saved = localStorage.getItem('mobile_vehicles');
      if (saved) setVehicles(JSON.parse(saved));
    } catch(e) {}
  };`
);

content = content.replace(
  /const handleSaveVehicles = async \(\) => \{[\s\S]*?alert\('تم حفظ الأسطول بنجاح'\);\n  \};/,
  `const handleSaveVehicles = () => {
    localStorage.setItem('mobile_vehicles', JSON.stringify(vehicles));
    alert('تم حفظ الأسطول بنجاح');
  };`
);

// For Subscriptions
content = content.replace(
  /const loadSubs = async \(\) => \{[\s\S]*?if \(data\) setSubs\(data\);\n  \};/,
  `const loadSubs = () => {
    try {
      const saved = localStorage.getItem('subscriptions');
      if (saved) setSubs(JSON.parse(saved));
    } catch(e) {}
  };`
);

content = content.replace(
  /await supabase\.from\('subscriptions'\)\.delete\(\)\.eq\('id', sub\.id\);/,
  `
  const newSubs = subs.filter(s => s.id !== sub.id);
  setSubs(newSubs);
  localStorage.setItem('subscriptions', JSON.stringify(newSubs));
  `
);

content = content.replace(
  /await supabase\.from\('subscriptions'\)\.insert\(\{[\s\S]*?\}\);/m,
  `
  const newSub = { id: Date.now().toString(), name, monthly_price: price, washes_included: washes, active: true };
  const newSubs = [...subs, newSub];
  setSubs(newSubs);
  localStorage.setItem('subscriptions', JSON.stringify(newSubs));
  `
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
