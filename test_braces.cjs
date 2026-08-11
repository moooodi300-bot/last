const fs = require('fs');
const code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');
const lines = code.split('\n').slice(50, 70);
console.log(lines.join('\n'));
