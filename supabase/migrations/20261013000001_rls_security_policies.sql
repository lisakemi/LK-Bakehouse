-- ============================================================================
-- LK BAKEHOUSE — SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Zero-Trust Role-Based Access Control
-- ============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL 25 TABLES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Retrieve the current user's role from user_profiles
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role_type AS $$
DECLARE
    v_role user_role_type;
BEGIN
    SELECT role INTO v_role
    FROM user_profiles
    WHERE auth_user_id = auth.uid() AND is_active = TRUE
    LIMIT 1;

    RETURN COALESCE(v_role, 'customer'::user_role_type);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is authorized staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth_user_role() IN ('admin', 'manager', 'cashier', 'baker', 'delivery_driver');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is management (Admin or Manager)
CREATE OR REPLACE FUNCTION is_management()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. POLICIES: PUBLIC CATALOG & STOREFRONT
-- ============================================================================

-- 3.1 Product Categories (Public read, management write)
CREATE POLICY "Public read active categories"
ON product_categories FOR SELECT
USING (is_active = TRUE OR is_staff());

CREATE POLICY "Management modify categories"
ON product_categories FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 3.2 Products (Public read available products, management write)
CREATE POLICY "Public read available products"
ON products FOR SELECT
USING ((is_available = TRUE AND is_archived = FALSE) OR is_staff());

CREATE POLICY "Management modify products"
ON products FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 3.3 Product Variants (Public read available variants)
CREATE POLICY "Public read available variants"
ON product_variants FOR SELECT
USING (is_available = TRUE OR is_staff());

CREATE POLICY "Management modify variants"
ON product_variants FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 3.4 Allergens & Product Allergens (Public read transparency)
CREATE POLICY "Public read allergens"
ON allergens FOR SELECT
USING (TRUE);

CREATE POLICY "Public read product allergens"
ON product_allergens FOR SELECT
USING (TRUE);

CREATE POLICY "Management modify allergens"
ON allergens FOR ALL
USING (is_management())
WITH CHECK (is_management());

CREATE POLICY "Management modify product allergens"
ON product_allergens FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 3.5 Promotions (Public read active and unexpired promotions)
CREATE POLICY "Public read active promotions"
ON promotions FOR SELECT
USING ((is_active = TRUE AND end_time >= clock_timestamp()) OR is_staff());

CREATE POLICY "Management modify promotions"
ON promotions FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 3.6 Business Settings (Public read non-sensitive settings)
CREATE POLICY "Public read business settings"
ON business_settings FOR SELECT
USING (TRUE);

CREATE POLICY "Management modify business settings"
ON business_settings FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- ============================================================================
-- 4. POLICIES: CUSTOMERS & USER PROFILES
-- ============================================================================

-- 4.1 User Profiles (Self-read/edit, staff read, admin modify)
CREATE POLICY "Self read user profile"
ON user_profiles FOR SELECT
USING (auth_user_id = auth.uid() OR is_staff());

