import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function main() {
  const email = 'test_signup_' + Date.now() + '@example.com';
  console.log('Signing up:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123!',
  });
  console.log('Signup result:', JSON.stringify(data, null, 2), error?.message);
}
main();
