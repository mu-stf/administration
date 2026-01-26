-- إصلاح تحذيرات search_path للدوال
-- تشغيل هذا في Supabase SQL Editor

-- 1. إصلاح generate_order_number
ALTER FUNCTION public.generate_order_number() SET search_path = public, pg_temp;

-- 2. إصلاح set_owner_id_on_insert
ALTER FUNCTION public.set_owner_id_on_insert() SET search_path = public, pg_temp;

-- 3. إصلاح set_order_number
ALTER FUNCTION public.set_order_number() SET search_path = public, pg_temp;

-- 4. إصلاح update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- 5. إصلاح handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- 6. إصلاح RLS policy لجدول orders (إذا كان موجوداً ولا تستخدمه)
-- إذا كنت لا تستخدم جدول orders، احذف السياسة:
DROP POLICY IF EXISTS "Allow public to create orders" ON public.orders;

-- إذا كنت تستخدمه، أضف قيد صحيح:
-- CREATE POLICY "Allow authenticated users to create orders" ON public.orders
-- FOR INSERT TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- 7. إصلاح RLS policy لجدول reviews (إذا كان موجوداً ولا تستخدمه)
DROP POLICY IF EXISTS "Allow public to create reviews" ON public.reviews;

-- إذا كنت تستخدمه، أضف قيد صحيح:
-- CREATE POLICY "Allow authenticated users to create reviews" ON public.reviews
-- FOR INSERT TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- تم! التحذيرات يجب أن تختفي الآن ✅

-- ملاحظة: لتفعيل HaveIBeenPwned password check:
-- اذهب إلى: Supabase Dashboard > Authentication > Settings > Security
-- وفعّل "Enable HaveIBeenPwned integration"
