const fs = require('fs');
let lines = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8').split('\n');

for(let i=0; i<lines.length; i++) {
  if(lines[i].includes("// 2. Additional Recorded Costs")) {
    console.log("Found at line " + i);
    // Remove the line i-1 if it's a closing brace
    if (lines[i-1].trim() === "}") {
       lines.splice(i-1, 1);
       fs.writeFileSync('src/pages/DashboardPage.tsx', lines.join('\n'));
       console.log("Removed a brace");
    }
    break;
  }
}
