const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const oldCostSection = `                {/* Cost tables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold mb-3 flex items-center justify-between">تكاليف تأسيس (2 سنتين) <Button variant="outline" size="sm" onClick={() => addCost(costs2Y, setCosts2Y, 'تأسيس جديد')} className="h-6 px-2 text-xs">+</Button></h4>
                    {costs2Y.map((c,i) => <div key={i} className="flex gap-2 mb-2"><Input className="h-8 text-xs" value={c.name} onChange={(e)=>{const n=[...costs2Y]; n[i].name=e.target.value; setCosts2Y(n)}}/><Input type="number" className="h-8 text-xs w-20" value={c.amount} onChange={(e)=>{const n=[...costs2Y]; n[i].amount=Number(e.target.value); setCosts2Y(n)}}/></div>)}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold mb-3 flex items-center justify-between">مصاريف سنوية <Button variant="outline" size="sm" onClick={() => addCost(costs1Y, setCosts1Y, 'مصروف سنوي')} className="h-6 px-2 text-xs">+</Button></h4>
                    {costs1Y.map((c,i) => <div key={i} className="flex gap-2 mb-2"><Input className="h-8 text-xs" value={c.name} onChange={(e)=>{const n=[...costs1Y]; n[i].name=e.target.value; setCosts1Y(n)}}/><Input type="number" className="h-8 text-xs w-20" value={c.amount} onChange={(e)=>{const n=[...costs1Y]; n[i].amount=Number(e.target.value); setCosts1Y(n)}}/></div>)}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold mb-3 flex items-center justify-between">مصاريف شهرية ثابتة <Button variant="outline" size="sm" onClick={() => addCost(costs1M, setCosts1M, 'مصروف شهري')} className="h-6 px-2 text-xs">+</Button></h4>
                    {costs1M.map((c,i) => <div key={i} className="flex gap-2 mb-2"><Input className="h-8 text-xs" value={c.name} onChange={(e)=>{const n=[...costs1M]; n[i].name=e.target.value; setCosts1M(n)}}/><Input type="number" className="h-8 text-xs w-20" value={c.amount} onChange={(e)=>{const n=[...costs1M]; n[i].amount=Number(e.target.value); setCosts1M(n)}}/></div>)}
                  </div>
                </div>
                
                <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-cyan-800 font-bold mb-1">إجمالي التكلفة الشهرية المحسوبة:</p>
                    <p className="text-3xl font-black text-cyan-700">{Math.round(totalMonthlyCost).toLocaleString()} <span className="text-base font-normal">ريال/شهر</span></p>
                  </div>
                  <div className="w-full md:w-auto grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">متوسط سعر غسلة أقل</Label><Input type="number" className="h-8" value={lowWash} onChange={e=>setLowWash(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">متوسط سعر غسلة أعلى</Label><Input type="number" className="h-8" value={highWash} onChange={e=>setHighWash(Number(e.target.value))} /></div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-cyan-200 text-center">
                    <p className="text-xs font-bold text-slate-500 mb-1">نقطة التعادل (لعدم الخسارة)</p>
                    <p className="text-xl font-black text-rose-600">{dailyBreakEven} <span className="text-sm font-normal">سيارة/يومياً</span></p>
                  </div>
                </div>`;

const newCostSection = `                {/* Cost tables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="font-bold mb-4 flex items-center justify-between text-slate-800">تكاليف تأسيس (2 سنتين) <Button variant="outline" size="sm" onClick={() => addCost(costs2Y, setCosts2Y, 'تأسيس جديد')} className="h-8 px-3 text-sm">+</Button></h4>
                    {costs2Y.map((c,i) => <div key={i} className="flex gap-3 mb-3"><Input className="h-10 text-sm" placeholder="اسم التكلفة" value={c.name} onChange={(e)=>{const n=[...costs2Y]; n[i].name=e.target.value; setCosts2Y(n)}}/><Input type="number" placeholder="المبلغ" className="h-10 text-sm w-28" value={c.amount || ''} onChange={(e)=>{const n=[...costs2Y]; n[i].amount=Number(e.target.value); setCosts2Y(n)}}/></div>)}
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="font-bold mb-4 flex items-center justify-between text-slate-800">مصاريف سنوية <Button variant="outline" size="sm" onClick={() => addCost(costs1Y, setCosts1Y, 'مصروف سنوي')} className="h-8 px-3 text-sm">+</Button></h4>
                    {costs1Y.map((c,i) => <div key={i} className="flex gap-3 mb-3"><Input className="h-10 text-sm" placeholder="اسم التكلفة" value={c.name} onChange={(e)=>{const n=[...costs1Y]; n[i].name=e.target.value; setCosts1Y(n)}}/><Input type="number" placeholder="المبلغ" className="h-10 text-sm w-28" value={c.amount || ''} onChange={(e)=>{const n=[...costs1Y]; n[i].amount=Number(e.target.value); setCosts1Y(n)}}/></div>)}
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="font-bold mb-4 flex items-center justify-between text-slate-800">مصاريف شهرية ثابتة <Button variant="outline" size="sm" onClick={() => addCost(costs1M, setCosts1M, 'مصروف شهري')} className="h-8 px-3 text-sm">+</Button></h4>
                    {costs1M.map((c,i) => <div key={i} className="flex gap-3 mb-3"><Input className="h-10 text-sm" placeholder="اسم التكلفة" value={c.name} onChange={(e)=>{const n=[...costs1M]; n[i].name=e.target.value; setCosts1M(n)}}/><Input type="number" placeholder="المبلغ" className="h-10 text-sm w-28" value={c.amount || ''} onChange={(e)=>{const n=[...costs1M]; n[i].amount=Number(e.target.value); setCosts1M(n)}}/></div>)}
                  </div>
                </div>
                
                <div className="bg-cyan-50 p-6 rounded-xl border border-cyan-100 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-cyan-800 font-bold mb-1">إجمالي التكلفة الشهرية المحسوبة:</p>
                    <p className="text-3xl font-black text-cyan-700">{Math.round(totalMonthlyCost).toLocaleString()} <span className="text-base font-normal">ريال/شهر</span></p>
                  </div>
                  
                  <div className="w-full lg:w-auto grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 p-4 rounded-xl border border-cyan-100">
                    <div>
                      <Label className="text-sm font-bold text-slate-700 mb-1 block">متوسط سعر غسلة أقل</Label>
                      <Input type="number" className="h-10 text-sm font-bold text-cyan-900" value={lowWash} onChange={e=>setLowWash(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-slate-700 mb-1 block">متوسط سعر غسلة أعلى</Label>
                      <Input type="number" className="h-10 text-sm font-bold text-cyan-900" value={highWash} onChange={e=>setHighWash(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-slate-700 mb-1 block">الهدف اليومي للمبيعات (سيارة)</Label>
                      <Input type="number" className="h-10 text-sm font-bold text-amber-700 border-amber-200 focus:border-amber-400 bg-amber-50" value={expectedDaily} onChange={e=>setExpectedDaily(Number(e.target.value))} />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-cyan-200 text-center min-w-[180px]">
                    <p className="text-sm font-bold text-slate-500 mb-1">نقطة التعادل (لعدم الخسارة)</p>
                    <p className="text-2xl font-black text-rose-600">{dailyBreakEven} <span className="text-base font-normal">سيارة/يومياً</span></p>
                  </div>
                </div>`;

code = code.replace(oldCostSection, newCostSection);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
