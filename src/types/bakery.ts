export interface Category {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

export interface Allergen {
  id: number;
  name: string;
  description?: string;
}

export interface ProductVariant {
  id: string | number;
  productId: string | number;
  name?: string;
  variantName?: string;
  priceAdjustmentTzs: string;
  sku?: string;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  basePriceTzs: string;
  leadTimeHours: number;
  isFeatured: boolean;
  isAvailable: boolean;
  variants?: ProductVariant[];
  allergens?: Allergen[];
}

export interface CartItem {
  id: string; // unique cart entry key
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  unitPriceTzs: number;
  customizationNotes?: string;
}

export interface Promotion {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed_tzs';
  discountValue: string;
  minSpendTzs: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  variantName?: string;
  unitPriceTzs: string;
  quantity: number;
  customizationNotes?: string;
  totalPriceTzs: string;
}

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: string;
  amountTzs: string;
  referenceCode?: string;
  status: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: 'pickup' | 'delivery';
  scheduledTime?: string;
  deliveryAddress?: string;
  status: 'pending_review' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  subtotalTzs: string;
  discountTzs: string;
  deliveryFeeTzs: string;
  totalTzs: string;
  notes?: string;
  source: 'website' | 'pos';
  createdAt: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface InventoryItem {
  id: string | any;
  itemCode?: string;
  name: string;
  category: string;
  unit: string;
  unitOfMeasurement?: string;
  quantityOnHand: string;
  reorderLevel: string;
  reorderThreshold?: string;
  unitCostTzs: string;
  standardUnitCostTzs?: string;
  storageLocation?: string;
  storageBinLocation?: string;
  supplierId?: string | any;
  primarySupplierId?: string | any;
  supplierName?: string;
  valuationTzs?: number;
  isLowStock?: boolean;
}

export interface InventoryMovement {
  id: string | any;
  itemId?: string | any;
  inventoryItemId?: string | any;
  itemName: string;
  unit: string;
  movementType: string;
  quantityDelta: string;
  balanceAfterMovement?: string;
  unitCostTzs?: string;
  referenceId?: string;
  sourceReferenceId?: string;
  recordedByStaffName?: string;
  recordedByStaffId?: string | any;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string | any;
  name: string;
  contactPerson?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  physicalAddress?: string;
  paymentTerms?: string;
  taxIdentificationNumber?: string;
  totalOrders?: number;
  totalSpendTzs?: string;
  outstandingBalanceTzs?: string;
}

export interface PurchaseOrderItem {
  id?: string | any;
  purchaseOrderId?: string | any;
  inventoryItemId: string | any;
  itemName?: string;
  unit?: string;
  quantityOrdered: string | number;
  quantityReceived: string | number;
  unitCostTzs: string | number;
  lineTotalTzs?: string | number;
}

export interface PurchaseOrder {
  id: string | any;
  poNumber: string;
  supplierId: string | any;
  supplierName: string;
  orderedDate?: string;
  expectedDeliveryDate?: string;
  actualReceivedDate?: string;
  totalCostTzs: string;
  amountPaidTzs: string;
  outstandingBalanceTzs?: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled' | string;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
}

export interface RecipeIngredient {
  id: string | any;
  recipeId: string | any;
  inventoryItemId: string | any;
  itemName: string;
  quantityNeeded: string;
  quantityRequired?: string;
  unit: string;
  wastageAllowancePercent?: string;
  currentStockOnHand?: string;
  stockAvailable?: boolean;
}

export interface Recipe {
  id: string | any;
  productId?: string | any;
  name: string;
  recipeName?: string;
  batchYieldQuantity: number;
  yieldQuantity: number;
  yieldUnit: string;
  instructions?: string;
  preparationInstructions?: string;
  ingredients?: RecipeIngredient[];
  maxBatchesPossible?: number;
}

export interface ProductionBatch {
  id: string | any;
  batchCode: string;
  recipeId: string | any;
  recipeName?: string;
  batchesPlanned: number;
  quantityProduced: number;
  status: 'completed' | 'in_progress' | 'cancelled' | string;
  bakerStaffId?: string | any;
  bakerName?: string;
  bakeStartTime?: string;
  bakeFinishTime?: string;
  notes?: string;
  createdAt: string;
}


export interface Expense {
  id: string | any;
  category: string;
  expenseCategory?: string;
  amountTzs: string;
  paymentMethod: string;
  payeeVendor?: string;
  reference?: string;
  referenceNumber?: string;
  authorizedByStaffId?: string | any;
  authorizedByStaffName?: string;
  notes?: string;
  expenseDate: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string | any;
  transactionCode: string;
  transactionType: 'sale_revenue' | 'refund' | 'expense' | 'purchase' | string;
  amountTzs: string;
  paymentMethod: string;
  orderId?: string | any;
  orderNumber?: string;
  purchaseOrderId?: string | any;
  poNumber?: string;
  expenseId?: string | any;
  externalReference?: string;
  recordedByStaffId?: string | any;
  recordedByStaffName?: string;
  createdAt: string;
}

export interface CustomerInvoice {
  id: string | any;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  issueDate: string;
  fulfillmentType: string;
  status: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
  subtotalTzs: string;
  discountTzs: string;
  totalTzs: string;
  amountPaidTzs: string;
  outstandingBalanceTzs: string;
  items?: OrderItem[];
}

export interface FinancialSummary {
  period: string;
  startDate?: string;
  endDate?: string;
  accountingDisclaimer: string;
  salesAndRevenue: {
    grossSalesTzs: number;
    discountTotalTzs: number;
    refundTotalTzs: number;
    netSalesTzs: number;
    revenueRecognizedTzs: number;
    cashActuallyReceivedTzs: number;
    unsettledAccrualTzs: number;
    completedSalesCount: number;
  };
  paymentCollections: {
    totalCollectedTzs: number;
    byMethod: Record<string, number>;
    verifiedCount: number;
    pendingCount: number;
    failedOrRefundedCount: number;
  };
  accountsReceivable: {
    totalOutstandingCustomerBalancesTzs: number;
    unpaidInvoicesCount: number;
    invoices: Array<{
      orderId: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      totalTzs: number;
      amountPaidTzs: number;
      balanceDueTzs: number;
      createdAt: string;
    }>;
  };
  accountsPayable: {
    totalPurchasesBilledTzs: number;
    totalPurchasesPaidTzs: number;
    totalOutstandingSupplierBalancesTzs: number;
    supplierCount: number;
  };
  operatingExpenses: {
    totalOperatingExpensesTzs: number;
    byCategory: Record<string, number>;
    count: number;
  };
  profitabilityAnalysis: {
    estimatedCogsTzs: number;
    estimatedGrossProfitTzs: number;
    grossMarginPercent: number;
    estimatedNetOperatingProfitTzs: number;
    netMarginPercent: number;
    methodologyNote: string;
  };
  cashFlowSummary: {
    totalCashInflowTzs: number;
    totalCashOutflowTzs: number;
    netCashMovementTzs: number;
  };
  periodComparison?: {
    priorPeriodName: string;
    priorNetSalesTzs: number;
    salesChangePercent: number;
    priorExpensesTzs: number;
    expensesChangePercent: number;
    priorNetProfitTzs: number;
    profitChangePercent: number;
  };
}

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  type: string;
  referenceEntityType?: string;
  referenceEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BusinessSettingsMap {
  bakery_name?: string;
  phone_number?: string;
  email_address?: string;
  whatsapp_number?: string;
  instagram_handle?: string;
  physical_location?: string;
  operating_hours?: string;
  delivery_fee_base_tzs?: string;
  auto_reply_order_received?: string;
  auto_reply_ready_for_pickup?: string;
  [key: string]: string | undefined;
}

export interface SupportMessage {
  id: string;
  supportRequestId: string;
  senderType: 'customer' | 'staff' | 'system';
  senderName: string;
  messageText: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  ticketNumber: string;
  customerId?: string;
  orderId?: string;
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  channel: 'web_chat' | 'whatsapp' | 'phone' | 'email';
  subject: string;
  initialMessage: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedStaffId?: string;
  assignedStaffName?: string;
  isAutomatedRepliesPaused: boolean;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}

export interface MessageTemplate {
  id: string;
  templateKey: string;
  title: string;
  triggerEvent: string;
  channel: 'in_app' | 'whatsapp' | 'email' | 'sms';
  subject?: string;
  bodyTemplate: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface ExternalMessageDispatch {
  id: string;
  orderId?: string;
  supportRequestId?: string;
  channel: 'whatsapp' | 'email' | 'sms';
  recipient: string;
  templateKey?: string;
  messageBody: string;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'simulated_success' | 'suppressed';
  gatewayReference?: string;
  errorDetails?: string;
  createdAt: string;
}

