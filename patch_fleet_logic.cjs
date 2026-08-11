const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const stateCode = `  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const loadVehicles = async () => {
    const { data } = await supabase.from('mobile_vehicles').select('*');
    if (data) {
      setVehicles(data.map(v => {
        let extra = { type: 'car', working_hours: 8 };
        if (v.driver_name && v.driver_name.startsWith('{')) {
          try {
            const parsed = JSON.parse(v.driver_name);
            return { ...v, worker_name: parsed.worker_name, type: parsed.type, working_hours: parsed.working_hours };
          } catch(e) {}
        }
        return { ...v, worker_name: v.driver_name };
      }));
    }
  };
  
  useEffect(() => { loadVehicles(); }, []);
  
  const handleSaveVehicles = async () => {
    setLoading(true);
    // For simplicity, delete all and re-insert, since it's just settings.
    await supabase.from('mobile_vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (vehicles.length > 0) {
      const toInsert = vehicles.map(v => ({
        name: v.name || 'مركبة',
        plate_number: v.plate_number,
        driver_phone: v.worker_phone,
        driver_name: JSON.stringify({ worker_name: v.worker_name, type: v.type, working_hours: v.working_hours }),
        active: true
      }));
      await supabase.from('mobile_vehicles').insert(toInsert);
    }
    setLoading(false);
    alert('تم حفظ الأسطول بنجاح');
  };
`;

content = content.replace(
  /const \[fleetWorker, setFleetWorker\] = useState\('0559998877'\);/,
  stateCode
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
