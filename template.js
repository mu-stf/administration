// تحديث سريع لجميع الصفحات
// نسخ paste هذا الكود في أي صفحة HTML

// في بداية <body>:
const loadingHTML = `
<div id="loadingOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; z-index: 9999;">
    <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">🏪</div>
        <div style="font-size: 18px; color: #666;">جاري التحميل...</div>
    </div>
</div>
`;

// في نهاية <body> قبل </body>:
const scriptsHTML = `
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script src="js/page-protection.js"></script>
<script src="js/utils.js"></script>
<script>
    let currentUser = null;
    let currentProfile = null;

    protectPage().then(authorized => {
        if (authorized) {
            loadPage();
        }
    });

    async function loadPage() {
        const userData = await getCurrentUserData();
        currentUser = userData.user;
        currentProfile = userData.profile;
        
        document.getElementById('storeName').textContent = currentProfile.store_name;
        
        // TODO: أضف كود الصفحة هنا
        
        hideLoading();
    }
</script>
`;
