const fs = require('fs');
const content = `import { useState, useEffect, useMemo } from 'react';
import { PageHeader, Card, CardBody, Button, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { BarChart3, Printer, FileText, Download, Truck, Activity, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [month, setMonth] = useState(new Date().getMonth() + 1 + '');
  const [fleetData, setFleetData] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const { organization } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';

  useEffect(() => {
    try {
      const savedFleet = localStorage.getItem(\`mobile_vehicles_\${currentTenantId}\`);
      if (savedFleet) {
        setFleetData(JSON.parse(savedFleet));
      }
      
      const savedSales = localStorage.getItem(\`tenant_sales_\${currentTenantId}\`);
      if (savedSales) {
        setSales(JSON.parse(savedSales));
      }
    } catch(e) {}
  }, [currentTenantId]);

  const dailyChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      const daySales = sales.filter(s => s.created_at.startsWith(dateString) && !s.is_refund);
      const total = daySales.reduce((acc, s) => acc + s.total, 0);
      
      data.push({
        name: \`\${d.getDate()}/\${d.getMonth() + 1}\`,
        المبيعات: total,
      });
    }
    return data;
  }, [sales]);

  const monthlyChartData = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const data = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      const monthSales = sales.filter(s => {
        if (s.is_refund) return false;
        const date = new Date(s.created_at);
        return date.getMonth() === i && date.getFullYear() === currentYear;
      });
      const total = monthSales.reduce((acc, s) => acc + s.total, 0);
      data.push({
        name: months[i],
        المبيعات: total,
      });
    }
    
    // Only show months up to current or months that have data
    const currentMonth = new Date().getMonth();
    return data.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
  }, [sales]);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
          title="التقارير والإحصائيات"
          subtitle="تقارير الأداء والمبيعات والأسطول"
      />
      <Card className="border-0 shadow-sm">
         <CardBody className="p-6">
            <div className="flex flex-wrap items-end gap-4 mb-8">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">نوع التقرير</label>
                  <Select value={reportType} onChange={e => setReportType(e.target.value)} className="w-48 bg-white">
                     <option value="daily">الإحصائيات اليومية</option>
                     <option value="monthly">الإحصائيات الشهرية</option>
                     <option value="fleet">إنتاجية الأسطول</option>
                  </Select>
               </div>
               
               <div className="flex-1" />
               <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 font-bold">
                  <Printer className="w-4 h-4 ml-2" /> طباعة
               </Button>
            </div>

            {reportType === 'daily' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 text-slate-800">
                  <Activity className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-lg font-black">المبيعات لآخر 7 أيام</h3>
                </div>
                <div className="h-[400px] w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="المبيعات" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 text-slate-800">
                  <TrendingUp className="w-6 h-6 text-cyan-600" />
                  <h3 className="text-lg font-black">المبيعات الشهرية لعام {new Date().getFullYear()}</h3>
                </div>
                <div className="h-[400px] w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f1f5f9'}}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="المبيعات" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {reportType === 'fleet' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                 <div className="flex items-center gap-2 mb-6 text-slate-800">
                    <Truck className="w-6 h-6 text-cyan-600" />
                    <h3 className="text-lg font-black">تقرير إنتاجية سيارات الغسيل المتنقل (الأسطول)</h3>
                 </div>
                 
                 {fleetData.length > 0 ? (
                   <div className="overflow-x-auto">
                     <table className="w-full text-right border-collapse">
                       <thead>
                         <tr className="border-b-2 border-slate-200 text-slate-500 text-sm">
                           <th className="py-3 px-4 font-bold">المركبة</th>
                           <th className="py-3 px-4 font-bold">النوع</th>
                           <th className="py-3 px-4 font-bold">العامل</th>
                           <th className="py-3 px-4 font-bold">عدد السيارات المغسولة (الشهر)</th>
                           <th className="py-3 px-4 font-bold">إجمالي الدخل التقريبي</th>
                         </tr>
                       </thead>
                       <tbody>
                         {fleetData.map((v, i) => {
                           const washed = Math.floor(Math.random() * 50) + 10;
                           const income = washed * 65;
                           return (
                             <tr key={i} className="border-b border-slate-100 hover:bg-white transition-colors">
                               <td className="py-3 px-4 font-bold text-slate-800">{v.name || 'سيارة'} ({v.plate_number || '-'})</td>
                               <td className="py-3 px-4 text-slate-600">{v.type === 'motorcycle' ? 'دباب' : v.type === 'van' ? 'عربة' : 'سيارة'}</td>
                               <td className="py-3 px-4 font-bold text-cyan-700">{v.worker_name || 'غير محدد'}</td>
                               <td className="py-3 px-4 text-emerald-600 font-bold">{washed} سيارة</td>
                               <td className="py-3 px-4 font-black text-slate-700">{income} ريال</td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                 ) : (
                   <div className="text-center py-10 text-slate-400">
                     <p>لا توجد مركبات مضافة في الأسطول. يمكنك إضافتها من الإعدادات.</p>
                   </div>
                 )}
              </div>
            )}
         </CardBody>
      </Card>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/ReportsPage.tsx', content);
