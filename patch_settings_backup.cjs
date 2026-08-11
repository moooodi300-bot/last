const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const importStatement = `import { exportTenantBackup, importTenantBackup } from '@/lib/backupManager';`;

if (!code.includes(importStatement)) {
  code = code.replace(/import \{.*\} from 'lucide-react';/, match => match + '\n' + importStatement);
}

const backupUi = `
{activeTab === 'backup' && (
  <Card>
    <CardBody className="p-6 text-center space-y-4">
      <Database className="w-16 h-16 mx-auto text-slate-300" />
      <h3 className="text-xl font-black text-slate-800">النسخ الاحتياطي والمزامنة</h3>
      <p className="text-slate-500 max-w-md mx-auto">
        يمكنك أخذ نسخة احتياطية لبيانات منشأتك الحالية بصيغة ملف، أو استعادة بيانات من ملف نسخة احتياطية سابقة.
      </p>
      
      <div className="flex justify-center gap-4 pt-4 border-t border-slate-100 mt-6">
        <Button onClick={() => {
          if (!currentTenantId) return;
          const json = exportTenantBackup(currentTenantId);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = \`RAQM_Backup_\${new Date().toISOString().split('T')[0]}.json\`;
          a.click();
          URL.revokeObjectURL(url);
        }} className="font-bold text-white bg-emerald-600 hover:bg-emerald-700">
          <DownloadCloud className="w-4 h-4 ml-2" /> تصدير نسخة احتياطية
        </Button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            id="import-backup-file"
            className="hidden"
            onChange={async (e) => {
               const file = e.target.files?.[0];
               if (!file || !currentTenantId) return;
               if (!confirm("تحذير: سيتم دمج أو استبدال البيانات الحالية ببيانات النسخة الاحتياطية. هل تريد المتابعة؟")) {
                 e.target.value = '';
                 return;
               }
               const reader = new FileReader();
               reader.onload = (ev) => {
                 try {
                    const content = ev.target?.result as string;
                    if (importTenantBackup(currentTenantId, content)) {
                       alert('تمت الاستعادة بنجاح. يرجى تحديث الصفحة.');
                       window.location.reload();
                    }
                 } catch (err: any) {
                    alert('فشل الاستيراد: ' + err.message);
                 }
               };
               reader.readAsText(file);
            }}
          />
          <Button 
            variant="outline"
            onClick={() => document.getElementById('import-backup-file')?.click()}
            className="font-bold text-slate-600">
            <UploadCloud className="w-4 h-4 ml-2" /> استعادة نسخة احتياطية
          </Button>
        </div>
      </div>
    </CardBody>
  </Card>
)}
`;

code = code.replace(/\{activeTab === 'backup' && \([\s\S]*?<\/Card>\s*\)\}/, backupUi);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
