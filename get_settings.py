import re
with open('src/pages/SettingsPage.tsx', 'r') as f:
    content = f.read()

start = content.find('const handleSave =')
end = content.find('const exportData', start)
print(content[start:end])
