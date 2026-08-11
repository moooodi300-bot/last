const fs = require('fs');
let code = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');

if (!code.includes("useAuth")) {
  code = code.replace(
    "import { PageHeader, Card, CardBody, Button, Select } from '@/components/ui';",
    "import { PageHeader, Card, CardBody, Button, Select } from '@/components/ui';\nimport { useAuth } from '@/lib/auth';"
  );
}

if (!code.includes("const currentTenantId = organization?.id || 'org_client_01';")) {
  code = code.replace(
    "const [fleetData, setFleetData] = useState<any[]>([]);",
    "const [fleetData, setFleetData] = useState<any[]>([]);\n  const { organization } = useAuth();\n  const currentTenantId = organization?.id || 'org_client_01';"
  );
}

fs.writeFileSync('src/pages/ReportsPage.tsx', code);
