const fs = require('fs');

let rCode = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');
rCode = rCode.replace(
  /import \{ PageHeader \} from '\.\.\/components\/PageHeader';\nimport \{ Card, CardBody \} from '\.\.\/components\/ui\/Card';\nimport \{ Button \} from '\.\.\/components\/ui\/Button';\nimport \{ Select \} from '\.\.\/components\/ui\/Select';/,
  "import { PageHeader, Card, CardBody, Button, Select } from '@/components/ui';"
);
fs.writeFileSync('src/pages/ReportsPage.tsx', rCode);

let jCode = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');
jCode = jCode.replace(
  /import \{ PageHeader \} from '\.\.\/components\/PageHeader';\nimport \{ Card, CardBody \} from '\.\.\/components\/ui\/Card';\nimport \{ Button \} from '\.\.\/components\/ui\/Button';\nimport \{ Input \} from '\.\.\/components\/ui\/Input';\nimport \{ Label \} from '\.\.\/components\/ui\/Label';\nimport \{ Modal \} from '\.\.\/components\/ui\/Modal';/,
  "import { PageHeader, Card, CardBody, Button, Input, Label, Modal } from '@/components/ui';"
);
fs.writeFileSync('src/pages/JobCardsPage.tsx', jCode);

