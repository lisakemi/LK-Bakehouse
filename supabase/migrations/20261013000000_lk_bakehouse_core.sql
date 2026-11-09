-- ============================================================================
-- LK BAKEHOUSE — COMPREHENSIVE RELATIONAL DATABASE MIGRATION SCRIPT
-- Database Engine: PostgreSQL 15+ / Supabase
-- Target Timezone: Africa/Dar_es_Salaam (EAT, UTC+3)
-- Currency: Tanzanian Shillings (TZS) using fixed-precision NUMERIC
-- Primary Key Strategy: UUID v4 (gen_random_uuid())
-- ============================================================================

-- 0. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS & DOMAIN TYPES
-- ============================================================================
CREATE TYPE user_role_type AS ENUM (
    'admin',
    'manager',
    'cashier',
    'baker',
    'delivery_driver',
    'customer'
);

CREATE TYPE order_status_type AS ENUM (
    'pending_review',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'out_for_delivery',
    'completed',
    'cancelled'
);

CREATE TYPE order_source_type AS ENUM (
    'website',
    'pos'
);

CREATE TYPE fulfillment_type AS ENUM (
    'pickup',
    'delivery'
);

CREATE TYPE payment_method_type AS ENUM (
    'cash',
    'm_pesa',
    'tigo_pesa',
    'airtel_money',
    'bank_transfer',
    'card'
);

CREATE TYPE payment_status_type AS ENUM (
    'pending',
    'verified',
    'failed',
    'refunded'
);

CREATE TYPE inventory_movement_type AS ENUM (
    'purchase_received',
    'production_consumed',
    'pos_sale',
    'online_sale',
    'spoilage_wastage',
    'audit_adjustment',
    'supplier_return'
);

CREATE TYPE purchase_order_status AS ENUM (
    'draft',
    'ordered',
    'partially_received',
    'received',
    'cancelled'
);

CREATE TYPE expense_category_type AS ENUM (
    'ingredients',
    'packaging',
    'utilities_energy',
    'premises_rent',
    'salaries_wages',
    'equipment_maintenance',
    'marketing_promotion',
    'logistics_delivery',
    'other'
);

CREATE TYPE discount_type AS ENUM (
    'percentage',
    'fixed_amount'
);

CREATE TYPE notification_type AS ENUM (
    'order_submitted',
    'order_status_changed',
    'payment_received',
    'stock_low',
    'customer_inquiry',
    'system_alert'
);

-- ============================================================================
-- 2. CORE DATABASE TABLES
-- ============================================================================

-- 2.1 Staff & User Profiles (Linked to supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) ON DELETE SET NULL
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    role user_role_type NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.2 Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    default_delivery_address TEXT,
    delivery_landmarks TEXT,
    total_lifetime_orders INT NOT NULL DEFAULT 0 CHECK (total_lifetime_orders >= 0),
    total_lifetime_spend_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_lifetime_spend_tzs >= 0),
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.3 Product Categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.4 Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    base_price_tzs NUMERIC(14, 2) NOT NULL CHECK (base_price_tzs >= 0),
    lead_time_hours INT NOT NULL DEFAULT 2 CHECK (lead_time_hours >= 0),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.5 Product Variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- e.g. "6-inch", "8-inch", "Box of 4"
    sku VARCHAR(60) UNIQUE,
    price_adjustment_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_product_variant_name UNIQUE (product_id, variant_name)
);

-- 2.6 Allergens
CREATE TABLE allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.7 Product Allergens Junction
CREATE TABLE product_allergens (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,
    notes VARCHAR(200),
    PRIMARY KEY (product_id, allergen_id)
);

-- 2.8 Seasonal Promotions & Discounts
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value NUMERIC(14, 2) NOT NULL CHECK (discount_value > 0),
    minimum_order_spend_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (minimum_order_spend_tzs >= 0),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    usage_limit INT,
    times_used INT NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_promotion_valid_period CHECK (end_time > start_time)
);

