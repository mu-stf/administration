/**
 * نظام إدارة المحل - الدوال المساعدة
 */

const Utils = {
    // توليد معرف فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // تنسيق العملة
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-IQ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' د.ع';
    },

    // تنسيق التاريخ
    formatDate(date) {
        return new Intl.DateTimeFormat('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },

    // تنسيق التاريخ والوقت
    formatDateTime(date) {
        return new Intl.DateTimeFormat('ar-IQ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    // تنسيق التاريخ للإدخال
    formatDateForInput(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    // الحصول على بداية اليوم
    getStartOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    // الحصول على نهاية اليوم
    getEndOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    // الحصول على بداية الشهر
    getStartOfMonth(date = new Date()) {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    // الحصول على نهاية الشهر
    getEndOfMonth(date = new Date()) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    // الحصول على بداية السنة
    getStartOfYear(date = new Date()) {
        const d = new Date(date);
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    // الحصول على نهاية السنة
    getEndOfYear(date = new Date()) {
        const d = new Date(date);
        d.setMonth(11, 31);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    // عرض رسالة تنبيه
    showAlert(message, type = 'success', duration = 3000) {
        const existingAlert = document.querySelector('.floating-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `floating-alert alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            min-width: 300px;
            animation: slideDown 0.3s ease;
        `;
        alert.innerHTML = `
            <span>${message}</span>
        `;
        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, duration);
    },

    // تأكيد الحذف
    async confirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.innerHTML = `
                <div class="modal" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>⚠️ تأكيد</h3>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 16px; text-align: center;">${message}</p>
                    </div>
                    <div class="modal-footer" style="justify-content: center;">
                        <button class="btn btn-danger" id="confirmYes">نعم، تأكيد</button>
                        <button class="btn btn-secondary" id="confirmNo">إلغاء</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#confirmYes').onclick = () => {
                overlay.remove();
                resolve(true);
            };
            overlay.querySelector('#confirmNo').onclick = () => {
                overlay.remove();
                resolve(false);
            };
        });
    },

    // إضافة الأنيميشن للـ CSS
    addAnimationStyles() {
        if (document.getElementById('utils-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'utils-animations';
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @keyframes slideUp {
                from { opacity: 1; transform: translateX(-50%) translateY(0); }
                to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
};

// إضافة الأنيميشن عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    Utils.addAnimationStyles();
});
