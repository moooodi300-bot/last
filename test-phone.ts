import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function main() {
  const phone = '05' + Math.floor(Math.random() * 100000000);
  const email = `${phone}@app.com`;
  console.log('Signing up:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123!',
    options: { data: { client_code: 'ABCD1234', phone_number: phone } }
  });
  console.log('Signup result:', JSON.stringify(data, null, 2), error?.message);
}
main();
