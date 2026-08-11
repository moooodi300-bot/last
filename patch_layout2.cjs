const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// The exact string in the output:
content = content.replace(
  /\{isDemo && \([\s\S]*?وضع الديمو التجريبي[\s\S]*?\)\}/,
  ''
);

fs.writeFileSync('src/components/Layout.tsx', content);
