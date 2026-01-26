// دالة مشتركة لبناء sidebar بناءً على صلاحيات المستخدم

async function buildSidebar(currentPage = '') {
    try {
        const { user, profile } = await getCurrentUserData();
        
        // جميع الصفحات المتاحة
        const allPages = {
            'dashboard': { icon: '📊', name: 'لوحة التحكم', url: 'dashboard.html' },
            'new-invoice': { icon: '➕', name: 'فاتورة مبيعات', url: 'new-invoice.html' },
            'invoices': { icon: '📋', name: 'فواتير المبيعات', url: 'invoices.html' },
            'products': { icon: '📦', name: 'المنتجات', url: 'products.html' },
            'customers': { icon: '👥', name: 'الزبائن', url: 'customers.html' },
            'customer-accounts': { icon: '💰', name: 'حسابات الزبائن', url: 'customer-accounts.html' },
            'supplies': { icon: '📥', name: 'فواتير الشراء', url: 'supplies.html' },
            'new-purchase-invoice': { icon: '🛒', name: 'فاتورة شراء', url: 'new-purchase-invoice.html' },
            'statistics': { icon: '📈', name: 'الإحصائيات', url: 'statistics.html' },
            'receipts': { icon: '📝', name: 'الإيصالات', url: 'receipts.html' },
            'settings': { icon: '⚙️', name: 'الإعدادات', url: 'settings.html' },
            'manage-users': { icon: '👤', name: 'المستخدمين', url: 'manage-users.html' }
        };

        // الحصول على الصفحات المسموحة
        let allowedPages = profile.allowed_pages || [];
        
        // إذا كان admin، السماح بكل شيء
        if (profile.role === 'admin') {
            allowedPages = Object.keys(allPages);
        }

        // بناء HTML للـ sidebar
        let sidebarHTML = '<ul class="nav-menu">';
        
        for (const pageKey of allowedPages) {
            if (allPages[pageKey]) {
                const page = allPages[pageKey];
                const activeClass = currentPage === pageKey ? 'active' : '';
                sidebarHTML += `
                    <li class="nav-item">
                        <a href="${page.url}" class="nav-link ${activeClass}">
                            <span class="icon">${page.icon}</span>
                            ${page.name}
                        </a>
                    </li>
                `;
            }
        }
        
        sidebarHTML += '</ul>';
        
        // إدراج في الـ sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.innerHTML = sidebarHTML;
        }

        // فحص إذا المستخدم في صفحة غير مسموحة
        if (currentPage && !allowedPages.includes(currentPage) && profile.role !== 'admin') {
            alert('⛔ لا تملك صلاحية للوصول لهذه الصفحة!');
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error('خطأ في بناء sidebar:', error);
    }
}

// استخدام: 
// buildSidebar('dashboard'); // في dashboard.html
// buildSidebar('products'); // في products.html
