/**
 * Supabase Client - إدارة الاتصال مع قاعدة البيانات
 */

// تحقق من وجود التكوين
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error('⚠️ لم يتم العثور على ملف التكوين! الرجاء إنشاء js/config.js');
}

// إنشاء Supabase client (واحد مشترك لجميع الصفحات)
const { createClient } = supabase;
const supabaseClient = SUPABASE_CONFIG ? createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    }
) : null;

const SupabaseDB = {
    client: supabaseClient,

    // التحقق من الاتصال
    async checkConnection() {
        try {
            const { data, error } = await this.client.from('profiles').select('count').single();
            if (error && error.code !== 'PGRST116') throw error;
            return true;
        } catch (error) {
            console.error('خطأ في الاتصال بـ Supabase:', error);
            return false;
        }
    },

    // ===== المصادقة =====

    // تسجيل مستخدم جديد
    async signUp(email, password) {
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    // تسجيل الدخول
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    // تسجيل الخروج
    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
    },

    // الحصول على المستخدم الحالي
    async getCurrentUser() {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    },

    // الحصول على الجلسة
    async getSession() {
        const { data: { session } } = await this.client.auth.getSession();
        return session;
    },

    // ===== الملف الشخصي (Profile) =====

    async getProfile(userId) {
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateProfile(userId, updates) {
        const { data, error } = await this.client
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ===== المنتجات =====

    async getProducts(userId) {
        const { data, error } = await this.client
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addProduct(userId, product) {
        const { data, error } = await this.client
            .from('products')
            .insert([{ ...product, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProduct(productId, updates) {
        const { data, error } = await this.client
            .from('products')
            .update(updates)
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteProduct(productId) {
        const { error } = await this.client
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;
    },

    async getProductById(productId) {
        const { data, error } = await this.client
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;
        return data;
    },

    // ===== الزبائن =====

    async getCustomers(userId) {
        const { data, error } = await this.client
            .from('customers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addCustomer(userId, customer) {
        const { data, error } = await this.client
            .from('customers')
            .insert([{ ...customer, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateCustomer(customerId, updates) {
        const { data, error } = await this.client
            .from('customers')
            .update(updates)
            .eq('id', customerId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCustomer(customerId) {
        const { error } = await this.client
            .from('customers')
            .delete()
            .eq('id', customerId);

        if (error) throw error;
    },

    // ===== الفواتير =====

    async getInvoices(userId) {
        const { data, error } = await this.client
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createInvoice(userId, invoice, items) {
        // إنشاء الفاتورة
        const { data: invoiceData, error: invoiceError } = await this.client
            .from('invoices')
            .insert([{ ...invoice, user_id: userId }])
            .select()
            .single();

        if (invoiceError) throw invoiceError;

        // إضافة عناصر الفاتورة
        const itemsWithInvoiceId = items.map(item => ({
            ...item,
            invoice_id: invoiceData.id
        }));

        const { data: itemsData, error: itemsError } = await this.client
            .from('invoice_items')
            .insert(itemsWithInvoiceId)
            .select();

        if (itemsError) throw itemsError;

        // تحديث المخزون
        for (const item of items) {
            if (item.product_id) {
                const product = await this.getProductById(item.product_id);
                await this.updateProduct(item.product_id, {
                    stock: product.stock - item.quantity
                });
            }
        }

        // إذا كانت آجل، تحديث balance الزبون
        if (invoice.payment_type === 'credit' && invoice.customer_id && invoice.remaining_amount > 0) {
            const { data: customer } = await this.client
                .from('customers')
                .select('balance')
                .eq('id', invoice.customer_id)
                .single();

            if (customer) {
                await this.updateCustomer(invoice.customer_id, {
                    balance: (customer.balance || 0) + invoice.remaining_amount
                });
            }
        }

        return { ...invoiceData, invoice_items: itemsData };
    },


    async cancelInvoice(invoiceId) {
        // الحصول على الفاتورة وعناصرها
        const { data: invoice, error: invoiceError } = await this.client
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('id', invoiceId)
            .single();

        if (invoiceError) throw invoiceError;

        if (invoice.status !== 'active') {
            throw new Error('الفاتورة ملغاة مسبقاً');
        }

        // إرجاع المخزون
        for (const item of invoice.invoice_items) {
            if (item.product_id) {
                const product = await this.getProductById(item.product_id);
                await this.updateProduct(item.product_id, {
                    stock: product.stock + item.quantity
                });
            }
        }

        // تحديث حالة الفاتورة
        const { data, error } = await this.client
            .from('invoices')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ===== التوريدات =====

    async getSupplies(userId) {
        const { data, error } = await this.client
            .from('supplies')
            .select('*, products(name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addSupply(userId, supply) {
        const { data, error } = await this.client
            .from('supplies')
            .insert([{ ...supply, user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        // تحديث المخزون وسعر الشراء
        const product = await this.getProductById(supply.product_id);
        await this.updateProduct(supply.product_id, {
            stock: product.stock + supply.quantity,
            purchase_price: supply.purchase_price
        });

        return data;
    },

    // ===== المدفوعات (Payments) =====

    async getPayments(userId) {
        const { data, error } = await this.client
            .from('payments')
            .select('*, customers(name), invoices(invoice_number)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getCustomerPayments(customerId) {
        const { data, error } = await this.client
            .from('payments')
            .select('*, invoices(invoice_number)')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addPayment(userId, payment) {
        const { data, error } = await this.client
            .from('payments')
            .insert([{ ...payment, user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        // تحديث balance الزبون
        if (payment.customer_id && payment.amount > 0) {
            const { data: customer } = await this.client
                .from('customers')
                .select('balance')
                .eq('id', payment.customer_id)
                .single();

            if (customer) {
                await this.updateCustomer(payment.customer_id, {
                    balance: (customer.balance || 0) - payment.amount
                });
            }
        }

        return data;
    },

    async getCustomerBalance(customerId) {
        const { data, error } = await this.client
            .from('customers')
            .select('balance')
            .eq('id', customerId)
            .single();

        if (error) throw error;
        return data?.balance || 0;
    },

    // ===== الإحصائيات =====

    async getStatistics(userId, startDate, endDate) {
        const { data: invoices, error } = await this.client
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

        if (error) throw error;

        let totalSales = 0;
        let totalCost = 0;
        const productSales = {};

        invoices.forEach(invoice => {
            invoice.invoice_items.forEach(item => {
                totalSales += item.sale_price * item.quantity;
                totalCost += item.purchase_price * item.quantity;

                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        productId: item.product_id,
                        productName: item.product_name,
                        quantity: 0,
                        total: 0
                    };
                }
                productSales[item.product_id].quantity += item.quantity;
                productSales[item.product_id].total += item.sale_price * item.quantity;
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
window.SupabaseDB = SupabaseDB;
