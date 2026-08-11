import re

with open('src/pages/JobCardsPage.tsx', 'r') as f:
    content = f.read()

if "consumeSubscriptionWash" not in content:
    content = content.replace(
        "import { getTenantProducts } from '@/lib/productStore';",
        "import { getTenantProducts } from '@/lib/productStore';\nimport { consumeSubscriptionWash, getTenantCustomerSubscriptions } from '@/lib/subscriptionStore';"
    )

handleChangeStatus_start = content.find('const handleChangeStatus = (id: string')
payment_logic_start = content.find("if (newStatus === 'paid') {", handleChangeStatus_start)

# We need to deduct subscription inside the `newStatus === 'paid'` block if paymentMethod === 'subscription'

replacement = """if (newStatus === 'paid') {
      if (paymentMethod === 'subscription') {
         const cSubs = getTenantCustomerSubscriptions(currentTenantId);
         const cSub = cSubs.find(s => s.customer_name === viewCard?.customerName || s.plate_number === viewCard?.plate);
         if (cSub) {
            consumeSubscriptionWash(cSub.id, `غسيل كرت عمل ${id}`, currentTenantId);
         } else {
            alert('لا يوجد اشتراك فعال لهذا العميل. تم التسجيل كاشتراك ولكن يرجى مراجعة الرصيد.');
         }
      }
      try {"""

content = content.replace("if (newStatus === 'paid') {\n      try {", replacement)

with open('src/pages/JobCardsPage.tsx', 'w') as f:
    f.write(content)

