/**
 * دوال مشتركة للحماية والتحميل
 * يجب تضمين هذا الملف في جميع الصفحات المحمية
 */

// حماية الصفحة والتحقق من Supabase session
async function protectPage() {
    const pageFlag = sessionStorage.getItem('page_loading');

    if (pageFlag) {
        sessionStorage.removeItem('page_loading');
        return true;
    }

    sessionStorage.setItem('page_loading', 'true');

    try {
        const session = await SupabaseDB.getSession();
        if (!session) {
            sessionStorage.removeItem('page_loading');
            window.location.href = 'index.html';
            return false;
        }

        const user = await SupabaseDB.getCurrentUser();

        // التحقق من إكمال setup
        try {
            const profile = await SupabaseDB.getProfile(user.id);
            if (!profile || profile.store_name === 'المحل') {
                sessionStorage.removeItem('page_loading');
                window.location.href = 'setup.html';
                return false;
            }
        } catch (error) {
            sessionStorage.removeItem('page_loading');
            window.location.href = 'setup.html';
            return false;
        }

        sessionStorage.removeItem('page_loading');
        
        // التحقق من قيود الضيف
        if (localStorage.getItem('is_guest') === 'true') {
            applyGuestRestrictions();
        }

        return true;
    } catch (error) {
        console.error('خطأ في المصادقة:', error);
        sessionStorage.removeItem('page_loading');
        window.location.href = 'index.html';
        return false;
    }
}

// تطبيق قيود الضيف على الواجهة
function applyGuestRestrictions() {
    const restrictAction = () => {
        // تعطيل جميع الأزرار التي تحتوي على كلمات تدل على إجراء
        const buttons = document.querySelectorAll('button, .btn, a.btn');
        buttons.forEach(btn => {
            const text = (btn.innerText || btn.textContent || "").trim();
            const restrictKeywords = ['حفظ', 'إضافة', 'حذف', 'تعديل', 'تغيير', 'إنشاء', 'تسجيل', 'save', 'add', 'delete', 'edit', 'update', 'create'];
            
            // تحقق من النص أو إذا كان الزر أيقونة حذف
            const isDeleteBtn = text.includes('حذف') || btn.innerHTML.includes('🗑️') || btn.innerHTML.includes('❌') || btn.title.includes('حذف');

            if (restrictKeywords.some(key => text.toLowerCase().includes(key)) || isDeleteBtn) {
                if (isDeleteBtn) {
                    btn.style.visibility = 'hidden'; // إخفاء أزرار الحذف تماماً
                    btn.style.pointerEvents = 'none';
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); alert('⚠️ عذراً، لا تملك صلاحية التعديل في حساب الضيف.'); return false; };
                    // منع الروابط <a>
                    if (btn.tagName === 'A') {
                        btn.href = 'javascript:void(0)';
                    }
                }
            }
        });

        // تعطيل جميع حقول الإدخال
        const inputs = document.querySelectorAll('input:not([type="search"]), select, textarea');
        inputs.forEach(input => {
            input.disabled = true;
            input.readOnly = true;
            input.style.backgroundColor = '#f0f0f0';
        });
    };

    // تشغيل القيد فوراً
    restrictAction();

    // تشغيل القيد عند كل تغيير في الصفحة (لتعطيل العناصر التي تضاف لاحقاً مثل صفوف الجداول)
    const observer = new MutationObserver(restrictAction);
    observer.observe(document.body, { childList: true, subtree: true });

    // إضافة شريط علوي ينبه المستخدم
    if (!document.getElementById('guestBanner')) {
        const guestBanner = document.createElement('div');
        guestBanner.id = 'guestBanner';
        guestBanner.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: #d32f2f; color: #fff; text-align: center; padding: 8px; font-weight: bold; z-index: 100000; box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-size: 14px;';
        guestBanner.innerHTML = '🕵️ أنت في "وضع العرض فقط" (حساب ضيف) | الإضافة والحذف معطلة | <a href="#" onclick="logout()" style="color: #fff; text-decoration: underline; margin-right: 15px;">تسجيل الخروج لإنشاء حسابك الخاص</a>';
        document.body.prepend(guestBanner);
        document.body.style.paddingTop = '40px';
    }
}

// إخفاء شاشة التحميل
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
    
    // إعادة التأكيد على قيود الضيف عند إخفاء التحميل (لأن البيانات تكون قد ظهرت)
    if (localStorage.getItem('is_guest') === 'true') {
        applyGuestRestrictions();
    }
}

// تسجيل الخروج
async function logout() {
    try {
        localStorage.removeItem('is_guest'); // إزالة وسم الضيف عند الخروج
        await SupabaseDB.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('حدث خطأ أثناء تسجيل الخروج');
    }
}

// الحصول على المستخدم الحالي
async function getCurrentUserData() {
    try {
        const user = await SupabaseDB.getCurrentUser();
        const profile = await SupabaseDB.getProfile(user.id);
        return { user, profile };
    } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        return null;
    }
}
