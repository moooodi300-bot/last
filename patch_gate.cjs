const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const originalGate = `function Gate() {
  const { session, booting, settings } = useAuth();
  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner label="جاري التحميل..." />
      </div>
    );
  }
  return <AppContent />;
}`;

const newGate = `function Gate() {
  const { session, booting } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner label="جاري التحميل..." />
      </div>
    );
  }

  if (!session) {
    if (showSignUp) {
      return <SignUpPage onLoginClick={() => setShowSignUp(false)} />;
    }
    return <LoginPage onSignUpClick={() => setShowSignUp(true)} />;
  }

  return <AppContent />;
}`;

code = code.replace(originalGate, newGate);
fs.writeFileSync(file, code);
