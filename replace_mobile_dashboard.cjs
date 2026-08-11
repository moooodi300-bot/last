const fs = require('fs');

let content = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');

content = content.replace(
  `import { PageHeader, Card, CardBody, Button, Input, Select, Badge, Label, Modal } from '@/components/ui';`,
  `import { PageHeader, Card, CardBody, Button, Input, Select, Badge, Label, Modal } from '@/components/ui';
import { ComprehensiveDashboard } from '@/components/ComprehensiveDashboard';`
);

const oldDash = `<div className="space-y-6">
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
        </div>`;

content = content.replace(oldDash, `<ComprehensiveDashboard sourceFilter="mobile_pos" title="مؤشرات الغسيل المتنقل" />`);

fs.writeFileSync('src/pages/MobilePage.tsx', content);

let jc = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

jc = jc.replace(
  `import { PageHeader, Card, CardBody, Button, Input, Label, Modal, Textarea } from '@/components/ui';`,
  `import { PageHeader, Card, CardBody, Button, Input, Label, Modal, Textarea } from '@/components/ui';
import { ComprehensiveDashboard } from '@/components/ComprehensiveDashboard';`
);

const oldJcDash = `<div className="space-y-6">
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
        </div>`;

jc = jc.replace(oldJcDash, `<ComprehensiveDashboard sourceFilter="job_card" title="مؤشرات كروت العمل" />`);

fs.writeFileSync('src/pages/JobCardsPage.tsx', jc);

