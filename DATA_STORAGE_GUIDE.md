# CodeCrew ERP - දත්ත ගබඩා වන ආකාරය සහ කළමනාකරණය (Data Storage Guide)

සරල සිංහලෙන් සහ English භාෂාවෙන් ඔබේ ERP පද්ධතියේ දත්ත (Data) ක්‍රියාත්මක වන ආකාරය පිළිබඳ විස්තරය.

---

## 1. දැනට ඔබගේ Data Save වෙන්නේ කොහෙද? (Where is your data saved right now?)

දැනට මෙම ERP පද්ධතිය තුළ දත්ත ක්‍රියාත්මක වන්නේ ප්‍රධාන කොටස් 2ක් මඟිනි:

### A. ඔබේ Browser එක තුළ (Browser LocalStorage)
* **Quick Studio (Create Invoice)** පිටුවෙහි ඔබ ඇතුළත් කරන Invoice අංක, Client නම, මුදල් ගණන්, Project විස්තර සියල්ල save වෙන්නේ ඔබගේ **Web Browser එක තුළම පමණි** (`localStorage` - Key: `codecrew_studio_rows_v2`).
* එය කිසිදු External Server එකකට හෝ Cloud එකකට යන්නේ නැත. එය පවතින්නේ ඔබ වැඩ කරන පරිගණකයේ Browser එක ඇතුළේ පමණි.

### B. Code එක තුළ තිබූ Sample / Dummy Data (දැන් සම්පූර්ණයෙන්ම Remove කර ඇත)
* Projects, Customers, Expenses, Ledger සහ Documents යන පිටුවල මීට පෙර ඔබට පෙනුණු "InterMax", "Google Workspace File Sync", "Shamshard Marikkar" වැනි විස්තර කිසිදු Database එකකින් පැමිණි ඒවා නොවේ.
* ඒවා Frontend Code එක තුළ Demo / Preview සඳහා Hardcode කර තිබූ Dummy Data වේ.
* **එම සියලු Dummy Data දැන් සම්පූර්ණයෙන්ම ඉවත් කර පද්ධතිය Clean කර ඇත.**

---

## 2. ඉදිරියට Database එකක් Connect කළ පසු Data යන්නේ කොහෙද? (Where will data go in Supabase?)

ඔබ **Supabase Cloud Database** එක සම්බන්ධ කළ පසු (Connect කළ විට), ඔබ ඇතුළත් කරන සියලුම Data ආරක්ෂිතව Cloud Database එකට Save වේ:

| Data වර්ගය | Save වන Table එක (PostgreSQL) | විස්තරය |
|---|---|---|
| **Projects** | `public.projects` | Project නම, Date, Client Price (Income), Outsourcer & Broker විස්තර |
| **Clients / Customers** | `public.customers` | පාරිභෝගික නම, WhatsApp දුරකථන අංකය, Company නම, Address |
| **Expenses (වියදම්)** | `public.expenses` | Facebook Ads, Google Ads වියදම්, Date, Amount |
| **Invoices & Quotations** | `public.documents` | Invoice / Quotation අංකය, දිනය, Discount, Total, WhatsApp Share Token |
| **Invoice Line Items** | `public.document_items` | එක් එක් Invoice එකෙහි Service Tasks, Description, Hours, Price |
| **Payments** | `public.income_payments` | Client ගෙවන ලද Advance / Installment ගෙවීම් |
| **Settings** | `public.settings` | CodeCrew ව්‍යාපාරික තොරතුරු, BOC බැංකු ගිණුම් විස්තර, WhatsApp Text Templates |
| **PDF Invoices** | `Supabase Storage (documents bucket)` | WhatsApp හරහා යවන PDF Files |

---

## 3. දැනට තිබූ Data ඉවත් කළ ආකාරය (What was removed & how to clear data)

අපි දැනටමත් පහත පියවර ක්‍රියාත්මක කර පද්ධතිය පිරිසිදු කර ඇත:

1. **Quick Studio Template එක Blank කරන ලදී:**
   - මීට පෙර default තිබූ InterMax / Google Workspace Project එක ඉවත් කර, අලුත්ම Project එකක් ඇතුළත් කිරීමට හැකි වන පරිදි Blank Template එකක් ලබා දී ඇත.
2. **"Clear Data" Button එකක් එක් කරන ලදී:**
   - Quick Studio header එකෙහි රතු පැහැති **`Clear Data`** button එකක් එක් කර ඇත. එය Click කළ විට Browser එකේ save වී ඇති පැරණි data සියල්ල ක්ෂණිකව මැකී යයි.
3. **Projects, Customers, Expenses, Documents, Ledger පිටුවල තිබූ Mock Data ඉවත් කරන ලදී:**
   - දැන් එම පිටුවල කිසිදු ව්‍යාජ (dummy) දත්තයක් නොපෙන්වන අතර "No projects yet", "No customers yet" ලෙස පිරිසිදුව දිස්වේ.
4. **Dashboard Zero-Reset කරන ලදී:**
   - පැරණි Sample data අනුව Dashboard එකෙහි පෙන්වූ ගණන් බිංදුව (0.00) බවට පත් කර ඇත.

---

## 4. Browser එකේ Cache / LocalStorage Manually Clear කරන්නේ කෙසේද?

ඔබට Browser එකෙහි ඇති සියලුම Saved Data සම්පූර්ණයෙන්ම Clear කිරීමට අවශ්‍ය නම්:
1. ERP වෙබ් පිටුව විවෘත කරන්න.
2. Keyboard එකේ `F12` ඔබන්න (Inspect Developer Tools).
3. **Application** (හෝ **Storage**) Tab එකට යන්න.
4. වම් පැත්තේ ඇති **Local Storage** යටතේ `http://localhost:...` තෝරන්න.
5. එහි ඇති `codecrew_studio_rows_v2` Right-click කර **Delete** කරන්න (නැතහොත් **Clear All** ඔබන්න).
6. පිටුව Refresh (`F5`) කරන්න.

*(විකල්පයක් ලෙස, Quick Studio පිටුවේ ඉහළ ඇති **"Clear Data"** බොත්තම Click කිරීමෙන්ද මෙය ක්ෂණිකව කළ හැක).*

---

## 5. ඉදිරියට ස්ථිර Database එකක් සකස් කරගන්නේ කෙසේද? (Connecting Supabase)

ඔබට Online Database එකක් සකසා දත්ත ස්ථිරව Cloud එකේ තබා ගැනීමට අවශ්‍ය නම්:

1. [supabase.com](https://supabase.com) වෙත ගොස් නොමිලේ Account එකක් සාදා New Project එකක් Create කරන්න.
2. Supabase Dashboard එකේ **SQL Editor** එකට ගොස් ඔබේ Project එකේ ඇති `supabase/schema.sql` File එකේ Code එක Run කරන්න.
3. Project එකේ Root Directory එක තුළ `.env` නමින් File එකක් සාදා පහත අගයන් එක් කරන්න:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. ඉන්පසු ඔබ System එකට දාන සියලුම Projects, Clients, Expenses සහ Invoices ක්ෂණිකව Supabase Cloud Database එකට save වේ.

