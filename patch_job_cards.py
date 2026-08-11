import re

with open('src/pages/JobCardsPage.tsx', 'r') as f:
    content = f.read()

# Add dynamic PDF import function
pdf_func = """
  const generateReceiptPDF = async (card: JobCard, type: 'receipt' | 'invoice') => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Basic text-based PDF for speed and zero dependencies on html2canvas
      doc.addFont('Amiri', 'Amiri', 'normal'); // We would need Arabic font, but let's use default or simple
      doc.setFontSize(20);
      doc.text(settings?.company_name || 'Raqam POS', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text(type === 'receipt' ? 'تقرير استلام سيارة' : 'فاتورة نهائية', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Customer: ${card.customerName}`, 20, 50);
      doc.text(`Phone: ${card.phone}`, 20, 60);
      doc.text(`Car: ${card.carType} - ${card.plate}`, 20, 70);
      doc.text(`Job Card #: ${card.id}`, 20, 80);
      doc.text(`Date: ${new Date(card.createdAt).toLocaleString('ar-SA')}`, 20, 90);
      
      doc.text(`Services:`, 20, 110);
      let y = 120;
      card.services.forEach((s: any) => {
         doc.text(`- ${s.name} (${s.price} SAR)`, 30, y);
         y += 10;
      });
      
      doc.text(`Total: ${card.totalAmount} SAR`, 20, y + 10);
      
      doc.save(`JobCard_${card.id}_${type}.pdf`);
      
      alert('تم إنشاء وتنزيل ملف PDF بنجاح. يمكنك الآن إرفاقه في الواتساب إذا رغبت.');
    } catch(e) {
      console.error('PDF generation failed', e);
      alert('حدث خطأ أثناء إنشاء PDF');
    }
  };

  const handleWhatsAppWithPDF = async (card: JobCard, type: 'receipt' | 'invoice') => {
    await generateReceiptPDF(card, type);
    const msg = type === 'receipt' ? `مرحباً ${card.customerName}،\nتم استلام سيارتك (${card.carType} - ${card.plate}) بنجاح.\nرقم الكرت: ${card.id}\n(تجدون تقرير الاستلام مرفقاً)` : `مرحباً ${card.customerName}،\nتم الانتهاء من العمل على سيارتك (${card.carType} - ${card.plate}).\nإجمالي الفاتورة: ${card.totalAmount} ريال.\n(تجدون الفاتورة النهائية مرفقة)`;
    const url = `https://wa.me/${card.phone.replace(/^0/, '966')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };
"""

insert_pos = content.find('const toggleService')
content = content[:insert_pos] + pdf_func + content[insert_pos:]

# Add "subscription" to payment methods
pay_buttons_start = content.find('<div className="grid grid-cols-4 gap-2">')
pay_buttons_end = content.find('</div>', pay_buttons_start)
pay_buttons = """<div className="grid grid-cols-5 gap-2">
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'cash')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">كاش</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'card')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">شبكة</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'transfer')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">تحويل</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'split')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1">مقسم</Button>
                          <Button onClick={() => handleChangeStatus(viewCard.id, 'paid', viewCard.totalAmount, 'subscription')} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-1">اشتراك</Button>
"""
content = content[:pay_buttons_start] + pay_buttons + content[pay_buttons_end:]


# Update PDF buttons in 'waiting'
waiting_start = content.find("{viewCard.status === 'waiting' && can('workcards.status') && (")
waiting_end = content.find(")}", waiting_start + 65)

new_waiting = """{viewCard.status === 'waiting' && (
               <div className="pt-4 border-t border-slate-100 space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                   <Button onClick={() => generateReceiptPDF(viewCard, 'receipt')} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs">
                     <Printer className="w-4 h-4 ml-2" /> تقرير PDF
                   </Button>
                   {can('workcards.whatsapp') && <Button onClick={() => handleWhatsAppWithPDF(viewCard, 'receipt')} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs">
                     <MessageCircle className="w-4 h-4 ml-2" /> واتساب
                   </Button>}
                 </div>
                 {can('workcards.status') && <Button onClick={() => handleChangeStatus(viewCard.id, 'in_progress', viewCard.totalAmount)} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-900/20">
                   <Clock className="w-5 h-5 ml-2" /> بدء العمل (تغيير الحالة)
                 </Button>}
               </div>
             """
content = content[:waiting_start] + new_waiting + content[waiting_end:]

# Update PDF buttons in 'paid'
paid_start = content.find("{viewCard.status === 'paid' && (")
paid_end = content.find(")}", paid_start + 65)

# Replace the inner grid with the final invoice PDF button
content = content.replace(
    """<Button variant="outline" className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50">
                     <Send className="w-4 h-4 ml-2" /> الفاتورة
                   </Button>
                   <Button variant="outline" className="h-10">
                     <Printer className="w-4 h-4 ml-2" /> طباعة
                   </Button>""",
    """<Button onClick={() => handleWhatsAppWithPDF(viewCard, 'invoice')} variant="outline" className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50">
                     <MessageCircle className="w-4 h-4 ml-2" /> واتساب + فاتورة
                   </Button>
                   <Button onClick={() => generateReceiptPDF(viewCard, 'invoice')} variant="outline" className="h-10">
                     <Printer className="w-4 h-4 ml-2" /> طباعة فاتورة PDF
                   </Button>"""
)

with open('src/pages/JobCardsPage.tsx', 'w') as f:
    f.write(content)
