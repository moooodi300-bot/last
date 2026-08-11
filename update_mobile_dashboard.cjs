const fs = require('fs');

let content = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

content = content.replace(
  `const [activeTab, setActiveTab] = useState<'cashier' | 'schedule' | 'upcoming'>('cashier');`,
  `const [activeTab, setActiveTab] = useState<'cashier' | 'schedule' | 'upcoming' | 'dashboard'>('dashboard');`
);

content = content.replace(
  `        <button onClick={() => setActiveTab('upcoming')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${activeTab === 'upcoming' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>أقرب المواعيد</button>
      </div>`,
  `        <button onClick={() => setActiveTab('upcoming')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${activeTab === 'upcoming' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>أقرب المواعيد</button>
        <button onClick={() => setActiveTab('dashboard')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${activeTab === 'dashboard' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>لوحة المؤشرات</button>
      </div>`
);

const dashboardComponent = `
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mb-3">
                       <Truck className="w-5 h-5 text-cyan-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">المركبات المخدومة</p>
                    <p className="text-2xl font-black text-slate-800">{appointments.filter(a => a.status === 'completed').length}</p>
                 </CardBody>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                       <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">الإيرادات (تقريبي)</p>
                    <p className="text-2xl font-black text-slate-800">{appointments.filter(a => a.status === 'completed').length * 150} ر.س</p>
                 </CardBody>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                       <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">المواعيد القادمة</p>
                    <p className="text-2xl font-black text-slate-800">{appointments.filter(a => a.status !== 'completed').length}</p>
                 </CardBody>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                       <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">العملاء الجدد</p>
                    <p className="text-2xl font-black text-slate-800">0</p>
                 </CardBody>
              </Card>
           </div>
        </div>
      )}
`;

content = content.replace(
  `{activeTab === 'cashier' && (`,
  dashboardComponent + `\n      {activeTab === 'cashier' && (`
);

fs.writeFileSync('src/pages/MobilePage.tsx', content);
