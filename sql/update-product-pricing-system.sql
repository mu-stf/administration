-- =========================================
-- تحديث نظام التسعير للمنتجات
-- =========================================
-- هذا السكريبت يضيف:
-- 1. سعر الشراء السابق (previous_purchase_price)
-- 2. تاريخ آخر تحديث لسعر الشراء (last_purchase_price_update)
-- 3. تحسين الأداء بإضافة indexes

-- إضافة عمود سعر الشراء السابق
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS previous_purchase_price DECIMAL(10, 2) DEFAULT 0;

-- إضافة عمود تاريخ آخر تحديث لسعر الشراء
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS last_purchase_price_update TIMESTAMPTZ;

-- إضافة تعليق توضيحي للأعمدة الجديدة
COMMENT ON COLUMN products.previous_purchase_price IS 'سعر الشراء السابق قبل آخر تحديث';
COMMENT ON COLUMN products.last_purchase_price_update IS 'تاريخ آخر تحديث لسعر الشراء';

-- =========================================
-- دالة لتحديث سعر الشراء مع حفظ السعر السابق
-- =========================================
CREATE OR REPLACE FUNCTION update_product_purchase_price()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تغير سعر الشراء، احفظ السعر القديم
    IF NEW.purchase_price IS DISTINCT FROM OLD.purchase_price THEN
        NEW.previous_purchase_price = OLD.purchase_price;
        NEW.last_purchase_price_update = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتتبع تغييرات سعر الشراء
DROP TRIGGER IF EXISTS track_purchase_price_changes ON products;
CREATE TRIGGER track_purchase_price_changes
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_purchase_price();

-- =========================================
-- تحديث البيانات الموجودة
-- =========================================
-- تعيين السعر السابق للمنتجات الموجودة
UPDATE products 
SET previous_purchase_price = purchase_price,
    last_purchase_price_update = updated_at
WHERE previous_purchase_price IS NULL;

-- =========================================
-- إضافة indexes لتحسين الأداء
-- =========================================
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- =========================================
-- دالة لتحديث اسم المنتج في الفواتير
-- =========================================
CREATE OR REPLACE FUNCTION update_product_name_in_invoices()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تغير اسم المنتج، قم بتحديثه في جميع الفواتير النشطة
    IF NEW.name IS DISTINCT FROM OLD.name THEN
        UPDATE invoice_items
        SET product_name = NEW.name
        WHERE product_id = NEW.id
        AND EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.status = 'active'
        );
        
        -- تحديث في فواتير الشراء أيضاً
        UPDATE purchase_invoice_items
        SET product_name = NEW.name
        WHERE product_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث اسم المنتج في الفواتير
DROP TRIGGER IF EXISTS sync_product_name_to_invoices ON products;
CREATE TRIGGER sync_product_name_to_invoices
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_name_in_invoices();

-- =========================================
-- ✅ تم الانتهاء من التحديث بنجاح!
-- =========================================
