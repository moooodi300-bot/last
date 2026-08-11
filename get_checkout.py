import re

with open('src/pages/SalesPage.tsx', 'r') as f:
    content = f.read()

start = content.find('const checkout = async () => {')
end = content.find('const getCleanPhone', start)
print(content[start:end])