-- 2.9 Promotion-Product Junction (Optional scoping)
CREATE TABLE promotion_products (
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, product_id)
);

-- 2.10 Customer Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(40) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(255),
    source order_source_type NOT NULL DEFAULT 'website',
    fulfillment_type fulfillment_type NOT NULL DEFAULT 'pickup',
    scheduled_fulfillment_time TIMESTAMPTZ,
    delivery_street_address TEXT,
    delivery_notes TEXT,
    status order_status_type NOT NULL DEFAULT 'pending_review',
    
    -- Immutable financial snapshots
    subtotal_tzs NUMERIC(14, 2) NOT NULL CHECK (subtotal_tzs >= 0),
    discount_amount_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount_tzs >= 0),
    delivery_fee_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee_tzs >= 0),
    total_amount_tzs NUMERIC(14, 2) NOT NULL CHECK (total_amount_tzs >= 0),
    
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    promotion_code_used VARCHAR(50),
    
    customer_notes TEXT,
    cashier_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_order_financial_balance CHECK (total_amount_tzs = (subtotal_tzs - discount_amount_tzs + delivery_fee_tzs))
);

-- 2.11 Order Items (Permanent Snapshot of Historical Price and Attributes)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Historical snapshot columns (must not mutate when master product is edited)
    product_name VARCHAR(150) NOT NULL,
    variant_name VARCHAR(100),
    unit_price_tzs NUMERIC(14, 2) NOT NULL CHECK (unit_price_tzs >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    discount_applied_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_applied_tzs >= 0),
    line_total_tzs NUMERIC(14, 2) NOT NULL CHECK (line_total_tzs >= 0),
    customization_instructions TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_order_item_line_total CHECK (line_total_tzs = ((unit_price_tzs * quantity) - discount_applied_tzs))
);

-- 2.12 Payment Records
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    payment_method payment_method_type NOT NULL,
    amount_tzs NUMERIC(14, 2) NOT NULL CHECK (amount_tzs > 0),
    status payment_status_type NOT NULL DEFAULT 'pending',
    transaction_reference VARCHAR(100), -- e.g. M-Pesa transaction ID, Bank reference
    gateway_response_payload JSONB,
    verified_by_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.13 Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_person VARCHAR(120),
    phone_number VARCHAR(30),
    email VARCHAR(255),
    physical_address TEXT,
    payment_terms VARCHAR(100),
    tax_identification_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.14 Inventory Items (Raw Materials, Ingredients, Packaging, Resale)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL, -- 'ingredient', 'packaging', 'consumable'
    unit_of_measurement VARCHAR(30) NOT NULL, -- 'kg', 'g', 'liters', 'pcs'
    quantity_on_hand NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (quantity_on_hand >= 0),
    reorder_threshold NUMERIC(12, 3) NOT NULL DEFAULT 5.000 CHECK (reorder_threshold >= 0),
    standard_unit_cost_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (standard_unit_cost_tzs >= 0),
    primary_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    storage_bin_location VARCHAR(80),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.15 Double-Entry Inventory Movements (Append-Only Audit Ledger)
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    movement_type inventory_movement_type NOT NULL,
    quantity_delta NUMERIC(12, 3) NOT NULL, -- Positive for incoming, negative for outgoing
    balance_after_movement NUMERIC(12, 3) NOT NULL,
    unit_cost_tzs NUMERIC(14, 2),
    source_reference_id VARCHAR(100), -- PO number, Order number, Batch ID
    recorded_by_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.16 Recipes (Product Formulations)
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    recipe_name VARCHAR(150) NOT NULL,
    batch_yield_quantity INT NOT NULL DEFAULT 1 CHECK (batch_yield_quantity > 0),
    yield_unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
    preparation_instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.17 Recipe Ingredients
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(12, 3) NOT NULL CHECK (quantity_required > 0),
    unit VARCHAR(30) NOT NULL,
    wastage_allowance_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (wastage_allowance_percent >= 0),
    CONSTRAINT uq_recipe_ingredient UNIQUE (recipe_id, inventory_item_id)
);

