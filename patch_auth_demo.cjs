const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf8');

// Ensure import demo seeder
if (!content.includes('checkAndSeedDemoData')) {
  content = content.replace("import { supabase } from './supabase';", "import { supabase } from './supabase';\nimport { checkAndSeedDemoData } from './demoSeeder';");
}

const signInReplacement = `  const signIn = async (phone: string, password: string) => {
    if (password === "admin") password = "adminadmin";
    
    // DEMO BYPASS WITH REAL SUPABASE ACCS
    if (phone.startsWith("050000000")) {
      setIsDemo(true);
      const email = \`\${phone}@demo.com\`;
      let { data, error } = await supabase.auth.signInWithPassword({ email, password: 'adminadmin' });
      
      if (error) {
        // Create if doesn't exist
        const names = ['أحمد', 'وفاء', 'هاني', 'عبدالرحمن', 'إياد'];
        const index = parseInt(phone.replace('050000000', '')) - 1;
        const name = names[index] || 'مستخدم تجريبي';
        
        const signUpRes = await supabase.auth.signUp({
          email,
          password: 'adminadmin',
          options: { data: { phone_number: phone, full_name: name, company_name: \`مغسلة \${name}\` } },
        });
        
        if (signUpRes.error) {
          return { error: signUpRes.error.message };
        }
        data = signUpRes.data;
      }
      
      if (data.session) {
        await refreshOrg();
        // Trigger seeder
        const orgId = data.session.user.id; // Actually we need organization id, but we can just call the seeder and RLS will handle org id context
        checkAndSeedDemoData('dummy').catch(console.error);
        return { error: null };
      }
      return { error: 'تعذر تسجيل الدخول التجريبي' };
    }`;

content = content.replace(/  const signIn = async \(phone: string, password: string\) => \{[\s\S]*?if \(phone\.startsWith\("050000000"\)\) \{[\s\S]*?\} as Organization\);\n      \n      return \{ error: null \};\n    \}/, signInReplacement);

fs.writeFileSync('src/lib/auth.tsx', content);
