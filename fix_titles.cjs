const fs = require('fs');

function replaceFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (let [from, to] of Object.entries(replacements)) {
    content = content.replace(new RegExp(from, 'g'), to);
  }
  fs.writeFileSync(path, content);
}

replaceFile('src/pages/CustomersPage.tsx', {
  'سجل الفواتير والخدمات المقدمة للعميل': 'سجل الفواتير',
  'سجل باقات واشتراكات العميل': 'الاشتراكات',
  'كروت العمل وبطاقات الصيانة': 'كروت العمل',
  'برنامج الولاء والغسلات المجانية': 'الولاء',
  'إضافة ختم غسلة سريع للعميل': 'إضافة ختم'
});

replaceFile('src/pages/SalesPage.tsx', {
  'فاتورة مبيعات جديدة / نقطة البيع': 'نقطة البيع',
  'استعراض الفاتورة وطباعتها': 'معاينة الفاتورة',
  'المنتجات والخدمات المطلوبة': 'المنتجات والخدمات'
});
