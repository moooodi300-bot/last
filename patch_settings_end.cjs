const fs = require('fs');

let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// 1. Equalize sizes for name and price
code = code.replace(/<Input type="number" className="w-24 text-sm bg-white text-black font-semibold"/g, '<Input type="number" className="flex-1 text-sm bg-white text-black font-semibold"');

// 2. Remove backup block completely
const backupRegex = /<Card>[\s\S]*?<Database className="w-10 h-10 mx-auto mb-3 opacity-20" \/>[\s\S]*?<\/Card>/g;
code = code.replace(backupRegex, "");

// 3. Update Loyalty message in Settings to mention it updates customers
code = code.replace("يعني كل", "يتم تعديل رصيد ولاء العميل في قسم العملاء. يعني كل");

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
