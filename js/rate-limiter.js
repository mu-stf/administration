/**
 * Rate Limiter - نظام الحد من المحاولات المتكررة
 * يمنع هجمات Brute Force والمحاولات المتكررة
 */

class RateLimiter {
    constructor(maxAttempts = 5, timeWindow = 15 * 60 * 1000) { // 15 دقيقة افتراضياً
        this.maxAttempts = maxAttempts;
        this.timeWindow = timeWindow; // بالميلي ثانية
        this.storageKey = 'rate_limiter_data';
    }

    /**
     * الحصول على البيانات المخزنة
     */
    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    /**
     * حفظ البيانات
     */
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * تسجيل محاولة
     * @param {string} identifier - معرّف (email, IP, etc.)
     * @param {boolean} success - هل نجحت المحاولة؟
     */
    recordAttempt(identifier, success = false) {
        const data = this.getData();
        const now = Date.now();

        if (!data[identifier]) {
            data[identifier] = {
                attempts: [],
                blockedUntil: null
            };
        }

        // إزالة المحاولات القديمة خارج النافذة الزمنية
        data[identifier].attempts = data[identifier].attempts.filter(
            timestamp => now - timestamp < this.timeWindow
        );

        if (success) {
            // إعادة تعيين عند النجاح
            delete data[identifier];
        } else {
            // تسجيل محاولة فاشلة
            data[identifier].attempts.push(now);

            // فحص إذا تجاوز الحد الأقصى
            if (data[identifier].attempts.length >= this.maxAttempts) {
                data[identifier].blockedUntil = now + this.timeWindow;
            }
        }

        this.saveData(data);
        return data[identifier];
    }

    /**
     * فحص إذا كان المعرف محظور
     * @param {string} identifier - المعرف
     * @returns {object} {blocked: boolean, remainingTime: number, attempts: number}
     */
    isBlocked(identifier) {
        const data = this.getData();
        const now = Date.now();

        if (!data[identifier]) {
            return { blocked: false, remainingTime: 0, attempts: 0 };
        }

        // تنظيف المحاولات القديمة
        data[identifier].attempts = data[identifier].attempts.filter(
            timestamp => now - timestamp < this.timeWindow
        );

        const attempts = data[identifier].attempts.length;

        // فحص الحظر
        if (data[identifier].blockedUntil && now < data[identifier].blockedUntil) {
            const remainingTime = Math.ceil((data[identifier].blockedUntil - now) / 1000 / 60); // بالدقائق
            return { blocked: true, remainingTime, attempts };
        }

        // إزالة الحظر إذا انتهى
        if (data[identifier].blockedUntil && now >= data[identifier].blockedUntil) {
            delete data[identifier];
            this.saveData(data);
            return { blocked: false, remainingTime: 0, attempts: 0 };
        }

        return { blocked: false, remainingTime: 0, attempts };
    }

    /**
     * إعادة تعيين المحاولات لمعرف معين
     * @param {string} identifier - المعرف
     */
    reset(identifier) {
        const data = this.getData();
        delete data[identifier];
        this.saveData(data);
    }

    /**
     * مسح جميع البيانات
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * الحصول على عدد المحاولات المتبقية
     * @param {string} identifier - المعرف
     * @returns {number} عدد المحاولات المتبقية
     */
    getRemainingAttempts(identifier) {
        const status = this.isBlocked(identifier);
        if (status.blocked) return 0;
        return this.maxAttempts - status.attempts;
    }
}

/**
 * Rate Limiter خاص بتسجيل الدخول
 */
class LoginRateLimiter extends RateLimiter {
    constructor() {
        super(5, 15 * 60 * 1000); // 5 محاولات خلال 15 دقيقة
        this.storageKey = 'login_rate_limiter';
    }

    /**
     * فحص محاولة تسجيل دخول
     * @param {string} email - البريد الإلكتروني
     * @returns {object} معلومات الحالة
     */
    checkLogin(email) {
        const identifier = email.toLowerCase();
        return this.isBlocked(identifier);
    }

