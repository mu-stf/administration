-- =========================================
-- تحديث قاعدة البيانات: إضافة نظام البيع الآجل
-- =========================================
-- نفذ هذا السكريبت في Supabase SQL Editor

-- 1. تحديث جدول invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(10) DEFAULT 'cash' CHECK (payment_type IN ('cash', 'credit')),
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0;

-- 2. تحديث جدول customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

-- 3. إنشاء جدول payments للتسديدات
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- RLS Policies for payments
-- =========================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
    ON payments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
    ON payments FOR DELETE
    USING (auth.uid() = user_id);

-- =========================================
-- Indexes for performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_type ON invoices(payment_type);
CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(balance);

-- =========================================
-- تم! الآن قاعدة البيانات جاهزة للبيع الآجل
-- =========================================
