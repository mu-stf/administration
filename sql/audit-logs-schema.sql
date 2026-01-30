-- =============================================
-- نظام سجل العمليات (Audit Log)
-- تتبع جميع العمليات الحساسة في النظام
-- =============================================

-- 1. إنشاء جدول سجل العمليات
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login'
  table_name TEXT NOT NULL, -- 'products', 'invoices', 'customers', etc.
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);

-- 3. إنشاء دالة لإضافة سجل تلقائياً
CREATE OR REPLACE FUNCTION log_audit_entry(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    description
  ) VALUES (
    p_user_id,
    p_user_email,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_description
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 4. Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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

-- منع التعديل والحذف (السجلات للقراءة فقط)
-- لا حاجة لـ UPDATE أو DELETE policies

-- 5. تعليق على الجدول
COMMENT ON TABLE audit_logs IS 'سجل جميع العمليات الحساسة في النظام';
COMMENT ON COLUMN audit_logs.action IS 'نوع العملية: create, update, delete, login, etc.';
COMMENT ON COLUMN audit_logs.table_name IS 'اسم الجدول المتأثر';
COMMENT ON COLUMN audit_logs.old_data IS 'البيانات القديمة قبل التعديل';
COMMENT ON COLUMN audit_logs.new_data IS 'البيانات الجديدة بعد التعديل';
