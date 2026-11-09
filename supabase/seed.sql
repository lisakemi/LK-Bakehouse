-- ============================================================================
-- LK BAKEHOUSE — DEVELOPMENT & STAGING SEED DATA
-- Currency: Tanzanian Shillings (TZS)
-- Location: Masaki, Dar es Salaam, Tanzania
-- ============================================================================

-- 1. ALLERGENS
INSERT INTO allergens (id, name, description) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Wheat & Gluten', 'Traditional wheat, rye flours, sourdough, and puff pastry dough'),
    ('a0000000-0000-0000-0000-000000000002', 'Dairy & Milk', 'Pure European butter, whole pasteurized milk, whipping cream, cream cheese'),
    ('a0000000-0000-0000-0000-000000000003', 'Eggs', 'Fresh free-range hen eggs used in brioche, sponges, and egg washes'),
    ('a0000000-0000-0000-0000-000000000004', 'Tree Nuts', 'Almonds, walnuts, and pecans used in specialized pastries and pralines'),
    ('a0000000-0000-0000-0000-000000000005', 'Peanuts', 'Peanut butter glazes and biscuit toppings'),
    ('a0000000-0000-0000-0000-000000000006', 'Sesame', 'White and black sesame seeds on artisanal rolls and savory baguettes'),
    ('a0000000-0000-0000-0000-000000000007', 'Soy', 'Trace soy lecithin in select chocolate coatings')
ON CONFLICT (name) DO NOTHING;

-- 2. CATEGORIES
INSERT INTO product_categories (id, name, slug, description, display_order) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Artisanal Breads & Sourdough', 'breads-sourdough', 'Naturally leavened over 36 hours with stoneground wheat and crispy crusts', 1),
    ('c0000000-0000-0000-0000-000000000002', 'Celebration & Layer Cakes', 'celebration-cakes', 'Handcrafted botanical celebration cakes with Swiss meringue buttercream', 2),
    ('c0000000-0000-0000-0000-000000000003', 'Cinnamon Rolls & Buns', 'cinnamon-rolls-buns', 'Warm pillowy brioche swirls with Ceylon cinnamon and cream cheese glaze', 3),
    ('c0000000-0000-0000-0000-000000000004', 'Pastries & Croissants', 'pastries-croissants', '72-layer laminated pure butter French viennoiserie baked at dawn', 4),
    ('c0000000-0000-0000-0000-000000000005', 'Artisanal Cookies & Treats', 'cookies-treats', 'Thick chewy cookies with Valrhona dark chocolate and Zanzibar sea salt', 5),
    ('c0000000-0000-0000-0000-000000000006', 'Savory Bakes & Quiches', 'savory-bakes', 'Buttery shortcrust tarts with sweet caramelized onions and aged Gruyère', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. PRODUCTS
INSERT INTO products (id, category_id, sku, name, slug, description, image_url, base_price_tzs, lead_time_hours, is_featured, is_available) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'LKB-BOULE', 'Heritage Country Sourdough Boule', 'heritage-country-sourdough-boule', 'Naturally leavened over 36 hours with our vintage starter, stoneground wheat, and Zanzibar sea salt.', '/src/assets/images/product_sourdough_bread_1791942715439.jpg', 14000.00, 4, TRUE, TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'LKB-CAKE-BOTANICAL', 'Terracotta Botanical Celebration Cake', 'terracotta-botanical-celebration-cake', 'Velvety vanilla bean sponge with Swiss meringue buttercream, mango-passion reduction, and handcrafted edible florals.', '/src/assets/images/product_celebration_cake_1791942716129.jpg', 75000.00, 24, TRUE, TRUE),
    ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'LKB-ROLLS-SIG', 'Signature LK Vanilla Glazed Cinnamon Rolls', 'signature-lk-vanilla-glazed-cinnamon-rolls', 'Pillowy brioche dough swirled with aromatic Ceylon cinnamon and smothered in cream cheese glaze.', '/src/assets/images/product_cinnamon_rolls_1791942716752.jpg', 22000.00, 2, TRUE, TRUE),
    ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'LKB-CROISS-BUTTER', 'Golden Butter Viennoiserie Croissants', 'golden-butter-viennoiserie-croissants', 'Layered with pure European butter for 72 crisp, featherlight honeycombed layers.', '/src/assets/images/hero_artisanal_bakery_1791942715072.jpg', 8500.00, 2, TRUE, TRUE),
    ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'LKB-COOKIE-VALRHONA', 'Valrhona Dark Chocolate Sea Salt Cookies', 'valrhona-dark-chocolate-sea-salt-cookies', 'Thick chewy center with molten pockets of 70% dark chocolate and delicate Zanzibar sea salt flakes.', '/src/assets/images/hero_artisanal_bakery_1791942715072.jpg', 12000.00, 2, FALSE, TRUE),
    ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'LKB-TART-GRUYERE', 'Caramelized Onion & Gruyère Tart', 'caramelized-onion-gruyere-tart', 'Slow-braised sweet onions in a buttery shortcrust pastry with aged Gruyère and fresh thyme.', '/src/assets/images/bakery_interior_cafe_1791942716825.jpg', 18000.00, 4, FALSE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 4. PRODUCT VARIANTS
