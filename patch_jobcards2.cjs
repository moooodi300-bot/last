const fs = require('fs');

let code = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

const targetStr = `        const { data } = await supabase.from('services').select('*');
        if (data && data.length > 0) {
          setAvailableServices(data);
        } else {`;
const replaceStr = `        const { data } = await supabase.from('services').select('*');
        if (data && data.length > 0) {
          setAvailableServices(data.filter(d => d.active));
        } else {`;

code = code.replace(targetStr, replaceStr);

const targetStr2 = `          ]);
        }
      } catch(e) {`;
const replaceStr2 = `          ]);
        }
        
        const custRes = await supabase.from('customers').select('*');
        setCustomers(mergeCustomerLists((custRes.data as Customer[]) ?? []));
        
      } catch(e) {`;

code = code.replace(targetStr2, replaceStr2);

fs.writeFileSync('src/pages/JobCardsPage.tsx', code);
