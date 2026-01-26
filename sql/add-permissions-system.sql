-- نظام الصلاحيات والتخصيص
-- تشغيل هذا السكريبت في Supabase SQL Editor

-- 1. إضافة أعمدة للصلاحيات
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS allowed_pages jsonb DEFAULT '["dashboard","new-invoice","invoices","products","customers","customer-accounts","supplies","statistics","settings"]'::jsonb;

-- 2. تعيين المستخدم الرئيسي كـ admin
-- ملاحظة: استبدل 'YOUR_USER_ID_HERE' بـ user_id الخاص بك من جدول profiles
-- يمكنك الحصول عليه من: SELECT id, store_name FROM profiles LIMIT 10;

UPDATE profiles 
SET role = 'admin', 
    allowed_pages = '["dashboard","new-invoice","invoices","products","customers","customer-accounts","supplies","statistics","settings","manage-users"]'::jsonb
WHERE id = (SELECT id FROM profiles WHERE store_name LIKE '%محل%' OR id IN (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1));

-- إذا كنت تعرف الـ id مباشرة، استخدم هذا بدلاً منه:
-- UPDATE profiles 
-- SET role = 'admin', 
--     allowed_pages = '["dashboard","new-invoice","invoices","products","customers","customer-accounts","supplies","statistics","settings","manage-users"]'::jsonb
-- WHERE id = 'الصق هنا user_id الخاص بك';

-- 3. تحديث المستخدمين الموجودين (إذا وُجدوا)
UPDATE profiles 
SET allowed_pages = '["dashboard","new-invoice","invoices","products","customers","customer-accounts","supplies","statistics","settings"]'::jsonb
WHERE role IS NULL OR role = 'user';

-- تم!
