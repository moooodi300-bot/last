const fs = require('fs');

let content = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

// add activeTab state
content = content.replace(
  `const [activeFilter, setActiveFilter] = useState`,
  `const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');\n  const [activeFilter, setActiveFilter] = useState`
);

// add tab buttons
content = content.replace(
  `      {/* Tabs Outside the Card */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl w-full">`,
  `      <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-sm mb-6">
        <button onClick={() => setActiveTab('list')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${activeTab === 'list' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>الكروت</button>
        <button onClick={() => setActiveTab('dashboard')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${activeTab === 'dashboard' ? 'bg-white shadow-sm text-cyan-800' : 'text-slate-500 hover:bg-slate-200/50'}\`}>لوحة المؤشرات</button>
      </div>

      {activeTab === 'list' && (
      <>
      {/* Tabs Outside the Card */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl w-full">`
);

// close activeTab block
content = content.replace(
  `      </Modal>
    </div>
  );`,
  `      </Modal>
      </>
      )}
      
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mb-3">
                       <Car className="w-5 h-5 text-cyan-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">السيارات تحت العمل</p>
                    <p className="text-2xl font-black text-slate-800">{cards.filter(a => a.status === 'in_progress').length}</p>
                 </CardBody>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                       <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">تم الدفع / مكتمل</p>
                    <p className="text-2xl font-black text-slate-800">{cards.filter(a => a.status === 'completed' || a.status === 'paid' || a.status === 'delivered').length}</p>
                 </CardBody>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                       <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">قيد الانتظار</p>
                    <p className="text-2xl font-black text-slate-800">{cards.filter(a => a.status === 'waiting').length}</p>
                 </CardBody>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                 <CardBody className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                       <Send className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-slate-500 text-sm mb-1">تم التسليم</p>
                    <p className="text-2xl font-black text-slate-800">{cards.filter(a => a.status === 'delivered').length}</p>
                 </CardBody>
              </Card>
           </div>
        </div>
      )}
    </div>
  );`
);

fs.writeFileSync('src/pages/JobCardsPage.tsx', content);