CREATE POLICY "Self update own basic profile"
ON user_profiles FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid() AND role = (SELECT role FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin full manage user profiles"
ON user_profiles FOR ALL
USING (auth_user_role() = 'admin')
WITH CHECK (auth_user_role() = 'admin');

-- 4.2 Customers
CREATE POLICY "Customers view own record or staff view all"
ON customers FOR SELECT
USING (
    user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
    OR is_staff()
);

CREATE POLICY "Customers update own record"
ON customers FOR UPDATE
USING (user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
WITH CHECK (user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff create customers"
ON customers FOR INSERT
WITH CHECK (is_staff() OR user_profile_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()) OR auth.uid() IS NULL);

-- ============================================================================
-- 5. POLICIES: ORDERS & PAYMENTS (CRITICAL TRANSACTION SECURITY)
-- ============================================================================

-- 5.1 Orders
-- Customers can view only orders linked to their customer profile.
-- Staff can view all orders.
CREATE POLICY "Customers view own orders or staff view all"
ON orders FOR SELECT
USING (
    customer_id IN (
        SELECT c.id FROM customers c
        JOIN user_profiles u ON c.user_profile_id = u.id
        WHERE u.auth_user_id = auth.uid()
    )
    OR is_staff()
);

-- Public visitors / customers can insert new orders via secure server checkout
CREATE POLICY "Anyone or server can submit order"
ON orders FOR INSERT
WITH CHECK (TRUE);

-- Only authorized staff can update order status (e.g. preparing, ready, completed)
CREATE POLICY "Staff update order status"
ON orders FOR UPDATE
USING (is_staff())
WITH CHECK (is_staff());

-- 5.2 Order Items
-- Viewable if the parent order is accessible
CREATE POLICY "View order items if parent order accessible"
ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT o.id FROM orders o
        WHERE o.customer_id IN (
            SELECT c.id FROM customers c
            JOIN user_profiles u ON c.user_profile_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    )
    OR is_staff()
);

-- Immutable insertion on order creation
CREATE POLICY "Insert order items on order placement"
ON order_items FOR INSERT
WITH CHECK (TRUE);

-- 5.3 Payments (Financial Protection: Customers cannot edit payment status)
CREATE POLICY "Staff or linked customer view payments"
ON payments FOR SELECT
USING (
    is_staff()
    OR order_id IN (
        SELECT o.id FROM orders o
        JOIN customers c ON o.customer_id = c.id
        JOIN user_profiles u ON c.user_profile_id = u.id
        WHERE u.auth_user_id = auth.uid()
    )
);

CREATE POLICY "Staff record or verify payments"
ON payments FOR INSERT
WITH CHECK (is_staff());

CREATE POLICY "Management update payment records"
ON payments FOR UPDATE
USING (is_management())
WITH CHECK (is_management());

-- ============================================================================
-- 6. POLICIES: INVENTORY, RECIPES, PURCHASING & EXPENSES
-- ============================================================================

-- 6.1 Inventory Items
CREATE POLICY "Staff view inventory"
ON inventory_items FOR SELECT
USING (is_staff());

CREATE POLICY "Management modify inventory master"
ON inventory_items FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 6.2 Inventory Movements (Append-Only: Strictly no client update or delete)
CREATE POLICY "Staff view inventory movements"
ON inventory_movements FOR SELECT
USING (is_staff());

CREATE POLICY "Staff insert inventory movements"
ON inventory_movements FOR INSERT
WITH CHECK (is_staff());

-- 6.3 Recipes & Ingredients
CREATE POLICY "Staff view recipes"
ON recipes FOR SELECT
USING (is_staff());

CREATE POLICY "Staff view recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (is_staff());

CREATE POLICY "Management edit recipes"
ON recipes FOR ALL
USING (is_management())
WITH CHECK (is_management());

CREATE POLICY "Management edit recipe ingredients"
ON recipe_ingredients FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 6.4 Production Batches
CREATE POLICY "Staff view production batches"
ON production_batches FOR SELECT
USING (is_staff());

CREATE POLICY "Bakers and management manage production batches"
ON production_batches FOR ALL
USING (is_staff())
WITH CHECK (is_staff());

-- 6.5 Suppliers & Purchase Orders
CREATE POLICY "Staff view suppliers"
ON suppliers FOR SELECT
USING (is_staff());

CREATE POLICY "Management modify suppliers"
ON suppliers FOR ALL
USING (is_management())
WITH CHECK (is_management());

CREATE POLICY "Staff view purchase orders"
ON purchase_orders FOR SELECT
USING (is_staff());

CREATE POLICY "Staff view purchase order items"
ON purchase_order_items FOR SELECT
USING (is_staff());

CREATE POLICY "Management modify purchase orders"
ON purchase_orders FOR ALL
USING (is_management())
WITH CHECK (is_management());

CREATE POLICY "Management modify purchase order items"
ON purchase_order_items FOR ALL
USING (is_management())
WITH CHECK (is_management());

-- 6.6 Expenses & Central Financial Transactions (Strict Management Only)
CREATE POLICY "Management view and manage expenses"
ON expenses FOR ALL
USING (is_management())
WITH CHECK (is_management());

CREATE POLICY "Management view financial transactions"
ON financial_transactions FOR SELECT
USING (is_management());

CREATE POLICY "Management insert financial transactions"
ON financial_transactions FOR INSERT
WITH CHECK (is_management());

-- 6.7 Notifications
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
USING (
    target_user_profile_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    OR (is_staff() AND target_user_profile_id IS NULL)
);

CREATE POLICY "Users mark own notifications read"
ON notifications FOR UPDATE
USING (
    target_user_profile_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
);

-- 6.8 Audit Logs (Append-Only by system, viewable only by Admins)
CREATE POLICY "Admins view audit logs"
ON audit_logs FOR SELECT
USING (auth_user_role() = 'admin');

CREATE POLICY "Staff write audit logs"
ON audit_logs FOR INSERT
WITH CHECK (is_staff());
