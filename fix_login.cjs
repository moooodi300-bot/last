const fs = require('fs');
const file = 'src/pages/LoginPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Change type="tel" to type="text"
code = code.replace(/type="tel"/g, 'type="text"');
// Change placeholder
code = code.replace(/placeholder="05XXXXXXXX"/g, 'placeholder="البريد الإلكتروني"');
// Change label from "رقم الجوال" to "البريد الإلكتروني"
code = code.replace(/<label className="text-sm font-bold text-slate-700 ml-1">رقم الجوال<\/label>/g, '<label className="text-sm font-bold text-slate-700 ml-1">البريد الإلكتروني</label>');

const originalDemo = `<div className="grid grid-cols-5 gap-2 mb-6">
                    {['أحمد', 'وفاء', 'هاني', 'عبدالرحمن', 'إياد'].map((name, i) => (
                      <Button
                        key={name}
                        type="button"
                        variant="outline"
                        className="text-[11px] p-0 h-9 font-mono"
                        onClick={() => {
                          setPhone(\`050000000\${i + 1}\`);
                          setPassword('adminadmin');
                          setTimeout(() => { const btn = document.getElementById('submit-login-btn'); if (btn) btn.click(); }, 100);
                        }}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>`;

const newDemo = `<div className="grid grid-cols-2 gap-4 mb-6">
                    {[{name: 'مغسلة الرياض', email: 'riyadh@test.com', pass: '123456'}, {name: 'مغسلة جدة', email: 'jeddah@test.com', pass: '123456'}].map((demo, i) => (
                      <Button
                        key={demo.name}
                        type="button"
                        variant="outline"
                        className="text-sm p-0 h-10 font-bold border-cyan-200 hover:bg-cyan-50 text-cyan-800"
                        onClick={() => {
                          setPhone(demo.email);
                          setPassword(demo.pass);
                          setTimeout(() => { const btn = document.getElementById('submit-login-btn'); if (btn) btn.click(); }, 100);
                        }}
                      >
                        {demo.name}
                      </Button>
                    ))}
                  </div>`;

code = code.replace(originalDemo, newDemo);
code = code.replace(
  /<Button type="submit" disabled=\{loading\} className="w-full/g,
  '<Button id="submit-login-btn" type="submit" disabled={loading} className="w-full'
);

fs.writeFileSync(file, code);