INSERT INTO product_variants (product_id, variant_name, sku, price_adjustment_tzs) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Standard Boule (850g)', 'LKB-BOULE-850', 0.00),
    ('b0000000-0000-0000-0000-000000000001', 'Large Family Loaf (1.4kg)', 'LKB-BOULE-1400', 8000.00),
    ('b0000000-0000-0000-0000-000000000002', '6-inch (Serves 8-10)', 'LKB-CAKE-6IN', -15000.00),
    ('b0000000-0000-0000-0000-000000000002', '8-inch (Serves 16-20)', 'LKB-CAKE-8IN', 0.00),
    ('b0000000-0000-0000-0000-000000000002', '10-inch Tier (Serves 28-32)', 'LKB-CAKE-10IN', 45000.00),
    ('b0000000-0000-0000-0000-000000000003', 'Box of 4 Rolls', 'LKB-ROLL-4', 0.00),
    ('b0000000-0000-0000-0000-000000000003', 'Baker’s Pan of 6 Rolls', 'LKB-ROLL-6', 10000.00),
    ('b0000000-0000-0000-0000-000000000004', 'Single Croissant', 'LKB-CROISS-1', -3500.00),
    ('b0000000-0000-0000-0000-000000000004', 'Morning Box of 4', 'LKB-CROISS-4', 14000.00)
ON CONFLICT (product_id, variant_name) DO NOTHING;

