import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function run() {
    const { data, error } = await supabase.auth.signInWithPassword({ email: '0500000001@app.com', password: 'adminadmin' });
    console.log(data.session ? "Login Success" : "Login Failed", error);
}
run();
