-- =========================================
-- تحديث نظام التوريدات: إضافة موردين وفواتير شراء
-- =========================================

-- 1. إنشاء جدول الموردين (suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance DECIMAL(10,2) DEFAULT 0, -- المبلغ المستحق للمورد
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. تحديث جدول supplies
ALTER TABLE supplies 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(10) DEFAULT 'cash' CHECK (payment_type IN ('cash', 'credit')),
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0;

-- 3. إنشاء جدول supply_items (بنود فاتورة الشراء)
CREATE TABLE IF NOT EXISTS supply_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_id UUID REFERENCES supplies(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إنشاء جدول supplier_payments (تسديدات الموردين)
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    supply_id UUID REFERENCES supplies(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- RLS Policies
-- =========================================

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suppliers"
    ON suppliers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers"
    ON suppliers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers"
    ON suppliers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers"
    ON suppliers FOR DELETE
    USING (auth.uid() = user_id);

-- Supply Items
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view supply items through supplies"
    ON supply_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM supplies
            WHERE supplies.id = supply_items.supply_id
            AND supplies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert supply items"
    ON supply_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM supplies
            WHERE supplies.id = supply_items.supply_id
            AND supplies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete supply items"
    ON supply_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM supplies
            WHERE supplies.id = supply_items.supply_id
            AND supplies.user_id = auth.uid()
        )
    );

-- Supplier Payments
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplier payments"
    ON supplier_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplier payments"
    ON supplier_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =========================================
-- Indexes
-- =========================================
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_items_supply ON supply_items(supply_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);

-- =========================================
-- تم! نظام التوريدات محدث
-- =========================================
