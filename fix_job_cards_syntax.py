import re

with open('src/pages/JobCardsPage.tsx', 'r') as f:
    content = f.read()

bad_string = """               </div>
             )} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-900/20">
                   <Clock className="w-5 h-5 ml-2" /> بدء العمل (تغيير الحالة)
                 </Button>
               </div>
             )}"""

good_string = """               </div>
             )}"""

content = content.replace(bad_string, good_string)

with open('src/pages/JobCardsPage.tsx', 'w') as f:
    f.write(content)
