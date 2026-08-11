const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf8');

const replacement = `
  useEffect(() => {
    const mockSession = {
      access_token: 'demo_token',
      refresh_token: 'demo_token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'demo@app.com',
        app_metadata: {},
        user_metadata: { phone_number: '0500000000', full_name: 'مستخدم تجريبي' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };
    
    setIsDemo(true);
    setSession(mockSession as any);
    setRole('owner');
    setOrganization({
      id: 'legacy-demo-org',
      name: 'بيانات تجريبية',
      subscription_status: 'active',
    } as any);
    setBooting(false);
  }, []);
`;

content = content.replace(/useEffect\(\(\) => \{\n    supabase\.auth\.getSession\(\)[\s\S]*?return \(\) => listener\.subscription\.unsubscribe\(\);\n  \}, \[\]\);/m, replacement);

fs.writeFileSync('src/lib/auth.tsx', content);
