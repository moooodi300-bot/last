const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('PinEntryScreen')) {
  code = code.replace("import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';", 
                      "import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';\nimport { PinEntryScreen } from '@/components/PinEntryScreen';\nimport type { Staff } from '@/lib/types';");
  
  code = code.replace("function Gate() {\n  const { session, booting } = useAuth();\n  const [showSignUp, setShowSignUp] = useState(false);",
                      "function Gate() {\n  const { session, booting, setRole, setStaffName, signOut } = useAuth();\n  const [showSignUp, setShowSignUp] = useState(false);\n  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);");
  
  code = code.replace("return <AppContent />;\n}",
                      "if (!currentStaff) {\n    return <PinEntryScreen onSuccess={(staff) => {\n      setCurrentStaff(staff);\n      setRole(staff.role as any);\n      setStaffName(staff.name);\n    }} onLogout={() => signOut()} />;\n  }\n\n  return <AppContent />;\n}");

  fs.writeFileSync('src/App.tsx', code);
}
