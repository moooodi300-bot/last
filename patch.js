const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace lazy imports with static imports
code = code.replace(/const (\w+)Page = lazy\(\(\) => import\('([^']+)'\).*\);/g, "import { $1Page } from '$2';");

// Remove Suspense
code = code.replace(/<Suspense[^>]*>/g, "");
code = code.replace(/<\/Suspense>/g, "");
code = code.replace(/import {.*lazy.*} from 'react';/, "import { useState, useEffect } from 'react';");

fs.writeFileSync('src/App.tsx', code);
