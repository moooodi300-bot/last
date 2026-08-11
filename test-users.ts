import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function main() {
  const { data, error } = await supabase.from('profiles').select('*').limit(10);
  console.log('Profiles:', data, error?.message);
}
main();
