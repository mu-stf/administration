-- نظام إيصالات القبض والدفع
-- تشغيل في Supabase SQL Editor

-- 1. جدول الإيصالات
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    receipt_number TEXT NOT NULL,
    receipt_type TEXT NOT NULL, -- 'قبض' أو 'دفع'
    entity_type TEXT NOT NULL, -- 'customer' أو 'supplier'
    entity_id UUID,
    entity_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'نقد',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. إضافة تسلسل الإيصالات في profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_receipt_number INTEGER DEFAULT 1;

-- 3. Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
CREATE POLICY "Users can view own receipts" 
ON receipts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own receipts" ON receipts;
CREATE POLICY "Users can create own receipts" 
ON receipts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- تم! ✅
