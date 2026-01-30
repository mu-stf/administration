/**
 * Security Utilities - نظام الحماية الأمنية
 * يوفر وظائف لحماية التطبيق من الهجمات الشائعة
 */

const SecurityUtils = {
    /**
     * تنظيف المدخلات من أكواد HTML و JavaScript الخبيثة (XSS Protection)
     * @param {string} input - النص المراد تنظيفه
     * @returns {string} النص النظيف
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // إزالة HTML tags
        const div = document.createElement('div');
        div.textContent = input;
        let sanitized = div.innerHTML;
        
        // إزالة أحرف خاصة خطيرة
        sanitized = sanitized
            .replace(/[<>]/g, '') // إزالة < و >
            .replace(/javascript:/gi, '') // إزالة javascript:
            .replace(/on\w+\s*=/gi, ''); // إزالة event handlers مثل onclick=
        
        return sanitized.trim();
    },

    /**
     * تنظيف شامل للكائنات (Objects)
     * @param {object} obj - الكائن المراد تنظيفه
     * @returns {object} الكائن النظيف
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sanitized = {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                sanitized[key] = this.sanitizeInput(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitized[key] = this.sanitizeObject(obj[key]);
            } else {
                sanitized[key] = obj[key];
            }
        }
        return sanitized;
    },

    /**
     * التحقق من صحة البريد الإلكتروني
     * @param {string} email - البريد الإلكتروني
     * @returns {boolean} true إذا كان صحيحاً
     */
    validateEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * التحقق من رقم الهاتف العراقي
     * @param {string} phone - رقم الهاتف
     * @returns {boolean} true إذا كان صحيحاً
     */
    validatePhone(phone) {
        if (!phone) return true; // اختياري
        
        // إزالة المسافات والأحرف الخاصة
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        // أرقام عراقية: تبدأ بـ 07 وطولها 11 رقم
        const iraqiPhoneRegex = /^07[3-9]\d{8}$/;
        
        return iraqiPhoneRegex.test(cleaned) || /^\d{10,11}$/.test(cleaned);
    },

    /**
     * التحقق من قوة كلمة المرور
     * @param {string} password - كلمة المرور
     * @returns {object} {strength: 'weak'|'medium'|'strong', score: 0-100, messages: []}
     */
    checkPasswordStrength(password) {
        if (!password) return { strength: 'weak', score: 0, messages: ['كلمة المرور مطلوبة'] };
        
        const messages = [];
        let score = 0;
        
        // الطول
        if (password.length >= 8) {
            score += 25;
        } else {
            messages.push('يجب أن تكون 8 أحرف على الأقل');
        }
        
        // أحرف كبيرة
        if (/[A-Z]/.test(password)) {
            score += 25;
        } else {
            messages.push('يجب أن تحتوي على حرف كبير');
        }
        
        // أحرف صغيرة
        if (/[a-z]/.test(password)) {
            score += 25;
        } else {
            messages.push('يجب أن تحتوي على حرف صغير');
        }
        
        // أرقام
        if (/\d/.test(password)) {
            score += 15;
        } else {
            messages.push('يجب أن تحتوي على رقم');
        }
        
        // رموز خاصة
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 10;
        }
        
        let strength = 'weak';
        if (score >= 75) strength = 'strong';
        else if (score >= 50) strength = 'medium';
        
        return { strength, score, messages };
    },

    /**
     * إنشاء CSRF Token
     * @returns {string} token عشوائي
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * حفظ CSRF Token في Session Storage
     */
    setCSRFToken() {
        const token = this.generateCSRFToken();
        sessionStorage.setItem('csrf_token', token);
        return token;
    },

    /**
     * التحقق من CSRF Token
     * @param {string} token - الـ token للتحقق منه
     * @returns {boolean} true إذا كان صحيحاً
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        return storedToken === token;
    },

    /**
     * التحقق من صحة الأرقام
     * @param {any} value - القيمة
     * @param {number} min - الحد الأدنى (اختياري)
     * @param {number} max - الحد الأقصى (اختياري)
     * @returns {boolean} true إذا كانت صحيحة
     */
    validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        
        return true;
    },

    /**
     * تنظيف اسم الملف
     * @param {string} filename - اسم الملف
     * @returns {string} اسم ملف آمن
     */
    sanitizeFilename(filename) {
        if (!filename) return '';
        
        // السماح فقط بالأحرف والأرقام والنقاط والشرطات
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.{2,}/g, '.') // منع ..
            .substring(0, 255); // الحد الأقصى للطول
    },

    /**
     * التحقق من امتداد الملف المسموح
     * @param {string} filename - اسم الملف
     * @param {array} allowedExtensions - الامتدادات المسموحة مثل ['jpg', 'png']
     * @returns {boolean} true إذا كان مسموحاً
     */
    validateFileExtension(filename, allowedExtensions = []) {
        if (!filename || allowedExtensions.length === 0) return false;
        
        const extension = filename.split('.').pop().toLowerCase();
        return allowedExtensions.includes(extension);
    },

    /**
     * تشفير بسيط للبيانات الحساسة في LocalStorage
     * @param {string} key - المفتاح
     * @param {any} value - القيمة
     */
    secureLocalStorage: {
        set(key, value) {
            const jsonValue = JSON.stringify(value);
            // Base64 encoding كطبقة حماية بسيطة
            const encoded = btoa(jsonValue);
            localStorage.setItem(key, encoded);
        },
        
        get(key) {
            const encoded = localStorage.getItem(key);
            if (!encoded) return null;
            
            try {
                const decoded = atob(encoded);
                return JSON.parse(decoded);
            } catch (error) {
                console.error('Error decoding secure storage:', error);
                return null;
            }
        },
        
        remove(key) {
            localStorage.removeItem(key);
        }
    },

    /**
     * فحص المدخلات من SQL Injection (إضافي)
     * @param {string} input - المدخل
     * @returns {boolean} true إذا كان آمناً
     */
    checkSQLInjection(input) {
        if (typeof input !== 'string') return true;
        
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
            /(--|;|\/\*|\*\/|xp_|sp_)/gi,
            /('|"|\b(OR|AND)\b.*=)/gi
        ];
        
        return !sqlPatterns.some(pattern => pattern.test(input));
    },

    /**
     * تسجيل محاولة مشبوهة
     * @param {string} type - نوع المحاولة
     * @param {object} details - التفاصيل
     */
    logSuspiciousActivity(type, details = {}) {
        const log = {
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...details
        };
        
        console.warn('🚨 نشاط مشبوه:', log);
        
        // حفظ في LocalStorage للمراجعة
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        logs.push(log);
        
        // الاحتفاظ بآخر 100 سجل فقط
        if (logs.length > 100) logs.shift();
        
        localStorage.setItem('security_logs', JSON.stringify(logs));
    },

    /**
     * مسح سجلات الأمان
     */
    clearSecurityLogs() {
        localStorage.removeItem('security_logs');
    },

    /**
     * الحصول على سجلات الأمان
     * @returns {array} السجلات
     */
    getSecurityLogs() {
        return JSON.parse(localStorage.getItem('security_logs') || '[]');
    },

    /**
     * قائمة بأشهر كلمات المرور المخترقة
     */
    BREACHED_PASSWORDS: [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password1', '12345678', '111111', '1234567', 'sunshine',
        'qwerty123', 'princess', 'admin', 'welcome', 'monkey',
        'login', 'starwars', 'dragon', 'passw0rd', 'master',
        'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1',
        '654321', 'jordan23', 'harley', 'password123', 'iloveyou',
        'letmein', '1234567890', '123123', 'football', 'summer',
        'bailey', 'shadow', 'superman', 'qwertyuiop', '123qwe',
        'baseball', 'michael', 'liverpool', 'killer', 'ashley',
        'charlie', 'donald', 'batman', 'jessica', 'computer'
    ],

    /**
     * فحص إذا كانت كلمة المرور في قائمة المخترقة
     * @param {string} password - كلمة المرور
     * @returns {boolean} true إذا كانت مخترقة
     */
    isBreachedPassword(password) {
        if (!password) return false;
        
        const lowerPassword = password.toLowerCase();
        
        // فحص مباشر
        if (this.BREACHED_PASSWORDS.includes(lowerPassword)) {
            return true;
        }
        
        // فحص إذا كانت تحتوي على كلمات شائعة
        const containsCommon = this.BREACHED_PASSWORDS.some(common => 
            lowerPassword.includes(common) && common.length >= 5
        );
        
        return containsCommon;
    },

    /**
     * فحص شامل لأمان كلمة المرور
     * @param {string} password - كلمة المرور
     * @returns {object} نتيجة الفحص
     */
    validatePasswordSecurity(password) {
        if (!password) {
            return {
                valid: false,
                message: 'كلمة المرور مطلوبة',
                isBreached: false,
                strength: null
            };
        }
        
        // فحص الاختراق
        if (this.isBreachedPassword(password)) {
            return {
                valid: false,
                message: '❌ كلمة مرور مخترقة!\n\nهذه الكلمة ظهرت في تسريبات بيانات سابقة.\nيُرجى اختيار كلمة مرور مختلفة وفريدة.',
                isBreached: true,
                strength: null
            };
        }
        
        // فحص القوة
        const strength = this.checkPasswordStrength(password);
        
        if (strength.strength === 'weak') {
            return {
                valid: false,
                message: '⚠️ كلمة المرور ضعيفة!\n\n' + strength.messages.join('\n'),
                isBreached: false,
                strength: strength
            };
        }
        
        return {
            valid: true,
            message: '✅ كلمة مرور قوية وآمنة',
            isBreached: false,
            strength: strength
        };
    }
};

// جعل SecurityUtils متاحاً عالمياً
window.SecurityUtils = SecurityUtils;
