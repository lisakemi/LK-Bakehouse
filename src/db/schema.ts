import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  date,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

// 1. Staff & User Profiles (Linked to Supabase auth.users or Firebase Auth)
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }),
  role: text('role').notNull().default('customer'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Alias for backwards compatibility
export const users = userProfiles;

// 2. Customers
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id').references(() => userProfiles.id),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
  email: varchar('email', { length: 255 }),
  defaultDeliveryAddress: text('default_delivery_address'),
  deliveryLandmarks: text('delivery_landmarks'),
  totalLifetimeOrders: integer('total_lifetime_orders').default(0),
  totalLifetimeSpendTzs: decimal('total_lifetime_spend_tzs', { precision: 14, scale: 2 }).default('0.00'),
  notes: text('notes'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 3. Product Categories
export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Alias for backwards compatibility
export const categories = productCategories;

// 4. Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => productCategories.id),
  sku: varchar('sku', { length: 50 }).unique(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull().unique(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  basePriceTzs: decimal('base_price_tzs', { precision: 14, scale: 2 }).notNull(),
  leadTimeHours: integer('lead_time_hours').default(2),
  isFeatured: boolean('is_featured').default(false),
  isAvailable: boolean('is_available').default(true),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 5. Product Variants
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantName: varchar('variant_name', { length: 100 }).notNull(),
  sku: varchar('sku', { length: 60 }),
  priceAdjustmentTzs: decimal('price_adjustment_tzs', { precision: 14, scale: 2 }).default('0.00'),
  isAvailable: boolean('is_available').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 6. Allergens
export const allergens = pgTable('allergens', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 7. Product Allergens Junction
export const productAllergens = pgTable('product_allergens', {
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  allergenId: uuid('allergen_id').references(() => allergens.id).notNull(),
  notes: varchar('notes', { length: 200 }),
});

// 8. Seasonal Promotions & Discounts
export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  discountType: text('discount_type').notNull(), // 'percentage' | 'fixed_amount'
  discountValue: decimal('discount_value', { precision: 14, scale: 2 }).notNull(),
  minimumOrderSpendTzs: decimal('minimum_order_spend_tzs', { precision: 14, scale: 2 }).default('0.00'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  usageLimit: integer('usage_limit'),
  timesUsed: integer('times_used').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 9. Customer Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 40 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 150 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  source: text('source').default('website'), // 'website' | 'pos'
  fulfillmentType: text('fulfillment_type').default('pickup'), // 'pickup' | 'delivery'
  scheduledFulfillmentTime: timestamp('scheduled_fulfillment_time', { withTimezone: true }),
  deliveryStreetAddress: text('delivery_street_address'),
  deliveryNotes: text('delivery_notes'),
  status: text('status').default('pending_review'),
  subtotalTzs: decimal('subtotal_tzs', { precision: 14, scale: 2 }).notNull(),
  discountAmountTzs: decimal('discount_amount_tzs', { precision: 14, scale: 2 }).default('0.00'),
  deliveryFeeTzs: decimal('delivery_fee_tzs', { precision: 14, scale: 2 }).default('0.00'),
  totalAmountTzs: decimal('total_amount_tzs', { precision: 14, scale: 2 }).notNull(),
  promotionId: uuid('promotion_id').references(() => promotions.id),
  promotionCodeUsed: varchar('promotion_code_used', { length: 50 }),
  customerNotes: text('customer_notes'),
  cashierStaffId: uuid('cashier_staff_id').references(() => userProfiles.id),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusCreatedIdx: index('idx_orders_status_created').on(table.status, table.createdAt),
  customerPhoneIdx: index('idx_orders_customer_phone').on(table.customerPhone),
}));

// 10. Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'restrict' }).notNull(),
  productId: uuid('product_id').references(() => products.id),
  productVariantId: uuid('product_variant_id').references(() => productVariants.id),
  productName: varchar('product_name', { length: 150 }).notNull(),
  variantName: varchar('variant_name', { length: 100 }),
  unitPriceTzs: decimal('unit_price_tzs', { precision: 14, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  discountAppliedTzs: decimal('discount_applied_tzs', { precision: 14, scale: 2 }).default('0.00'),
  lineTotalTzs: decimal('line_total_tzs', { precision: 14, scale: 2 }).notNull(),
  customizationInstructions: text('customization_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
}));

// 11. Payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'restrict' }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  amountTzs: decimal('amount_tzs', { precision: 14, scale: 2 }).notNull(),
  status: text('status').default('pending'),
  transactionReference: varchar('transaction_reference', { length: 100 }),
  verifiedByStaffId: uuid('verified_by_staff_id').references(() => userProfiles.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 12. Suppliers
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  contactPerson: varchar('contact_person', { length: 120 }),
  phoneNumber: varchar('phone_number', { length: 30 }),
  email: varchar('email', { length: 255 }),
  physicalAddress: text('physical_address'),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 13. Inventory Items
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemCode: varchar('item_code', { length: 50 }).unique(),
  name: varchar('name', { length: 150 }).notNull(),
  category: varchar('category', { length: 80 }).notNull(),
  unitOfMeasurement: varchar('unit_of_measurement', { length: 30 }).notNull(),
  quantityOnHand: decimal('quantity_on_hand', { precision: 12, scale: 3 }).default('0.000'),
  reorderThreshold: decimal('reorder_threshold', { precision: 12, scale: 3 }).default('5.000'),
  standardUnitCostTzs: decimal('standard_unit_cost_tzs', { precision: 14, scale: 2 }).default('0.00'),
  primarySupplierId: uuid('primary_supplier_id').references(() => suppliers.id),
  storageBinLocation: varchar('storage_bin_location', { length: 80 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 14. Inventory Movements
export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  movementType: text('movement_type').notNull(),
  quantityDelta: decimal('quantity_delta', { precision: 12, scale: 3 }).notNull(),
  balanceAfterMovement: decimal('balance_after_movement', { precision: 12, scale: 3 }),
  unitCostTzs: decimal('unit_cost_tzs', { precision: 14, scale: 2 }),
  sourceReferenceId: varchar('source_reference_id', { length: 100 }),
  recordedByStaffId: uuid('recorded_by_staff_id').references(() => userProfiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  itemCreatedIdx: index('idx_inventory_movements_item').on(table.inventoryItemId, table.createdAt),
}));

// 15. Recipes
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id),
  recipeName: varchar('recipe_name', { length: 150 }).notNull(),
  batchYieldQuantity: integer('batch_yield_quantity').default(1),
  yieldUnit: varchar('yield_unit', { length: 50 }).default('pieces'),
  preparationInstructions: text('preparation_instructions'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 16. Recipe Ingredients
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantityRequired: decimal('quantity_required', { precision: 12, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 30 }).notNull(),
  wastageAllowancePercent: decimal('wastage_allowance_percent', { precision: 5, scale: 2 }).default('0.00'),
});

// 17. Production Batches
export const productionBatches = pgTable('production_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchCode: varchar('batch_code', { length: 50 }).notNull().unique(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  batchesPlanned: integer('batches_planned').default(1),
  quantityProduced: integer('quantity_produced').default(0),
  status: varchar('status', { length: 40 }).default('completed'),
  bakerStaffId: uuid('baker_staff_id').references(() => userProfiles.id),
  bakeStartTime: timestamp('bake_start_time', { withTimezone: true }),
  bakeFinishTime: timestamp('bake_finish_time', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 18. Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(),
  supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
  orderedDate: date('ordered_date').defaultNow(),
  expectedDeliveryDate: date('expected_delivery_date'),
  actualReceivedDate: date('actual_received_date'),
  status: text('status').default('ordered'),
  totalCostTzs: decimal('total_cost_tzs', { precision: 14, scale: 2 }).default('0.00'),
  amountPaidTzs: decimal('amount_paid_tzs', { precision: 14, scale: 2 }).default('0.00'),
  outstandingBalanceTzs: decimal('outstanding_balance_tzs', { precision: 14, scale: 2 }).default('0.00'),
  createdByStaffId: uuid('created_by_staff_id').references(() => userProfiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 19. Purchase Order Items
export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantityOrdered: decimal('quantity_ordered', { precision: 12, scale: 3 }).notNull(),
  quantityReceived: decimal('quantity_received', { precision: 12, scale: 3 }).default('0.000'),
  unitCostTzs: decimal('unit_cost_tzs', { precision: 14, scale: 2 }).notNull(),
  lineTotalTzs: decimal('line_total_tzs', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 20. Operating Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseCategory: text('expense_category').notNull(),
  amountTzs: decimal('amount_tzs', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  expenseDate: date('expense_date').defaultNow(),
  payeeVendor: varchar('payee_vendor', { length: 150 }),
  referenceNumber: varchar('reference_number', { length: 100 }),
  authorizedByStaffId: uuid('authorized_by_staff_id').references(() => userProfiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 21. Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetUserProfileId: uuid('target_user_profile_id').references(() => userProfiles.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  notificationType: text('notification_type').notNull(),
  referenceEntityType: varchar('reference_entity_type', { length: 50 }),
  referenceEntityId: uuid('reference_entity_id'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  targetUserReadIdx: index('idx_notifications_user_read').on(table.targetUserProfileId, table.isRead, table.createdAt),
}));

// 22. Business Settings
export const businessSettings = pgTable('business_settings', {
  settingKey: varchar('setting_key', { length: 100 }).primaryKey(),
  settingValue: text('setting_value').notNull(),
  dataType: varchar('data_type', { length: 30 }).default('string'),
  description: text('description'),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => userProfiles.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 23. Comprehensive Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').references(() => userProfiles.id),
  actionType: varchar('action_type', { length: 80 }).notNull(),
  tableName: varchar('table_name', { length: 80 }).notNull(),
  recordId: varchar('record_id', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 24. Financial Transactions (Ledger for sales, refunds, expenses)
export const financialTransactions = pgTable('financial_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionCode: varchar('transaction_code', { length: 50 }).notNull().unique(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'sale_revenue' | 'refund' | 'expense' | 'purchase'
  amountTzs: decimal('amount_tzs', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
  expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'set null' }),
  externalReference: varchar('external_reference', { length: 100 }),
  recordedByStaffId: uuid('recorded_by_staff_id').references(() => userProfiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  typeCreatedIdx: index('idx_financial_transactions_type').on(table.transactionType, table.createdAt),
}));

// 25. Customer Support Requests & Human Handoff
export const supportRequests = pgTable('support_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 150 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerEmail: varchar('customer_email', { length: 150 }),
  channel: varchar('channel', { length: 30 }).default('web_chat'),
  subject: varchar('subject', { length: 200 }).notNull(),
  initialMessage: text('initial_message').notNull(),
  status: varchar('status', { length: 30 }).default('open'), // 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedStaffId: uuid('assigned_staff_id').references(() => userProfiles.id, { onDelete: 'set null' }),
  isAutomatedRepliesPaused: boolean('is_automated_replies_paused').default(true),
  resolutionNotes: text('resolution_notes'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 26. Support Conversation Thread Messages
export const supportMessages = pgTable('support_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  supportRequestId: uuid('support_request_id').references(() => supportRequests.id, { onDelete: 'cascade' }).notNull(),
  senderType: varchar('sender_type', { length: 30 }).notNull(), // 'customer' | 'staff' | 'system'
  senderName: varchar('sender_name', { length: 150 }).notNull(),
  messageText: text('message_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 27. Automated Message Templates
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateKey: varchar('template_key', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 150 }).notNull(),
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 30 }).default('in_app'),
  subject: varchar('subject', { length: 200 }),
  bodyTemplate: text('body_template').notNull(),
  isEnabled: boolean('is_enabled').default(true),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => userProfiles.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 28. External Message Dispatches Audit Ledger
export const externalMessageDispatches = pgTable('external_message_dispatches', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  supportRequestId: uuid('support_request_id').references(() => supportRequests.id, { onDelete: 'set null' }),
  channel: varchar('channel', { length: 30 }).notNull(), // 'whatsapp' | 'email' | 'sms'
  recipient: varchar('recipient', { length: 150 }).notNull(),
  templateKey: varchar('template_key', { length: 100 }),
  messageBody: text('message_body').notNull(),
  deliveryStatus: varchar('delivery_status', { length: 40 }).notNull().default('simulated_success'), // 'sent' | 'delivered' | 'failed' | 'simulated_success'
  gatewayReference: varchar('gateway_reference', { length: 100 }),
  errorDetails: text('error_details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

