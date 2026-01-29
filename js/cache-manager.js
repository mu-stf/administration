/**
 * نظام التخزين المؤقت للبيانات (Cache Manager)
 * يحسن الأداء ويحافظ على البيانات عند التنقل بين الصفحات
 */

const CacheManager = {
    // مدة صلاحية الكاش (5 دقائق)
    CACHE_DURATION: 5 * 60 * 1000,
    
    // مفتاح التخزين
    STORAGE_KEY: 'app_cache',
    
    /**
     * حفظ البيانات في الكاش
     */
    set(key, data) {
        try {
            const cache = this.getAll();
            cache[key] = {
                data: data,
                timestamp: Date.now()
            };
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ الكاش:', error);
            return false;
        }
    },
    
    /**
     * استرجاع البيانات من الكاش
     */
    get(key) {
        try {
            const cache = this.getAll();
            const item = cache[key];
            
            if (!item) return null;
            
            // التحقق من صلاحية الكاش
            const isExpired = (Date.now() - item.timestamp) > this.CACHE_DURATION;
            
            if (isExpired) {
                this.remove(key);
                return null;
            }
            
            return item.data;
        } catch (error) {
            console.error('خطأ في قراءة الكاش:', error);
            return null;
        }
    },
    
    /**
     * حذف عنصر من الكاش
     */
    remove(key) {
        try {
            const cache = this.getAll();
            delete cache[key];
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
            return true;
        } catch (error) {
            console.error('خطأ في حذف الكاش:', error);
            return false;
        }
    },
    
    /**
     * الحصول على جميع البيانات المخزنة
     */
    getAll() {
        try {
            const data = sessionStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('خطأ في قراءة الكاش:', error);
            return {};
        }
    },
    
    /**
     * مسح جميع البيانات المخزنة
     */
    clear() {
        try {
            sessionStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('خطأ في مسح الكاش:', error);
            return false;
        }
    },
    
    /**
     * حفظ حالة الصفحة (للنماذج والفلاتر)
     */
    savePageState(pageName, state) {
        return this.set(`page_state_${pageName}`, state);
    },
    
    /**
     * استرجاع حالة الصفحة
     */
    getPageState(pageName) {
        return this.get(`page_state_${pageName}`);
    },
    
    /**
     * حفظ البيانات مع التحديث التلقائي
     */
    async getOrFetch(key, fetchFunction, forceRefresh = false) {
        if (!forceRefresh) {
            const cached = this.get(key);
            if (cached) {
                console.log(`✅ تم تحميل ${key} من الكاش`);
                return cached;
            }
        }
        
        console.log(`🔄 جاري تحميل ${key} من قاعدة البيانات...`);
        const data = await fetchFunction();
        this.set(key, data);
        return data;
    }
};

/**
 * دالة مساعدة لتحميل البيانات مع الكاش
 */
async function loadWithCache(cacheKey, fetchFunction, forceRefresh = false) {
    return await CacheManager.getOrFetch(cacheKey, fetchFunction, forceRefresh);
}

/**
 * مسح الكاش عند تسجيل الخروج
 */
function clearCacheOnLogout() {
    CacheManager.clear();
}

// تصدير للاستخدام العام
window.CacheManager = CacheManager;
window.loadWithCache = loadWithCache;
window.clearCacheOnLogout = clearCacheOnLogout;
