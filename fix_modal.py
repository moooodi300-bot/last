import re

with open('src/pages/SalesPage.tsx', 'r') as f:
    content = f.read()

modal_start = content.find('<Modal open={showAddCust}')
modal_end = content.find('</Modal>', modal_start)

modal_code = content[modal_start:modal_end]

if "vehicle_color" not in modal_code:
    new_inputs = """
          <div>
            <Label>نوع السيارة</Label>
            <Input
              value={newCust.vehicle_type}
              onChange={(e) => setNewCust({ ...newCust, vehicle_type: e.target.value })}
              placeholder="مثال: سيدان, SUV"
            />
          </div>
          <div>
            <Label>ماركة السيارة</Label>
            <Input
              value={newCust.vehicle_brand}
              onChange={(e) => setNewCust({ ...newCust, vehicle_brand: e.target.value })}
              placeholder="مثال: تويوتا"
            />
          </div>
          <div>
            <Label>لون السيارة</Label>
            <Input
              value={newCust.vehicle_color}
              onChange={(e) => setNewCust({ ...newCust, vehicle_color: e.target.value })}
              placeholder="مثال: أبيض"
            />
          </div>
"""
    # Insert before the button
    btn_start = modal_code.find('<Button onClick={addQuickCustomer}')
    modal_code = modal_code[:btn_start] + new_inputs + modal_code[btn_start:]
    
    content = content[:modal_start] + modal_code + content[modal_end:]
    
    with open('src/pages/SalesPage.tsx', 'w') as f:
        f.write(content)
