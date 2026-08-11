import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const email = 'testuser2@wash.sa';
  const password = 'Password123!';
  const clientCode = 'WASH1234';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { client_code: clientCode, phone_number: '0550000000', company_name: 'مغسلة تجريبية خاصة', full_name: 'مستخدم تجريبي' }
    }
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success:', data.user?.email);
  }
}

main();
