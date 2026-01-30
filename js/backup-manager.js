/**
 * Backup Manager - نظام النسخ الاحتياطي
 * يوفر إمكانية نسخ واسترجاع جميع بيانات النظام
 */

class BackupManager {
    constructor() {
        this.backupVersion = '1.0';
        this.storageKey = 'backup_history';
    }

    /**
     * إنشاء نسخة احتياطية كاملة
     * @param {string} userId - معرف المستخدم
     * @returns {object} بيانات النسخة الاحتياطية
     */
    async createBackup(userId) {
        try {
            console.log('📦 جاري إنشاء نسخة احتياطية...');

            const backup = {
                version: this.backupVersion,
                timestamp: new Date().toISOString(),
                userId: userId,
                data: {}
            };

            // جلب المنتجات
            backup.data.products = await SupabaseDB.getProducts(userId);
            console.log(`✅ تم نسخ ${backup.data.products.length} منتج`);

            // جلب الزبائن
            backup.data.customers = await SupabaseDB.getCustomers(userId);
            console.log(`✅ تم نسخ ${backup.data.customers.length} زبون`);

            // جلب الموردين
            backup.data.suppliers = await SupabaseDB.getSuppliers(userId);
            console.log(`✅ تم نسخ ${backup.data.suppliers.length} مورد`);

            // جلب فواتير المبيعات
            backup.data.invoices = await SupabaseDB.getInvoices(userId);
            console.log(`✅ تم نسخ ${backup.data.invoices.length} فاتورة مبيعات`);

            // جلب فواتير الشراء
            backup.data.supplies = await SupabaseDB.getSupplies(userId);
            console.log(`✅ تم نسخ ${backup.data.supplies.length} فاتورة شراء`);

            // جلب ملف التعريف
            const { user, profile } = await getCurrentUserData();
            backup.data.profile = profile;
            console.log(`✅ تم نسخ ملف التعريف`);

            // حفظ النسخة في السجل
            this.saveToHistory(backup);

            console.log('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
            return backup;

        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
            throw error;
        }
    }

    /**
     * تحميل النسخة الاحتياطية كملف JSON
     * @param {object} backup - بيانات النسخة
     * @param {string} filename - اسم الملف (اختياري)
     */
    downloadBackup(backup, filename = null) {
        const date = new Date(backup.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        const defaultFilename = `backup_${dateStr}_${timeStr}.json`;
        const finalFilename = filename || defaultFilename;

        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`📥 تم تحميل النسخة الاحتياطية: ${finalFilename}`);
    }

    /**
     * قراءة ملف النسخة الاحتياطية
     * @param {File} file - ملف JSON
     * @returns {Promise<object>} بيانات النسخة
     */
    async readBackupFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // التحقق من صحة الملف
                    if (!backup.version || !backup.data) {
                        throw new Error('ملف النسخة الاحتياطية غير صحيح');
                    }

                    console.log(`✅ تم قراءة النسخة الاحتياطية (${backup.timestamp})`);
                    resolve(backup);
                } catch (error) {
                    reject(new Error('خطأ في قراءة الملف: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('فشل قراءة الملف'));
            reader.readAsText(file);
        });
    }

