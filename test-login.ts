import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const email = 'testuser2@wash.sa';
  const password = 'Password123!';
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log('Login result:', error ? error.message : 'Success');
}

main();