    /**
     * تسجيل محاولة تسجيل دخول
     * @param {string} email - البريد الإلكتروني
     * @param {boolean} success - هل نجحت؟
     */
    recordLogin(email, success) {
        const identifier = email.toLowerCase();
        return this.recordAttempt(identifier, success);
    }

    /**
     * الحصول على رسالة خطأ مناسبة
     * @param {string} email - البريد الإلكتروني
     * @returns {string|null} رسالة الخطأ أو null
     */
    getBlockMessage(email) {
        const status = this.checkLogin(email);
        
        if (!status.blocked) return null;

        return `⏱️ تم حظر تسجيل الدخول مؤقتاً بسبب المحاولات الفاشلة المتكررة.\n\nالمدة المتبقية: ${status.remainingTime} دقيقة.\n\nيُرجى المحاولة لاحقاً.`;
    }
}

/**
 * Rate Limiter خاص بعمليات API
 */
class APIRateLimiter extends RateLimiter {
    constructor() {
        super(100, 60 * 1000); // 100 طلب في الدقيقة
        this.storageKey = 'api_rate_limiter';
    }

    /**
     * فحص طلب API
     * @param {string} endpoint - نقطة النهاية
     * @param {string} userId - معرف المستخدم
     * @returns {boolean} true إذا كان مسموحاً
     */
    checkRequest(endpoint, userId) {
        const identifier = `${userId}_${endpoint}`;
        const status = this.isBlocked(identifier);
        
        if (!status.blocked) {
            this.recordAttempt(identifier, false);
        }
        
        return !status.blocked;
    }
}

/**
 * نظام شامل للحد من المحاولات
 */
const RateLimiterManager = {
    login: new LoginRateLimiter(),
    api: new APIRateLimiter(),

    /**
     * فحص محاولة تسجيل دخول
     * @param {string} email - البريد الإلكتروني
     * @returns {boolean} true إذا كان مسموحاً
     */
    canLogin(email) {
        const status = this.login.checkLogin(email);
        return !status.blocked;
    },

    /**
     * تسجيل محاولة تسجيل دخول
     * @param {string} email - البريد الإلكتروني
     * @param {boolean} success - النجاح
     */
    recordLoginAttempt(email, success) {
        this.login.recordLogin(email, success);
        
        if (!success) {
            const status = this.login.checkLogin(email);
            const remaining = this.login.getRemainingAttempts(email);
            
            console.warn(`⚠️ محاولة تسجيل دخول فاشلة لـ ${email}. المحاولات المتبقية: ${remaining}`);
            
            if (status.blocked) {
                // تسجيل في سجل الأمان
                if (window.SecurityUtils) {
                    SecurityUtils.logSuspiciousActivity('login_blocked', {
                        email,
                        remainingTime: status.remainingTime
                    });
                }
            }
        }
    },

    /**
     * الحصول على رسالة الحظر
     * @param {string} email - البريد الإلكتروني
     * @returns {string|null} الرسالة
     */
    getLoginBlockMessage(email) {
        return this.login.getBlockMessage(email);
    },

    /**
     * فحص طلب API
     * @param {string} endpoint - نقطة النهاية
     * @param {string} userId - معرف المستخدم
     * @returns {boolean} true إذا كان مسموحاً
     */
    canMakeAPIRequest(endpoint, userId) {
        return this.api.checkRequest(endpoint, userId);
    },

    /**
     * تنظيف البيانات القديمة (يُستدعى دورياً)
     */
    cleanup() {
        // تنظيف تلقائي كل ساعة
        setInterval(() => {
            console.log('🧹 تنظيف بيانات Rate Limiter...');
            // البيانات تُنظف تلقائياً عند الفحص
        }, 60 * 60 * 1000); // كل ساعة
    }
};

// بدء التنظيف التلقائي
RateLimiterManager.cleanup();

// جعل RateLimiter متاحاً عالمياً
window.RateLimiter = RateLimiter;
window.LoginRateLimiter = LoginRateLimiter;
window.APIRateLimiter = APIRateLimiter;
window.RateLimiterManager = RateLimiterManager;
