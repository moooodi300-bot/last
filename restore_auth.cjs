const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.tsx', 'utf8');

const replacement = `  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadEverything();
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadEverything();
      } else {
        setSettings(null);
        setOrganization(null);
        setProfile(null);
        setPlan(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);`;

content = content.replace(/useEffect\(\(\) => \{\n    const mockSession = \{[\s\S]*?setBooting\(false\);\n  \}, \[\]\);/, replacement);

fs.writeFileSync('src/lib/auth.tsx', content);
