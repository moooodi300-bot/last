import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace static imports with React.lazy
imports_to_replace = [
    "import { DashboardPage } from '@/pages/DashboardPage';",
    "import { SalesPage } from '@/pages/SalesPage';",
    "import { InvoicesPage } from '@/pages/InvoicesPage';",
    "import { CustomersPage } from '@/pages/CustomersPage';",
    "import { PurchasesPage } from '@/pages/PurchasesPage';",
    "import { JobCardsPage } from '@/pages/JobCardsPage';",
    "import { ReportsPage } from '@/pages/ReportsPage';",
    "import { SettingsPage } from '@/pages/SettingsPage';",
    "import { MobilePage } from '@/pages/MobilePage';",
    "import { BillingPage } from '@/pages/BillingPage';"
]

lazy_imports = """import React, { Suspense } from 'react';
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SalesPage = React.lazy(() => import('@/pages/SalesPage').then(m => ({ default: m.SalesPage })));
const InvoicesPage = React.lazy(() => import('@/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const CustomersPage = React.lazy(() => import('@/pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const PurchasesPage = React.lazy(() => import('@/pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const JobCardsPage = React.lazy(() => import('@/pages/JobCardsPage').then(m => ({ default: m.JobCardsPage })));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const MobilePage = React.lazy(() => import('@/pages/MobilePage').then(m => ({ default: m.MobilePage })));
const BillingPage = React.lazy(() => import('@/pages/BillingPage').then(m => ({ default: m.BillingPage })));
"""

for imp in imports_to_replace:
    content = content.replace(imp, '')

# We need to insert lazy_imports after the last import
last_import = content.rfind("import ")
last_import_end = content.find('\n', last_import)
content = content[:last_import_end] + "\n" + lazy_imports + content[last_import_end:]

# Wrap renderPage() call in Suspense
content = content.replace('{canAccess(role, effectiveKey, organization?.id) ? renderPage() : (',
                          '<Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner label="جاري التحميل..." /></div>}>{canAccess(role, effectiveKey, organization?.id) ? renderPage() : (')
content = content.replace(')}</Layout>', ')}</Suspense></Layout>')

# Also fix the duplicate imports from `import { useState, useEffect } from 'react';` to just combine with `React, { Suspense }` if needed.
# Since we just added `import React, { Suspense } from 'react';`, it's fine in modern bundlers.

with open('src/App.tsx', 'w') as f:
    f.write(content)
