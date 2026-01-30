-- =============================================
-- تحديث RLS Policies لجدول audit_logs
-- تشغيل هذا السكريبت لتحديث السياسات الأمنية
-- =============================================

-- 1. حذف الـ policies القديمة إن وُجدت
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON audit_logs;

-- 2. إنشاء الـ policies الجديدة المحسّنة

-- السماح للمستخدمين بقراءة سجلاتهم فقط
CREATE POLICY "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- السماح بالإدراج للمستخدمين المسجلين فقط ولسجلاتهم الخاصة
CREATE POLICY "Users can insert their own audit logs"
ON audit_logs FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

-- 3. التأكد من تفعيل RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. تأكيد النجاح
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY policyname;
