import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE settings ADD COLUMN IF NOT EXISTS cr_number text;" });
  console.log(error || data);
}
run();
