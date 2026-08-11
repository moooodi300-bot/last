const fs = require('fs');
let code = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');

if (!code.includes("useEffect(() => {") || !code.includes("}, []);")) {
  console.log("Regex might not match");
}

code = code.replace(
  /\} catch\(e\) \{\}\n  \}, \[\]\);/g,
  "} catch(e) {}\n  }, [currentTenantId]);"
);

fs.writeFileSync('src/pages/ReportsPage.tsx', code);