-- 2.18 Production Batches
CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(50) NOT NULL UNIQUE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    batches_planned INT NOT NULL DEFAULT 1 CHECK (batches_planned > 0),
    quantity_produced INT NOT NULL DEFAULT 0 CHECK (quantity_produced >= 0),
    status VARCHAR(40) NOT NULL DEFAULT 'completed', -- 'scheduled', 'in_oven', 'completed', 'discarded'
    baker_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    bake_start_time TIMESTAMPTZ,
    bake_finish_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.19 Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    ordered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_received_date DATE,
    status purchase_order_status NOT NULL DEFAULT 'ordered',
    total_cost_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_cost_tzs >= 0),
    amount_paid_tzs NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid_tzs >= 0),
    outstanding_balance_tzs NUMERIC(14, 2) GENERATED ALWAYS AS (total_cost_tzs - amount_paid_tzs) STORED,
    created_by_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.20 Purchase Order Items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(12, 3) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (quantity_received >= 0),
    unit_cost_tzs NUMERIC(14, 2) NOT NULL CHECK (unit_cost_tzs >= 0),
    line_total_tzs NUMERIC(14, 2) NOT NULL CHECK (line_total_tzs >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_po_item_line_total CHECK (line_total_tzs = (quantity_ordered * unit_cost_tzs))
);

-- 2.21 Operating Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_category expense_category_type NOT NULL,
    amount_tzs NUMERIC(14, 2) NOT NULL CHECK (amount_tzs > 0),
    payment_method payment_method_type NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payee_vendor VARCHAR(150),
    reference_number VARCHAR(100),
    authorized_by_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    receipt_attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.22 Central Financial Transactions Ledger
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(60) NOT NULL UNIQUE,
    transaction_type VARCHAR(50) NOT NULL, -- 'sale_revenue', 'supplier_payment', 'operating_expense', 'refund'
    amount_tzs NUMERIC(14, 2) NOT NULL, -- Positive for incoming cash, negative for disbursements
    payment_method payment_method_type NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    external_reference VARCHAR(100),
    recorded_by_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.23 Customer & Staff Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    reference_entity_type VARCHAR(50), -- 'orders', 'inventory', 'system'
    reference_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.24 Business Settings & Parameters
CREATE TABLE business_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(30) NOT NULL DEFAULT 'string',
    description TEXT,
    updated_by_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2.25 Comprehensive Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(80) NOT NULL, -- 'CREATE_ORDER', 'STATUS_CHANGE', 'PRICE_OVERRIDE', 'STOCK_ADJUST'
    table_name VARCHAR(80) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    old_state JSONB,
    new_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available) WHERE is_available = TRUE AND is_archived = FALSE;
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_reference ON payments(transaction_reference);
CREATE INDEX idx_inventory_items_reorder ON inventory_items(quantity_on_hand) WHERE quantity_on_hand <= reorder_threshold;
CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(expense_category);
CREATE INDEX idx_notifications_target ON notifications(target_user_profile_id, is_read);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- ============================================================================
-- 4. DATABASE TRIGGERS & FUNCTIONS
-- ============================================================================

-- 4.1 Automated Timestamp Maintenance
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_customers_timestamp BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_product_categories_timestamp BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_product_variants_timestamp BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_promotions_timestamp BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_orders_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_payments_timestamp BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_suppliers_timestamp BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_inventory_items_timestamp BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_recipes_timestamp BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_production_batches_timestamp BEFORE UPDATE ON production_batches FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_purchase_orders_timestamp BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_expenses_timestamp BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.2 Sequence Generator for Human-Readable LK Bakehouse Order Numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'LKB-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();
