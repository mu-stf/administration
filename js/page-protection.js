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
        return true;
    } catch (error) {
        console.error('خطأ في المصادقة:', error);
        sessionStorage.removeItem('page_loading');
        window.location.href = 'index.html';
        return false;
    }
}

// إخفاء شاشة التحميل
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// تسجيل الخروج
async function logout() {
    try {
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
