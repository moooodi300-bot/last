const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner label="جاري التحميل..." />
      </div>
    );
  }

  if (!session) {
    if (isSignUp) {
      return <SignUpPage onLoginClick={() => setIsSignUp(false)} />;
    }
    return <LoginPage onSignUpClick={() => setIsSignUp(true)} />;
  }

  const onboardingCompleted = (settings as (typeof settings & { onboarding_completed?: boolean }))?.onboarding_completed;`;

content = content.replace(/if \(booting\) \{[\s\S]*?const onboardingCompleted = \(settings as \(typeof settings & \{ onboarding_completed\?: boolean \}\)\)\?\.onboarding_completed;/, replacement);

fs.writeFileSync('src/App.tsx', content);
