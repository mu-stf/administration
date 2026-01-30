/**
 * Audit Logger - نظام تسجيل العمليات
 * يتتبع جميع العمليات الحساسة في النظام
 */

class AuditLogger {
    constructor() {
        this.enabled = true;
        this.localStorageKey = 'audit_logs_local';
    }

    /**
     * تسجيل عملية
     * @param {string} action - نوع العملية (create, update, delete)
     * @param {string} tableName - اسم الجدول
     * @param {string} recordId - معرف السجل
     * @param {object} oldData - البيانات القديمة (للتعديل/الحذف)
     * @param {object} newData - البيانات الجديدة (للإنشاء/التعديل)
     * @param {string} description - وصف إضافي
     */
    async log(action, tableName, recordId = null, oldData = null, newData = null, description = null) {
        if (!this.enabled) return;

        try {
            const user = await SupabaseDB.getCurrentUser();
            if (!user) {
                console.warn('لا يوجد مستخدم مسجل الدخول للتسجيل');
                return;
            }

            const logEntry = {
                user_id: user.id,
                user_email: user.email,
                action,
                table_name: tableName,
                record_id: recordId ? recordId.toString() : null,
                old_data: oldData,
                new_data: newData,
                description,
                timestamp: new Date().toISOString()
            };

            // محاولة الحفظ في قاعدة البيانات
            try {
                const { data, error } = await SupabaseDB.client
                    .from('audit_logs')
                    .insert([logEntry])
                    .select()
                    .single();

                if (error) throw error;

                console.log(`📝 تم تسجيل العملية: ${action} على ${tableName}`);
                return data;
            } catch (dbError) {
                // إذا فشل الحفظ في القاعدة، احفظ محلياً
                console.warn('فشل الحفظ في قاعدة البيانات، الحفظ محلياً:', dbError);
                this.saveLocally(logEntry);
            }

        } catch (error) {
            console.error('خطأ في تسجيل العملية:', error);
        }
    }

    /**
     * حفظ السجل محلياً
     * @param {object} logEntry - سجل العملية
     */
    saveLocally(logEntry) {
        try {
            let logs = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
            logs.push(logEntry);

            // الاحتفاظ بآخر 500 سجل فقط
            if (logs.length > 500) {
                logs = logs.slice(-500);
            }

            localStorage.setItem(this.localStorageKey, JSON.stringify(logs));
        } catch (error) {
            console.error('فشل الحفظ المحلي:', error);
        }
    }

    /**
     * الحصول على السجلات من قاعدة البيانات
     * @param {object} filters - الفلاتر
     * @returns {Promise<array>} السجلات
     */
    async getLogs(filters = {}) {
        try {
            const user = await SupabaseDB.getCurrentUser();
            if (!user) throw new Error('غير مسجل الدخول');

            let query = SupabaseDB.client
                .from('audit_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            // تطبيق الفلاتر
            if (filters.action) {
                query = query.eq('action', filters.action);
            }

            if (filters.tableName) {
                query = query.eq('table_name', filters.tableName);
            }

            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }

            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('خطأ في جلب السجلات:', error);
            // إرجاع السجلات المحلية كبديل
            return this.getLocalLogs();
        }
    }

    /**
     * الحصول على السجلات المحلية
     * @returns {array} السجلات
     */
    getLocalLogs() {
        try {
            return JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
        } catch (error) {
            console.error('خطأ في قراءة السجلات المحلية:', error);
            return [];
        }
    }

    /**
     * تصدير السجلات
     * @param {Date} startDate - تاريخ البداية
     * @param {Date} endDate - تاريخ النهاية
     * @returns {Promise<void>}
     */
    async exportLogs(startDate = null, endDate = null) {
        try {
            const filters = {};
            
            if (startDate) {
                filters.startDate = startDate.toISOString();
            }
            
            if (endDate) {
                filters.endDate = endDate.toISOString();
            }

            const logs = await this.getLogs(filters);

            if (logs.length === 0) {
                alert('لا توجد سجلات للتصدير');
                return;
            }

            // تحويل إلى CSV
            const csv = this.convertToCSV(logs);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`📥 تم تصدير ${logs.length} سجل`);
        } catch (error) {
            console.error('خطأ في تصدير السجلات:', error);
            alert('حدث خطأ في تصدير السجلات');
        }
    }

    /**
     * تحويل السجلات إلى CSV
     * @param {array} logs - السجلات
     * @returns {string} CSV
     */
    convertToCSV(logs) {
        const headers = ['التاريخ', 'العملية', 'الجدول', 'المعرف', 'الوصف'];
        const rows = logs.map(log => [
            new Date(log.created_at || log.timestamp).toLocaleString('ar-IQ'),
            this.getActionLabel(log.action),
            this.getTableLabel(log.table_name),
            log.record_id || '-',
            log.description || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return '\uFEFF' + csvContent; // BOM for UTF-8
    }

    /**
     * الحصول على تسمية العملية بالعربية
     * @param {string} action - العملية
     * @returns {string} التسمية
     */
    getActionLabel(action) {
        const labels = {
            'create': 'إنشاء',
            'update': 'تعديل',
            'delete': 'حذف',
            'login': 'تسجيل دخول',
            'logout': 'تسجيل خروج',
            'payment': 'دفع',
            'restore': 'استرجاع'
        };
        return labels[action] || action;
    }

    /**
     * الحصول على تسمية الجدول بالعربية
     * @param {string} tableName - اسم الجدول
     * @returns {string} التسمية
     */
    getTableLabel(tableName) {
        const labels = {
            'products': 'المنتجات',
            'customers': 'الزبائن',
            'suppliers': 'الموردين',
            'invoices': 'فواتير المبيعات',
            'supplies': 'فواتير الشراء',
            'payments': 'المدفوعات',
            'profiles': 'الملف الشخصي'
        };
        return labels[tableName] || tableName;
    }

    /**
     * مسح السجلات المحلية
     */
    clearLocalLogs() {
        localStorage.removeItem(this.localStorageKey);
        console.log('🗑️ تم مسح السجلات المحلية');
    }

    /**
     * تعطيل/تفعيل التسجيل
     * @param {boolean} enabled - مفعّل؟
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`تسجيل العمليات: ${enabled ? 'مفعّل' : 'معطّل'}`);
    }

    /**
     * وظائف مساعدة للتسجيل السريع
     */
    async logCreate(tableName, recordId, data, description = null) {
        return this.log('create', tableName, recordId, null, data, description);
    }

    async logUpdate(tableName, recordId, oldData, newData, description = null) {
        return this.log('update', tableName, recordId, oldData, newData, description);
    }

    async logDelete(tableName, recordId, data, description = null) {
        return this.log('delete', tableName, recordId, data, null, description);
    }

    async logLogin(email) {
        return this.log('login', 'auth', null, null, { email }, 'تسجيل دخول ناجح');
    }

    async logLogout(email) {
        return this.log('logout', 'auth', null, null, { email }, 'تسجيل خروج');
    }
}

// إنشاء instance عام
const auditLogger = new AuditLogger();

// جعله متاحاً عالمياً
window.AuditLogger = AuditLogger;
window.auditLogger = auditLogger;