-- 5. PRODUCT ALLERGENS
INSERT INTO product_allergens (product_id, allergen_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'), -- Bread -> Wheat
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'), -- Cake -> Wheat
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'), -- Cake -> Dairy
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'), -- Cake -> Eggs
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'), -- Rolls -> Wheat
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002'), -- Rolls -> Dairy
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'), -- Rolls -> Eggs
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001'), -- Croissant -> Wheat
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002'), -- Croissant -> Dairy
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003')  -- Croissant -> Eggs
ON CONFLICT (product_id, allergen_id) DO NOTHING;

-- 6. PROMOTIONS
INSERT INTO promotions (code, name, description, discount_type, discount_value, minimum_order_spend_tzs, start_time, end_time, is_active) VALUES
    ('KARIBU10', 'Karibu Welcome Gift', '10% off first bakery order for new customers', 'percentage', 10.00, 25000.00, '2026-01-01 00:00:00+03', '2026-12-31 23:59:59+03', TRUE),
    ('EIDBAKE2026', 'Eid & Celebration Special', '15% off bespoke celebration cakes and party platters', 'percentage', 15.00, 60000.00, '2026-03-01 00:00:00+03', '2026-12-31 23:59:59+03', TRUE),
    ('SWEETWEEKEND', 'Weekend Morning Treat', 'Fixed 5,000 TZS discount on orders over 45,000 TZS', 'fixed_amount', 5000.00, 45000.00, '2026-01-01 00:00:00+03', '2026-12-31 23:59:59+03', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 7. SUPPLIERS
INSERT INTO suppliers (id, name, contact_person, phone_number, email, physical_address, payment_terms) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Azam Grain Milling Ltd', 'Said Mwinyi', '+255 22 212 3456', 'orders@azamgrains.co.tz', 'Industrial Area, Dar es Salaam', 'Net 15 days'),
    ('e0000000-0000-0000-0000-000000000002', 'Tanga Fresh Premium Dairies', 'Fatma Juma', '+255 27 264 5678', 'sales@tangafresh.co.tz', 'Tanga / Dar Depot', 'Cash on delivery / M-Pesa'),
    ('e0000000-0000-0000-0000-000000000003', 'Kilombero Sugar Company', 'Emmanuel Temu', '+255 23 262 3344', 'supply@kilomberosugar.co.tz', 'Morogoro / Dar Hub', 'Net 30 days'),
    ('e0000000-0000-0000-0000-000000000004', 'Swahili Eco Pack & Cartons', 'Grace Mwenda', '+255 784 990 112', 'info@swahiliecopack.com', 'Mikocheni B, Dar es Salaam', 'Immediate')
ON CONFLICT (name) DO NOTHING;

-- 8. INVENTORY ITEMS
INSERT INTO inventory_items (id, item_code, name, category, unit_of_measurement, quantity_on_hand, reorder_threshold, standard_unit_cost_tzs, primary_supplier_id, storage_bin_location) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'ING-FLOUR-T55', 'T55 Unbleached Wheat Flour', 'ingredient', 'kg', 240.000, 50.000, 2800.00, 'e0000000-0000-0000-0000-000000000001', 'Dry Pantry Bin 1'),
    ('f0000000-0000-0000-0000-000000000002', 'ING-BUTTER-82', 'Pure European Cultured Butter 82%', 'ingredient', 'kg', 45.000, 15.000, 18500.00, 'e0000000-0000-0000-0000-000000000002', 'Walk-in Chiller A'),
    ('f0000000-0000-0000-0000-000000000003', 'ING-SUGAR-WHT', 'Refined White Cane Sugar', 'ingredient', 'kg', 120.000, 30.000, 3200.00, 'e0000000-0000-0000-0000-000000000003', 'Dry Pantry Bin 2'),
    ('f0000000-0000-0000-0000-000000000004', 'ING-EGGS-TRAY', 'Fresh Free-Range Eggs (Tray 30)', 'ingredient', 'pcs', 360.000, 90.000, 450.00, 'e0000000-0000-0000-0000-000000000002', 'Egg Storage Rack'),
    ('f0000000-0000-0000-0000-000000000005', 'ING-CINNAMON-CEY', 'Organic Ceylon Cinnamon Bark Powder', 'ingredient', 'kg', 8.500, 2.000, 42000.00, NULL, 'Spice Cabinet'),
    ('f0000000-0000-0000-0000-000000000006', 'ING-VANILLA-MDG', 'Madagascar Bourbon Vanilla Beans', 'ingredient', 'pcs', 85.000, 20.000, 9500.00, NULL, 'Spice Cabinet'),
    ('f0000000-0000-0000-0000-000000000007', 'PKG-BOX-10IN', 'Artisanal Kraft Window Cake Box 10"', 'packaging', 'pcs', 150.000, 40.000, 4800.00, 'e0000000-0000-0000-0000-000000000004', 'Packaging Shelves'),
    ('f0000000-0000-0000-0000-000000000008', 'PKG-BAG-KRAFT', 'Brown Kraft Pastry Pouches (500pk)', 'packaging', 'pcs', 650.000, 200.000, 350.00, 'e0000000-0000-0000-0000-000000000004', 'Packaging Shelves')
ON CONFLICT (item_code) DO NOTHING;

-- 9. RECIPES
INSERT INTO recipes (id, product_id, recipe_name, batch_yield_quantity, yield_unit, preparation_instructions) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '8-inch Terracotta Celebration Cake Batch', 1, 'cake', 'Cream butter and sugar until pale and fluffy. Emulsify room temp eggs one by one. Fold sifted T55 flour. Bake at 170°C for 34 minutes.')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, inventory_item_id, quantity_required, unit) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 0.450, 'kg'),
    ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 0.380, 'kg'),
    ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 0.350, 'kg'),
    ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 6.000, 'pcs')
ON CONFLICT DO NOTHING;

-- 10. BUSINESS SETTINGS
INSERT INTO business_settings (setting_key, setting_value, data_type, description) VALUES
    ('bakery_name', 'LK Bakehouse', 'string', 'Official trading name'),
    ('phone_number', '+255 754 889 900', 'string', 'Customer hotline'),
    ('email_address', 'hello@lkbakehouse.co.tz', 'string', 'General contact email'),
    ('whatsapp_number', '+255754889900', 'string', 'WhatsApp direct messaging line'),
    ('instagram_handle', '@lkbakehouse_tz', 'string', 'Official Instagram profile'),
    ('physical_location', 'Plot 42, Haile Selassie Road, Masaki, Dar es Salaam', 'string', 'Bakery store location'),
    ('operating_hours', 'Mon – Sat: 7:00 AM – 8:00 PM | Sun: 8:00 AM – 5:00 PM', 'string', 'Baking and shop hours'),
    ('currency_code', 'TZS', 'string', 'Base operational currency'),
    ('delivery_fee_base_tzs', '7000', 'numeric', 'Standard delivery flat rate for Dar es Salaam')
ON CONFLICT (setting_key) DO NOTHING;
