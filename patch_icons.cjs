const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

content = content.replace(/CloudUpload/g, 'UploadCloud');
content = content.replace(/CloudDownload/g, 'DownloadCloud');

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
