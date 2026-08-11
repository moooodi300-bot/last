import re
with open('src/pages/SettingsPage.tsx', 'r') as f:
    content = f.read()

start = content.find('const handleSaveSubs =')
end = content.find('const handleSave', start)
print(content[start:end])
