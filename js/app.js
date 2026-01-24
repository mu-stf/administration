/**
 * نظام إدارة المحل - التطبيق الرئيسي والمصادقة
 */

const App = {
    // مفاتيح التخزين
    KEYS: {
        PASSWORD: 'store_password',
        SESSION: 'store_session',
        SETTINGS: 'store_settings',
        PRODUCTS: 'store_products',
        CUSTOMERS: 'store_customers',
        INVOICES: 'store_invoices',
        SUPPLIES: 'store_supplies',
        INVOICE_NUMBER: 'store_invoice_number'
    },

    // التحقق من وجود كلمة مرور
    hasPassword() {
        return localStorage.getItem(this.KEYS.PASSWORD) !== null;
    },

    // تشفير كلمة المرور (SHA-256 بسيط)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'store_salt_2024');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    // إعداد كلمة المرور
    async setupPassword(password) {
        const hashedPassword = await this.hashPassword(password);
        localStorage.setItem(this.KEYS.PASSWORD, hashedPassword);

        // إعداد الإعدادات الافتراضية
        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
                storeName: 'المحل',
                phone: '',
                address: '',
                agentName: '',
                invoicePrefix: 'INV'
            }));
        }

        // إعداد رقم الفاتورة الابتدائي
        if (!localStorage.getItem(this.KEYS.INVOICE_NUMBER)) {
            localStorage.setItem(this.KEYS.INVOICE_NUMBER, '1');
        }
    },

    // التحقق من كلمة المرور
    async verifyPassword(password) {
        const hashedPassword = await this.hashPassword(password);
        const storedPassword = localStorage.getItem(this.KEYS.PASSWORD);
        return hashedPassword === storedPassword;
    },

    // إنشاء جلسة
    createSession() {
        const session = {
            token: this.generateToken(),
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
        };
        localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
        document.cookie = `session=${session.token}; path=/; max-age=86400`;
    },

    // توليد رمز الجلسة
    generateToken() {
        return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        );
    },

    // التحقق من الجلسة
    isAuthenticated() {
        const sessionStr = localStorage.getItem(this.KEYS.SESSION);
        if (!sessionStr) return false;

        try {
            const session = JSON.parse(sessionStr);
            if (Date.now() > session.expiresAt) {
                this.logout();
                return false;
            }
            return true;
        } catch {
            return false;
        }
    },

    // تسجيل الخروج
    logout() {
        localStorage.removeItem(this.KEYS.SESSION);
        document.cookie = 'session=; path=/; max-age=0';
        window.location.href = 'index.html';
    },

    // حماية الصفحة
    protectPage() {
        if (!this.hasPassword()) {
            window.location.href = 'setup.html';
            return false;
        }
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    // الحصول على الإعدادات
    getSettings() {
        const settings = localStorage.getItem(this.KEYS.SETTINGS);
        return settings ? JSON.parse(settings) : {
            storeName: 'المحل',
            phone: '',
            address: '',
            agentName: '',
            invoicePrefix: 'INV'
        };
    },

    // حفظ الإعدادات
    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    // الحصول على رقم الفاتورة التالي
    getNextInvoiceNumber() {
        const current = parseInt(localStorage.getItem(this.KEYS.INVOICE_NUMBER) || '1');
        const settings = this.getSettings();
        return `${settings.invoicePrefix}-${current.toString().padStart(5, '0')}`;
    },

    // زيادة رقم الفاتورة
    incrementInvoiceNumber() {
        const current = parseInt(localStorage.getItem(this.KEYS.INVOICE_NUMBER) || '1');
        localStorage.setItem(this.KEYS.INVOICE_NUMBER, (current + 1).toString());
    },

    // ===== المنتجات =====
    getProducts() {
        const products = localStorage.getItem(this.KEYS.PRODUCTS);
        return products ? JSON.parse(products) : [];
    },

    saveProducts(products) {
        localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
    },

    addProduct(product) {
        const products = this.getProducts();
        product.id = Utils.generateId();
        product.createdAt = new Date().toISOString();
        products.push(product);
        this.saveProducts(products);
        return product;
    },

    updateProduct(id, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.saveProducts(products);
            return products[index];
        }
        return null;
    },

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        this.saveProducts(filtered);
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    updateProductStock(id, quantity) {
        const product = this.getProductById(id);
        if (product) {
            this.updateProduct(id, { stock: product.stock + quantity });
        }
    },

    // ===== الزبائن =====
    getCustomers() {
        const customers = localStorage.getItem(this.KEYS.CUSTOMERS);
        return customers ? JSON.parse(customers) : [];
    },

    saveCustomers(customers) {
        localStorage.setItem(this.KEYS.CUSTOMERS, JSON.stringify(customers));
    },

    addCustomer(customer) {
        const customers = this.getCustomers();
        customer.id = Utils.generateId();
        customer.createdAt = new Date().toISOString();
        customers.push(customer);
        this.saveCustomers(customers);
        return customer;
    },

    updateCustomer(id, updates) {
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === id);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...updates };
            this.saveCustomers(customers);
            return customers[index];
        }
        return null;
    },

    deleteCustomer(id) {
        const customers = this.getCustomers();
        const filtered = customers.filter(c => c.id !== id);
        this.saveCustomers(filtered);
    },

    getCustomerById(id) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === id);
    },

    // ===== الفواتير =====
    getInvoices() {
        const invoices = localStorage.getItem(this.KEYS.INVOICES);
        return invoices ? JSON.parse(invoices) : [];
    },

    saveInvoices(invoices) {
        localStorage.setItem(this.KEYS.INVOICES, JSON.stringify(invoices));
    },

    createInvoice(invoiceData) {
        const invoices = this.getInvoices();
        const invoice = {
            id: Utils.generateId(),
            invoiceNumber: this.getNextInvoiceNumber(),
            date: new Date().toISOString(),
            status: 'active',
            ...invoiceData
        };

        // تحديث المخزون
        invoice.items.forEach(item => {
            this.updateProductStock(item.productId, -item.quantity);
        });

        invoices.push(invoice);
        this.saveInvoices(invoices);
        this.incrementInvoiceNumber();

        return invoice;
    },

    cancelInvoice(id) {
        const invoices = this.getInvoices();
        const invoice = invoices.find(i => i.id === id);

        if (invoice && invoice.status === 'active') {
            // إرجاع المخزون
            invoice.items.forEach(item => {
                this.updateProductStock(item.productId, item.quantity);
            });

            invoice.status = 'cancelled';
            invoice.cancelledAt = new Date().toISOString();
            this.saveInvoices(invoices);
            return true;
        }
        return false;
    },

    getInvoiceById(id) {
        const invoices = this.getInvoices();
        return invoices.find(i => i.id === id);
    },

    getActiveInvoices() {
        return this.getInvoices().filter(i => i.status === 'active');
    },

    // ===== التوريدات =====
    getSupplies() {
        const supplies = localStorage.getItem(this.KEYS.SUPPLIES);
        return supplies ? JSON.parse(supplies) : [];
    },

    saveSupplies(supplies) {
        localStorage.setItem(this.KEYS.SUPPLIES, JSON.stringify(supplies));
    },

    addSupply(supplyData) {
        const supplies = this.getSupplies();
        const supply = {
            id: Utils.generateId(),
            date: new Date().toISOString(),
            ...supplyData
        };

        // تحديث المخزون وسعر الشراء
        const product = this.getProductById(supply.productId);
        if (product) {
            this.updateProduct(supply.productId, {
                stock: product.stock + supply.quantity,
                purchasePrice: supply.purchasePrice
            });
        }

        supplies.push(supply);
        this.saveSupplies(supplies);
        return supply;
    },

    // ===== الإحصائيات =====
    getStatistics(startDate, endDate) {
        const invoices = this.getActiveInvoices().filter(invoice => {
            const date = new Date(invoice.date);
            return date >= startDate && date <= endDate;
        });

        let totalSales = 0;
        let totalCost = 0;
        const productSales = {};

        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                totalSales += item.salePrice * item.quantity;
                totalCost += item.purchasePrice * item.quantity;

                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        productName: item.productName,
                        quantity: 0,
                        total: 0
                    };
                }
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].total += item.salePrice * item.quantity;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            invoiceCount: invoices.length,
            totalSales,
            totalCost,
            profit: totalSales - totalCost,
            topProducts
        };
    }
};

// تصدير للاستخدام العام
window.App = App;
