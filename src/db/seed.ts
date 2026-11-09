import { db } from './index.ts';
import {
  categories,
  products,
  productVariants,
  allergens,
  productAllergens,
  promotions,
  inventoryItems,
  suppliers,
  businessSettings,
  orders,
  orderItems,
  payments,
  expenses,
  notifications,
  recipes,
  recipeIngredients,
  userProfiles,
  customers,
} from './schema.ts';
import { sql, eq } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    // Ensure staff profiles exist
    const staffCount = await db.select({ count: sql<number>`count(*)` }).from(userProfiles);
    if (Number(staffCount[0]?.count) === 0) {
      await db.insert(userProfiles).values([
        { email: 'cashier@lkbakehouse.co.tz', fullName: 'Amina Juma', phoneNumber: '+255 754 112 233', role: 'cashier', isActive: true },
        { email: 'manager@lkbakehouse.co.tz', fullName: 'Baraka Mwangi', phoneNumber: '+255 768 445 566', role: 'manager', isActive: true },
        { email: 'admin@lkbakehouse.co.tz', fullName: 'Lilian Kimaro', phoneNumber: '+255 712 998 877', role: 'admin', isActive: true },
      ]).onConflictDoNothing();
    }

    const existingCats = await db.select({ count: sql<number>`count(*)` }).from(categories);
    if (Number(existingCats[0]?.count) > 0) {
      console.log('Database already contains seed data.');
      return;
    }

    console.log('Seeding initial LK Bakehouse data...');

    // 1. Allergens
    const insertedAllergens = await db.insert(allergens).values([
      { name: 'Wheat & Gluten', description: 'Present in traditional wheat flours, sourdough, and puff pastries' },
      { name: 'Dairy & Milk', description: 'Present in whole milk, European cultured butter, and cream cheese' },
      { name: 'Eggs', description: 'Fresh free-range eggs used in brioche, sponges, and pastry washes' },
      { name: 'Tree Nuts', description: 'Almonds, walnuts, and pecans used in specialized items' },
      { name: 'Peanuts', description: 'Peanut butter glazes and crumbles' },
      { name: 'Sesame', description: 'Sesame seeds used on specialty buns and artisanal loaves' },
      { name: 'Soy', description: 'Trace soy lecithin in select chocolate coatings' },
    ]).returning();

    // 2. Categories
    const insertedCategories = await db.insert(categories).values([
      { name: 'Artisanal Breads & Sourdough', slug: 'breads-sourdough', displayOrder: 1 },
      { name: 'Celebration & Layer Cakes', slug: 'celebration-cakes', displayOrder: 2 },
      { name: 'Cinnamon Rolls & Buns', slug: 'cinnamon-rolls-buns', displayOrder: 3 },
      { name: 'Pastries & Croissants', slug: 'pastries-croissants', displayOrder: 4 },
      { name: 'Cookies & Sweet Treats', slug: 'cookies-treats', displayOrder: 5 },
      { name: 'Savory Bakes & Quiches', slug: 'savory-bakes', displayOrder: 6 },
    ]).returning();

    const breadCat = insertedCategories[0];
    const cakeCat = insertedCategories[1];
    const rollCat = insertedCategories[2];
    const pastryCat = insertedCategories[3];
    const cookieCat = insertedCategories[4];
    const savoryCat = insertedCategories[5];

    // 3. Products
    const insertedProducts = await db.insert(products).values([
      {
        categoryId: breadCat.id,
        name: 'Heritage Country Sourdough Boule',
        slug: 'heritage-country-sourdough-boule',
        description: 'Naturally leavened over 36 hours with our vintage Tanzanian starter, stoneground wheat, sea salt, and a crisp golden blistered crust.',
        imageUrl: '/src/assets/images/product_sourdough_bread_1791942715439.jpg',
        basePriceTzs: '14000.00',
        leadTimeHours: 4,
        isFeatured: true,
        isAvailable: true,
      },
      {
        categoryId: cakeCat.id,
        name: 'Terracotta Botanical Celebration Cake',
        slug: 'terracotta-botanical-celebration-cake',
        description: 'Velvety vanilla bean sponge with Swiss meringue buttercream, artisanal mango passion reduction, and handcrafted terracotta edible botanicals.',
        imageUrl: '/src/assets/images/product_celebration_cake_1791942716129.jpg',
        basePriceTzs: '75000.00',
        leadTimeHours: 24,
        isFeatured: true,
        isAvailable: true,
      },
      {
        categoryId: rollCat.id,
        name: 'Signature LK Vanilla Glazed Cinnamon Rolls',
        slug: 'signature-lk-vanilla-glazed-cinnamon-rolls',
        description: 'Pillowy brioche dough swirled with aromatic Ceylon cinnamon, brown sugar, and smothered in our velvety cream cheese glaze.',
        imageUrl: '/src/assets/images/product_cinnamon_rolls_1791942716752.jpg',
        basePriceTzs: '22000.00',
        leadTimeHours: 2,
        isFeatured: true,
        isAvailable: true,
      },
      {
        categoryId: pastryCat.id,
        name: 'Golden Butter Viennoiserie Croissants',
        slug: 'golden-butter-viennoiserie-croissants',
        description: 'Layered with pure churned butter for 72 crisp, featherlight flaky honeycombed layers. Baked fresh every morning at sunrise.',
        imageUrl: '/src/assets/images/hero_artisanal_bakery_1791942715072.jpg',
        basePriceTzs: '8500.00',
        leadTimeHours: 2,
        isFeatured: true,
        isAvailable: true,
      },
      {
        categoryId: cookieCat.id,
        name: 'Valrhona Dark Chocolate Sea Salt Cookies',
        slug: 'valrhona-dark-chocolate-sea-salt-cookies',
        description: 'Thick, chewy center with molten pockets of 70% dark chocolate and a delicate sprinkle of Zanzibar sea salt flakes.',
        imageUrl: '/src/assets/images/hero_artisanal_bakery_1791942715072.jpg',
        basePriceTzs: '12000.00',
        leadTimeHours: 2,
        isFeatured: false,
        isAvailable: true,
      },
      {
        categoryId: savoryCat.id,
        name: 'Caramelized Onion & Gruyère Tart',
        slug: 'caramelized-onion-gruyere-tart',
        description: 'Slow-braised sweet onions in a buttery shortcrust pastry with aged Gruyère, fresh thyme, and cracked black pepper.',
        imageUrl: '/src/assets/images/bakery_interior_cafe_1791942716825.jpg',
        basePriceTzs: '18000.00',
        leadTimeHours: 4,
        isFeatured: false,
        isAvailable: true,
      },
    ]).returning();

    // 4. Product Variants
    await db.insert(productVariants).values([
      { productId: insertedProducts[0].id, variantName: 'Standard Boule (850g)', priceAdjustmentTzs: '0.00', sku: 'LKB-BOULE-STD' },
      { productId: insertedProducts[0].id, variantName: 'Large Family Loaf (1.4kg)', priceAdjustmentTzs: '8000.00', sku: 'LKB-BOULE-LRG' },
      
      { productId: insertedProducts[1].id, variantName: '6-inch (Serves 8-10)', priceAdjustmentTzs: '-15000.00', sku: 'LKB-CAKE-6IN' },
      { productId: insertedProducts[1].id, variantName: '8-inch (Serves 16-20)', priceAdjustmentTzs: '0.00', sku: 'LKB-CAKE-8IN' },
      { productId: insertedProducts[1].id, variantName: '10-inch Tier (Serves 28-32)', priceAdjustmentTzs: '45000.00', sku: 'LKB-CAKE-10IN' },


      { productId: insertedProducts[2].id, variantName: 'Box of 4 Rolls', priceAdjustmentTzs: '0.00', sku: 'LKB-ROLL-4' },
      { productId: insertedProducts[2].id, variantName: 'Baker’s Pan of 6 Rolls', priceAdjustmentTzs: '10000.00', sku: 'LKB-ROLL-6' },
      { productId: insertedProducts[2].id, variantName: 'Party Platter of 12 Rolls', priceAdjustmentTzs: '35000.00', sku: 'LKB-ROLL-12' },

      { productId: insertedProducts[3].id, variantName: 'Single Croissant', priceAdjustmentTzs: '-3500.00', sku: 'LKB-CROISS-1' },
      { productId: insertedProducts[3].id, variantName: 'Morning Box of 4', priceAdjustmentTzs: '14000.00', sku: 'LKB-CROISS-4' },
    ]);

    // 5. Product Allergens
    await db.insert(productAllergens).values([
      { productId: insertedProducts[0].id, allergenId: insertedAllergens[0].id }, // Bread -> Gluten
      { productId: insertedProducts[1].id, allergenId: insertedAllergens[0].id }, // Cake -> Gluten
      { productId: insertedProducts[1].id, allergenId: insertedAllergens[1].id }, // Cake -> Dairy
      { productId: insertedProducts[1].id, allergenId: insertedAllergens[2].id }, // Cake -> Eggs
      { productId: insertedProducts[2].id, allergenId: insertedAllergens[0].id }, // Rolls -> Gluten
      { productId: insertedProducts[2].id, allergenId: insertedAllergens[1].id }, // Rolls -> Dairy
      { productId: insertedProducts[2].id, allergenId: insertedAllergens[2].id }, // Rolls -> Eggs
      { productId: insertedProducts[3].id, allergenId: insertedAllergens[0].id }, // Croissant -> Gluten
      { productId: insertedProducts[3].id, allergenId: insertedAllergens[1].id }, // Croissant -> Dairy
      { productId: insertedProducts[3].id, allergenId: insertedAllergens[2].id }, // Croissant -> Eggs
    ]);

    // 6. Promotions
    await db.insert(promotions).values([
      {
        code: 'KARIBU10',
        name: 'Karibu Welcome Gift',
        description: '10% discount on first bakery order for new customers',
        discountType: 'percentage',
        discountValue: '10.00',
        minimumOrderSpendTzs: '25000.00',
        startTime: new Date('2026-01-01'),
        endTime: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'EIDBAKE2026',
        name: 'Eid & Celebration Special',
        description: '15% discount on all custom celebration cakes and pastry platters',
        discountType: 'percentage',
        discountValue: '15.00',
        minimumOrderSpendTzs: '60000.00',
        startTime: new Date('2026-03-01'),
        endTime: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'SWEETWEEKEND',
        name: 'Weekend Morning Treat',
        description: 'Fixed 5,000 TZS discount on orders over 45,000 TZS',
        discountType: 'fixed_amount',
        discountValue: '5000.00',
        minimumOrderSpendTzs: '45000.00',
        startTime: new Date('2026-01-01'),
        endTime: new Date('2026-12-31'),
        isActive: true,
      },
    ]);

    // 7. Suppliers
    const insertedSuppliers = await db.insert(suppliers).values([
      { name: 'Azam Grain Milling Ltd', contactPerson: 'Said Mwinyi', phoneNumber: '+255 22 212 3456', email: 'orders@azamgrains.co.tz', physicalAddress: 'Industrial Area, Dar es Salaam', paymentTerms: 'Net 15 days' },
      { name: 'Tanga Fresh Premium Dairies', contactPerson: 'Fatma Juma', phoneNumber: '+255 27 264 5678', email: 'sales@tangafresh.co.tz', physicalAddress: 'Tanga / Dar Depot', paymentTerms: 'Cash on delivery / M-Pesa' },
      { name: 'Kilombero Sugar Company', contactPerson: 'Emmanuel Temu', phoneNumber: '+255 23 262 3344', email: 'supply@kilomberosugar.co.tz', physicalAddress: 'Morogoro / Dar Hub', paymentTerms: 'Net 30 days' },
      { name: 'Swahili Eco Pack & Cartons', contactPerson: 'Grace Mwenda', phoneNumber: '+255 784 990 112', email: 'info@swahiliecopack.com', physicalAddress: 'Mikocheni B, Dar es Salaam', paymentTerms: 'Immediate' },
    ]).returning();

    // 8. Inventory Items
    const insertedInventory = await db.insert(inventoryItems).values([
      { name: 'T55 Unbleached Wheat Flour', category: 'ingredient', unitOfMeasurement: 'kg', quantityOnHand: '240.000', reorderThreshold: '50.000', standardUnitCostTzs: '2800.00', primarySupplierId: insertedSuppliers[0].id, storageBinLocation: 'Dry Pantry Bin 1' },
      { name: 'Pure European Cultured Butter 82%', category: 'ingredient', unitOfMeasurement: 'kg', quantityOnHand: '45.000', reorderThreshold: '15.000', standardUnitCostTzs: '18500.00', primarySupplierId: insertedSuppliers[1].id, storageBinLocation: 'Walk-in Chiller A' },
      { name: 'Refined White Cane Sugar', category: 'ingredient', unitOfMeasurement: 'kg', quantityOnHand: '120.000', reorderThreshold: '30.000', standardUnitCostTzs: '3200.00', primarySupplierId: insertedSuppliers[2].id, storageBinLocation: 'Dry Pantry Bin 2' },
      { name: 'Fresh Free-Range Eggs (Tray 30)', category: 'ingredient', unitOfMeasurement: 'pcs', quantityOnHand: '360.000', reorderThreshold: '90.000', standardUnitCostTzs: '450.00', primarySupplierId: insertedSuppliers[1].id, storageBinLocation: 'Egg Storage Rack' },
      { name: 'Organic Ceylon Cinnamon Bark Powder', category: 'ingredient', unitOfMeasurement: 'kg', quantityOnHand: '8.500', reorderThreshold: '2.000', standardUnitCostTzs: '42000.00', storageBinLocation: 'Spice Cabinet' },
      { name: 'Madagascar Bourbon Vanilla Beans', category: 'ingredient', unitOfMeasurement: 'pcs', quantityOnHand: '85.000', reorderThreshold: '20.000', standardUnitCostTzs: '9500.00', storageBinLocation: 'Spice Cabinet' },
      { name: 'Artisanal Kraft Window Cake Box 10"', category: 'packaging', unitOfMeasurement: 'pcs', quantityOnHand: '150.000', reorderThreshold: '40.000', standardUnitCostTzs: '4800.00', primarySupplierId: insertedSuppliers[3].id, storageBinLocation: 'Packaging Shelves' },
      { name: 'Brown Kraft Pastry Pouches (500pk)', category: 'packaging', unitOfMeasurement: 'pcs', quantityOnHand: '650.000', reorderThreshold: '200.000', standardUnitCostTzs: '350.00', primarySupplierId: insertedSuppliers[3].id, storageBinLocation: 'Packaging Shelves' },
    ]).returning();

    // 9. Recipes
    const insertedRecipe = await db.insert(recipes).values({
      productId: insertedProducts[1].id,
      recipeName: '8-inch Terracotta Celebration Cake Batch',
      batchYieldQuantity: 1,
      yieldUnit: 'cake',
      preparationInstructions: 'Cream butter and sugar until pale and fluffy. Emulsify room temp eggs one by one. Fold sifted T55 flour. Bake at 170°C for 34 minutes. Chill before crumb coating.',
    }).returning();


    await db.insert(recipeIngredients).values([
      { recipeId: insertedRecipe[0].id, inventoryItemId: insertedInventory[0].id, quantityRequired: '0.450', unit: 'kg' },
      { recipeId: insertedRecipe[0].id, inventoryItemId: insertedInventory[1].id, quantityRequired: '0.380', unit: 'kg' },
      { recipeId: insertedRecipe[0].id, inventoryItemId: insertedInventory[2].id, quantityRequired: '0.350', unit: 'kg' },
      { recipeId: insertedRecipe[0].id, inventoryItemId: insertedInventory[3].id, quantityRequired: '6.000', unit: 'pcs' },
    ]);

    // 10. Business Settings
    await db.insert(businessSettings).values([
      { settingKey: 'bakery_name', settingValue: 'LK Bakehouse' },
      { settingKey: 'phone_number', settingValue: '+255 754 889 900' },
      { settingKey: 'email_address', settingValue: 'hello@lkbakehouse.co.tz' },
      { settingKey: 'whatsapp_number', settingValue: '+255754889900' },
      { settingKey: 'instagram_handle', settingValue: '@lkbakehouse_tz' },
      { settingKey: 'physical_location', settingValue: 'Plot 42, Haile Selassie Road, Masaki, Dar es Salaam' },
      { settingKey: 'operating_hours', settingValue: 'Mon – Sat: 7:00 AM – 8:00 PM | Sun: 8:00 AM – 5:00 PM' },
      { settingKey: 'delivery_fee_base_tzs', settingValue: '7000' },
      { settingKey: 'auto_reply_order_received', settingValue: 'Habari! Asanti sana for ordering with LK Bakehouse. We have received your order #{order_number} and our pastry chefs are reviewing your batch. You can track progress live on our website.' },
      { settingKey: 'auto_reply_ready_for_pickup', settingValue: 'Your delicious fresh bake is boxed and waiting for you at LK Bakehouse Masai store! Please present your order #{order_number} upon arrival.' },
    ]);

    // 11. Initial Sample Orders (Real DB rows)
    const order1 = await db.insert(orders).values({
      orderNumber: 'LKB-2026-1001',
      customerName: 'Amina Salum',
      customerPhone: '+255 713 445 566',
      customerEmail: 'amina.salum@gmail.com',
      fulfillmentType: 'pickup',
      status: 'confirmed',
      subtotalTzs: '75000.00',
      discountAmountTzs: '7500.00',
      deliveryFeeTzs: '0.00',
      totalAmountTzs: '67500.00',
      customerNotes: 'Please pipe "Happy 30th Lisa!" in gold lettering.',
      source: 'website',
    }).returning();

    await db.insert(orderItems).values({
      orderId: order1[0].id,
      productId: insertedProducts[1].id,
      productName: 'Terracotta Botanical Celebration Cake',
      variantName: '8-inch (Serves 16-20)',
      unitPriceTzs: '75000.00',
      quantity: 1,
      customizationInstructions: 'Happy 30th Lisa!',
      lineTotalTzs: '75000.00',
    });

    await db.insert(payments).values({
      orderId: order1[0].id,
      paymentMethod: 'm_pesa',
      amountTzs: '67500.00',
      transactionReference: 'MPESA-QY782910X',
      status: 'verified',
    });

    const order2 = await db.insert(orders).values({
      orderNumber: 'LKB-2026-1002',
      customerName: 'David Kimaro',
      customerPhone: '+255 768 221 144',
      customerEmail: 'david.kimaro@outlook.com',
      fulfillmentType: 'delivery',
      deliveryStreetAddress: 'Oysterbay, Tour Drive House 14',
      status: 'ready_for_pickup',
      subtotalTzs: '44500.00',
      discountAmountTzs: '0.00',
      deliveryFeeTzs: '7000.00',
      totalAmountTzs: '51500.00',
      customerNotes: 'Call at the gate upon arrival.',
      source: 'website',
    }).returning();

    await db.insert(orderItems).values([
      {
        orderId: order2[0].id,
        productId: insertedProducts[0].id,
        productName: 'Heritage Country Sourdough Boule',
        variantName: 'Standard Boule (850g)',
        unitPriceTzs: '14000.00',
        quantity: 1,
        lineTotalTzs: '14000.00',
      },
      {
        orderId: order2[0].id,
        productId: insertedProducts[2].id,
        productName: 'Signature LK Vanilla Glazed Cinnamon Rolls',
        variantName: 'Baker’s Pan of 6 Rolls',
        unitPriceTzs: '32000.00',
        quantity: 1,
        lineTotalTzs: '32000.00',
      },
    ]);

    await db.insert(payments).values({
      orderId: order2[0].id,
      paymentMethod: 'tigo_pesa',
      amountTzs: '51500.00',
      transactionReference: 'TIGO-992144',
      status: 'verified',
    });

    // 12. Expenses
    await db.insert(expenses).values([
      { expenseCategory: 'ingredients', amountTzs: '350000.00', paymentMethod: 'bank_transfer', referenceNumber: 'INV-AZAM-441', notes: 'Monthly flour supply (125kg bulk sacks)', expenseDate: '2026-10-01' },
      { expenseCategory: 'packaging', amountTzs: '180000.00', paymentMethod: 'm_pesa', referenceNumber: 'ECOPACK-778', notes: 'Biodegradable cake boxes and bakery bags', expenseDate: '2026-10-05' },
      { expenseCategory: 'utilities_energy', amountTzs: '220000.00', paymentMethod: 'm_pesa', referenceNumber: 'TANESCO-OCT26', notes: 'Deck ovens & refrigeration 3-phase electricity', expenseDate: '2026-10-08' },
    ]);

    // 13. Notifications
    await db.insert(notifications).values([
      { title: 'New Online Order #LKB-2026-1001', body: 'Amina Salum placed an order for Terracotta Botanical Celebration Cake', notificationType: 'order_submitted', isRead: false },
      { title: 'Fresh Batch Ready', body: 'Heritage Country Sourdough Boule morning batch completed in deck oven 2', notificationType: 'system_alert', isRead: true },
      { title: 'Low Inventory Watch', body: 'Ceylon Cinnamon Bark Powder has reached 8.5 kg (near reorder point)', notificationType: 'stock_low', isRead: false },
    ]);

    console.log('LK Bakehouse initial seeding completed successfully!');

  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}
