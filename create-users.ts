import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  for (let i = 1; i <= 5; i++) {
    const phone = `050000000${i}`;
    const email = `${phone}@app.com`;
    console.log(`Creating user ${i}: phone=${phone}`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'adminadmin',
      options: { data: { phone_number: phone } }
    });
    if (error) {
      console.log(`Error creating user ${i}:`, error.message);
    } else {
      console.log(`User ${i} created successfully!`);
    }
  }
}

main();
