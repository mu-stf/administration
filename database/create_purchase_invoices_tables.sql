-- إنشاء جدول فواتير الشراء (Purchase Invoices)
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'credit')),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول بنود فواتير الشراء (Purchase Invoice Items)
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(12, 2) NOT NULL CHECK (purchase_price >= 0),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_user_id ON purchase_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON purchase_invoice_items(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product_id ON purchase_invoice_items(product_id);

-- تفعيل Row Level Security (RLS)
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول purchase_invoices
CREATE POLICY "Users can view their own purchase invoices"
    ON purchase_invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase invoices"
    ON purchase_invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase invoices"
    ON purchase_invoices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase invoices"
    ON purchase_invoices FOR DELETE
    USING (auth.uid() = user_id);

-- سياسات الأمان لجدول purchase_invoice_items
CREATE POLICY "Users can view their own purchase invoice items"
    ON purchase_invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM purchase_invoices
            WHERE purchase_invoices.id = purchase_invoice_items.purchase_invoice_id
            AND purchase_invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own purchase invoice items"
    ON purchase_invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_invoices
            WHERE purchase_invoices.id = purchase_invoice_items.purchase_invoice_id
            AND purchase_invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own purchase invoice items"
    ON purchase_invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM purchase_invoices
            WHERE purchase_invoices.id = purchase_invoice_items.purchase_invoice_id
            AND purchase_invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own purchase invoice items"
    ON purchase_invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM purchase_invoices
            WHERE purchase_invoices.id = purchase_invoice_items.purchase_invoice_id
            AND purchase_invoices.user_id = auth.uid()
        )
    );

-- إضافة trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_invoices_updated_at
    BEFORE UPDATE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
