const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const facilityState = `  // Costs & Breakeven
  const [costs2Y, setCosts2Y] = useState<{name: string; amount: number}[]>([{name: 'ديكور وتأسيس', amount: 20000}]);
  const [costs1Y, setCosts1Y] = useState<{name: string; amount: number}[]>([{name: 'إيجار سنوي', amount: 50000}]);
  const [costs1M, setCosts1M] = useState<{name: string; amount: number}[]>([{name: 'رواتب تقريبية', amount: 15000}]);
  const [lowWash, setLowWash] = useState(30);
  const [highWash, setHighWash] = useState(80);
  const [expectedDaily, setExpectedDaily] = useState(40);

  // Services & Products
  const [services, setServices] = useState<{name: string; price: number; id?: string}[]>([]);
  const [products, setProducts] = useState<{name: string; price: number; id?: string}[]>([]);

  const addCost = (arr: any[], setter: any, defName: string) => { if(arr.length < 10) setter([...arr, {name: defName, amount: 0}]) };
  const addService = () => { if(services.length < 20) setServices([...services, {name: 'خدمة جديدة', price: 0}]) };
  const addProduct = () => { if(products.length < 20) setProducts([...products, {name: 'منتج جديد', price: 0}]) };

  const total2Y = costs2Y.reduce((s, c) => s + Number(c.amount||0), 0) / 24;
  const total1Y = costs1Y.reduce((s, c) => s + Number(c.amount||0), 0) / 12;
  const total1M = costs1M.reduce((s, c) => s + Number(c.amount||0), 0);
  const totalMonthlyCost = total2Y + total1Y + total1M;
  const avgWashPrice = (Number(lowWash) + Number(highWash)) / 2;
  const dailyBreakEven = avgWashPrice > 0 ? Math.ceil((totalMonthlyCost / 30) / avgWashPrice) : 0;
`;

content = content.replace(
  /const \[freeWashThreshold, setFreeWashThreshold\] = useState\(settings\?.loyalty_target \?\? 5\);/,
  "const [freeWashThreshold, setFreeWashThreshold] = useState(settings?.loyalty_target ?? 5);\n" + facilityState
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
