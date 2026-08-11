const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf8');

const signInReplacement = `  const signIn = async (phone: string, password: string) => {
    // DEMO BYPASS: skip Supabase auth completely for demo numbers
    if (phone.startsWith("050000000")) {
      setIsDemo(true);
      const names = ['أحمد', 'وفاء', 'هاني', 'عبدالرحمن', 'إياد'];
      const index = parseInt(phone.replace('050000000', '')) - 1;
      const name = names[index] || 'مستخدم تجريبي';
      
      const mockSession = {
        access_token: 'dummy', refresh_token: 'dummy', expires_in: 3600, token_type: 'bearer',
        user: { id: 'dummy-user-id', aud: 'authenticated', role: 'authenticated', email: \`\${phone}@demo.com\`, app_metadata: {}, user_metadata: { phone_number: phone, full_name: name, company_name: \`مغسلة \${name}\` }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      };
      
      setSession(mockSession as any);
      setRole('owner');
      setOrganization({
        id: 'legacy-demo-org',
        name: \`مغسلة \${name}\`,
        subscription_status: 'active',
        owner_id: 'dummy-user-id',
        subscription_plan_id: null,
        trial_ends_at: null,
        created_at: new Date().toISOString()
      } as any);
      
      // Trigger seeder with local storage fallback if RLS fails
      checkAndSeedDemoData('dummy').catch(console.error);
      return { error: null };
    }`;

// We will just replace the whole function
const beforeSignIn = content.substring(0, content.indexOf('  const signIn = async'));
const afterSignIn = content.substring(content.indexOf('  const resetPassword = async'));

fs.writeFileSync('src/lib/auth.tsx', beforeSignIn + signInReplacement + '\n\n' + afterSignIn);