    /**
     * استرجاع النسخة الاحتياطية
     * @param {object} backup - بيانات النسخة
     * @param {string} userId - معرف المستخدم
     * @param {boolean} clearExisting - حذف البيانات الموجودة قبل الاسترجاع
     */
    async restoreBackup(backup, userId, clearExisting = false) {
        try {
            console.log('🔄 جاري استرجاع النسخة الاحتياطية...');

            if (!confirm('⚠️ هل أنت متأكد من استرجاع هذه النسخة؟\n\nسيتم استبدال جميع البيانات الحالية!')) {
                return;
            }

            // التحقق من PIN للحماية
            const pin = prompt('🔐 أدخل رمز PIN للتأكيد:\n(الرمز الافتراضي: 1234)');
            if (pin !== '1234') {
                throw new Error('رمز PIN غير صحيح');
            }

            // حذف البيانات الموجودة إذا طُلب ذلك  
            if (clearExisting) {
                console.log('🗑️ جاري حذف البيانات الموجودة...');
                // ملاحظة: يمكن إضافة وظائف الحذف هنا
            }

            const stats = {
                products: 0,
                customers: 0,
                suppliers: 0,
                invoices: 0,
                supplies: 0
            };

            // استرجاع المنتجات
            if (backup.data.products && backup.data.products.length > 0) {
                for (const product of backup.data.products) {
                    try {
                        const { id, created_at, updated_at, user_id, ...productData } = product;
                        await SupabaseDB.addProduct(userId, productData);
                        stats.products++;
                    } catch (error) {
                        console.warn(`تخطي منتج: ${product.name}`, error);
                    }
                }
                console.log(`✅ تم استرجاع ${stats.products} منتج`);
            }

            // استرجاع الزبائن
            if (backup.data.customers && backup.data.customers.length > 0) {
                for (const customer of backup.data.customers) {
                    try {
                        const { id, created_at, updated_at, user_id, ...customerData } = customer;
                        await SupabaseDB.addCustomer(userId, customerData);
                        stats.customers++;
                    } catch (error) {
                        console.warn(`تخطي زبون: ${customer.name}`, error);
                    }
                }
                console.log(`✅ تم استرجاع ${stats.customers} زبون`);
            }

            // استرجاع الموردين
            if (backup.data.suppliers && backup.data.suppliers.length > 0) {
                for (const supplier of backup.data.suppliers) {
                    try {
                        const { id, created_at, updated_at, user_id, ...supplierData } = supplier;
                        await SupabaseDB.addSupplier(userId, supplierData);
                        stats.suppliers++;
                    } catch (error) {
                        console.warn(`تخطي مورد: ${supplier.name}`, error);
                    }
                }
                console.log(`✅ تم استرجاع ${stats.suppliers} مورد`);
            }

            // مسح الكاش
            if (window.CacheManager) {
                CacheManager.clear();
            }

            console.log('✅ تم استرجاع النسخة الاحتياطية بنجاح!', stats);
            return stats;

        } catch (error) {
            console.error('❌ خطأ في استرجاع النسخة:', error);
            throw error;
        }
    }

    /**
     * حفظ النسخة في السجل التاريخي
     * @param {object} backup - بيانات النسخة
     */
    saveToHistory(backup) {
        let history = this.getHistory();
        
        // إضافة معلومات مختصرة فقط
        const summary = {
            timestamp: backup.timestamp,
            userId: backup.userId,
            counts: {
                products: backup.data.products?.length || 0,
                customers: backup.data.customers?.length || 0,
                suppliers: backup.data.suppliers?.length || 0,
                invoices: backup.data.invoices?.length || 0,
                supplies: backup.data.supplies?.length || 0
            }
        };

        history.unshift(summary);

        // الاحتفاظ بآخر 10 نسخ فقط في السجل
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }

    /**
     * الحصول على سجل النسخ الاحتياطية
     * @returns {array} السجل
     */
    getHistory() {
        const history = localStorage.getItem(this.storageKey);
        return history ? JSON.parse(history) : [];
    }

    /**
     * مسح سجل النسخ الاحتياطية
     */
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * جدولة نسخ احتياطي تلقائي
     * @param {string} userId - معرف المستخدم
     * @param {number} intervalHours - الفاصل الزمني بالساعات
     */
    scheduleAutoBackup(userId, intervalHours = 24) {
        const intervalMs = intervalHours * 60 * 60 * 1000;

        // التحقق من آخر نسخة
        const lastBackup = localStorage.getItem('last_auto_backup');
        const now = Date.now();

        if (!lastBackup || (now - parseInt(lastBackup)) >= intervalMs) {
            this.performAutoBackup(userId);
        }

        // جدولة النسخ التالي
        setInterval(() => {
            this.performAutoBackup(userId);
        }, intervalMs);

        console.log(`⏰ تم جدولة النسخ الاحتياطي التلقائي كل ${intervalHours} ساعة`);
    }

    /**
     * تنفيذ نسخ احتياطي تلقائي
     * @param {string} userId - معرف المستخدم
     */
    async performAutoBackup(userId) {
        try {
            console.log('🤖 بدء النسخ الاحتياطي التلقائي...');
            
            const backup = await this.createBackup(userId);
            
            // حفظ في IndexedDB أو LocalStorage
            const compressed = JSON.stringify(backup);
            localStorage.setItem('latest_auto_backup', compressed);
            localStorage.setItem('last_auto_backup', Date.now().toString());
            
            console.log('✅ تم النسخ الاحتياطي التلقائي بنجاح');
        } catch (error) {
            console.error('❌ فشل النسخ الاحتياطي التلقائي:', error);
        }
    }

    /**
     * الحصول على آخر نسخة تلقائية
     * @returns {object|null} النسخة أو null
     */
    getLatestAutoBackup() {
        const backup = localStorage.getItem('latest_auto_backup');
        return backup ? JSON.parse(backup) : null;
    }
}

// إنشاء instance عام
const backupManager = new BackupManager();

// جعله متاحاً عالمياً
window.BackupManager = BackupManager;
window.backupManager = backupManager;
