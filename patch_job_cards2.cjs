const fs = require('fs');
let code = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

code = code.replace(
  "import { Plus, Car, UserCircle, Camera, CheckCircle2, Printer, Send, Clock, Check, ListChecks } from 'lucide-react';",
  "import { Plus, Car, UserCircle, Camera, CheckCircle2, Printer, Send, Clock, Check, ListChecks } from 'lucide-react';\nimport { supabase } from '@/lib/supabase';"
);

code = code.replace(
  "const { createClient } = require('@supabase/supabase-js');",
  ""
);

code = code.replace(
  "const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);",
  ""
);

fs.writeFileSync('src/pages/JobCardsPage.tsx', code);
