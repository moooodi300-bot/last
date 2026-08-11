import re
with open('src/pages/SettingsPage.tsx', 'r') as f:
    content = f.read()

start = content.find('useEffect(() => {')
end = content.find('}, [settings');
print(content[start:end])
