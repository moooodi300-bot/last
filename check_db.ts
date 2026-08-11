import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`);
  const swagger = await res.json();
  const schemas = swagger.definitions || swagger.components?.schemas || {};
  
  for (const table of ['settings', 'cost_config', 'services', 'mobile_vehicles']) {
     console.log(`\n--- ${table} ---`);
     const def = schemas[table];
     if (def) {
       console.log(Object.keys(def.properties).join(', '));
     } else {
       console.log('Not found');
     }
  }
}
run();
