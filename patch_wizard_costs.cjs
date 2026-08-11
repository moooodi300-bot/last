const fs = require('fs');
let content = fs.readFileSync('src/components/OnboardingWizard.tsx', 'utf8');

content = content.replace(
  /<Input className="flex-1 text-sm bg-white" placeholder="البند /g,
  '<Input className="flex-1 text-sm bg-white text-slate-900" placeholder="البند '
);

content = content.replace(
  /<Input type="number" className="w-32 text-sm bg-white" placeholder="المبلغ"/g,
  '<Input type="number" className="flex-1 text-sm bg-white text-slate-900" placeholder="المبلغ"'
);

fs.writeFileSync('src/components/OnboardingWizard.tsx', content);
