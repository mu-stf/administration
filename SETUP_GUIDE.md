# دليل إعداد Supabase لنظام إدارة المحل

هذا الدليل سيساعدك في إعداد قاعدة بيانات Supabase لنظام إدارة المحل.

## الخطوة 1: الوصول إلى مشروع Supabase الموجود

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. سجل دخول بحسابك
3. اختر أحد مشاريعك الموجودة التي تريد إضافة جداول نظام المحل إليها

## الخطوة 2: نسخ بيانات الاتصال

1. في مشروعك، اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL** (مثل: `https://xxxxx.supabase.co`)
   - **anon public** key (المفتاح العام)

## الخطوة 3: تشغيل سكريبت قاعدة البيانات

1. في مشروع Supabase، اذهب إلى **SQL Editor**
2. اضغط على **New query**
3. افتح ملف `sql/setup.sql` من هذا المشروع
4. انسخ **كامل** محتوى الملف
5. الصق المحتوى في محرر SQL
6. اضغط **RUN** أو اضغط **Ctrl+Enter**
7. تأكد من ظهور رسالة نجاح

سيقوم السكريبت بإنشاء الجداول التالية:
- ✅ **profiles** - معلومات المستخدمين وإعدادات المحل
- ✅ **products** - المنتجات والمخزون
- ✅ **customers** - معلومات الزبائن
- ✅ **invoices** - الفواتير
- ✅ **invoice_items** - عناصر الفاتورة
- ✅ **supplies** - التوريدات

## الخطوة 4: إعداد ملف التكوين

1. في مجلد المشروع، انسخ `js/config.template.js` إلى `js/config.js`:
   
   **في PowerShell:**
   ```powershell
   cd "C:\Users\mk2uu\OneDrive - AlShaab University\Desktop\ادارة 2"
   copy js\config.template.js js\config.js
   ```

2. افتح `js/config.js` بمحرر النصوص (VS Code, Notepad++)

3. استبدل القيم بالبيانات التي نسختها من Supabase:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://xxxxx.supabase.co',  // ضع Project URL هنا
       anonKey: 'eyJhbGci...'               // ضع anon key هنا
   };
   ```

4. احفظ الملف

> **⚠️ مهم جداً**: لا ترفع ملف `js/config.js` على GitHub! هذا الملف موجود في `.gitignore` لحمايته.

## الخطوة 5: إضافة Supabase إلى المشروع

سنستخدم CDN لإضافة مكتبة Supabase. أضف هذا السطر في بداية كل ملف HTML (بعد `<head>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
```

## الخطوة 6: التحقق من الإعداد

للتحقق من أن كل شيء يعمل، افتح Developer Console في المتصفح (اضغط F12) واكتب:

```javascript
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
console.log('Supabase Client:', supabaseClient)
```

إذا ظهرت معلومات الـ client بدون أخطاء، فالإعداد ناجح!

## الخطوة 7: التسجيل وبدء الاستخدام

بعد دمج Supabase مع الكود (سيتم في المرحلة القادمة):

1. افتح `register.html` في المتصفح
2. أنشئ حساب جديد:
   - أدخل البريد الإلكتروني
   - أدخل كلمة مرور قوية (8 أحرف على الأقل)
3. تحقق من بريدك الإلكتروني وفعّل الحساب
4. سجل دخول من `index.html`
5. أكمل إعداد معلومات المحل في `settings.html`

---

## حل المشاكل الشائعة

### ❌ خطأ: "Invalid API Key"
**الحل:**
- تأكد من نسخ الـ **anon public** key وليس **service_role**
- تأكد من عدم وجود مسافات إضافية في بداية أو نهاية المفتاح
- تأكد من نسخ المفتاح كاملاً

### ❌ خطأ: "Failed to fetch"
**الحل:**
- تأكد من اتصالك بالإنترنت
- تأكد من صحة Project URL
- تحقق من أن المشروع نشط في Supabase (ليس موقوف)

### ❌ خطأ: "permission denied for table"
**الحل:**
- تأكد من تشغيل سكريبت SQL كاملاً (كل الملف)
- تحقق من إنشاء Row Level Security policies بشكل صحيح
- في SQL Editor، تأكد من عدم وجود أخطاء عند التنفيذ

### ❌ الجداول لا تظهر في Database
**الحل:**
- اذهب إلى **Table Editor** في Supabase
- إذا لم تظهر الجداول، ارجع لـ SQL Editor واقرأ رسائل الأخطاء
- حاول حذف الجداول الموجودة وتشغيل السكريبت مرة أخرى

### ❌ خطأ: "profiles table already exists"
هذا طبيعي إذا كنت تشغل السكريبت مرة ثانية. يمكنك:
- تجاهل الخطأ إذا كانت الجداول موجودة
- أو حذف الجداول القديمة أولاً

---

## التحقق من الجداول

بعد تشغيل السكريبت، تأكد من وجود الجداول:

1. اذهب إلى **Table Editor** في Supabase
2. يجب أن ترى:
   - profiles
   - products
   - customers
   - invoices
   - invoice_items
   - supplies

3. اضغط على أي جدول وتحقق من الأعمدة

---

## الأمان والخصوصية

✅ **Row Level Security (RLS)** مفعلة على جميع الجداول  
✅ كل مستخدم يرى بياناته فقط  
✅ كلمات المرور مشفرة تلقائياً في Supabase Auth  
✅ ملف `config.js` محمي في `.gitignore` ولن يُرفع على GitHub  

---

## المرحلة القادمة

بعد إتمام هذه الخطوات، المرحلة القادمة هي:
1. تحديث ملفات JavaScript للتكامل مع Supabase
2. تحديث نظام المصادقة
3. اختبار النظام

---

## الدعم

إذا واجهت أي مشكلة:
1. تحقق من **Logs** في Supabase Dashboard
2. افتح Console في المتصفح (F12) وابحث عن رسائل الخطأ
3. ارجع لهذا الدليل وتأكد من اتباع جميع الخطوات بالترتيب
