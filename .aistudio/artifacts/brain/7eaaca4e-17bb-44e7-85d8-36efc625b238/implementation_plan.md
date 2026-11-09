# LK Bakehouse — Complete Bakery Website, POS, Inventory & Financial Management System

LK Bakehouse is a unified, database-backed platform providing both a warm, customer-facing bakery storefront and an operational ERP/POS dashboard for bakery owners, cashiers, kitchen bakers, and managers. All modules run against a single normalized PostgreSQL database with strict role-based access, inventory tracking, auditable stock movements, and financial reconciliation.

---

## 1. System Implementation Summary

### Point of Sale (POS) Module
- **Touch-Friendly Sales Terminal**: Fast, responsive cashier interface with instant search, category filtering, variant selection, and cart adjustments.
- **Atomic Sales Execution**: Server-side price recalculation from catalog records, atomic transaction commit, real-time finished goods inventory movement, and printable customer receipt generation with unique transaction reference.
- **Partial Payments & Customer Balances**: Supports split or partial payments (Cash, M-Pesa, Tigo Pesa, Airtel Money, Bank Transfer) while preserving outstanding accounts receivable.
- **Refunds & Corrections**: Preserves original transaction history and logs offsetting negative ledger entries without hard deletions.

### Inventory Management & Stock Movements
- **Registered Items**: Comprehensive catalog tracking raw ingredients, packaging materials, and finished bakery goods with SKU codes, units of measurement, opening stock, reorder thresholds, and bin locations.
- **Auditable Stock Movements**: No stock quantities can be altered directly without recording an explicit double-entry movement record into `inventory_movements` with source references, responsible staff, movement types (`purchase_received`, `production_consumed`, `pos_sale`, `online_sale`, `spoilage_wastage`, `audit_adjustment`, `supplier_return`), and live balance verification.
- **Shortage & Negative Stock Guard**: Prevents unauthorized negative inventory, providing clear alerts when ingredients fall below reorder thresholds or recipe requirements.

### Supplier Procurement & Goods-Received Workflow
- **Purchase Orders (POs)**: Complete purchase lifecycle supporting multiple item lines, unit costs, delivery dates, and initial payment tender.
- **Dedicated Goods-Received Workflow**: Kitchen/warehouse staff record incoming shipments line-by-line (`POST /api/purchases/:id/receive`), verifying quantities against remaining ordered items to prevent duplicate stock receipts.
- **Weighted Average Costing (WAC)**: Every received shipment automatically recomputes the item's standard unit cost in Tanzanian Shillings using:
  $$\text{New WAC} = \frac{(\text{Current Stock} \times \text{Current Unit Cost}) + (\text{Received Qty} \times \text{PO Unit Cost})}{\text{Current Stock} + \text{Received Qty}}$$
- **Accounts Payable & Balance Tracking**: Partially paid supplier invoices preserve outstanding credit in the financial ledger, with direct payment settlement (`POST /api/purchases/:id/pay`).

### Kitchen Formulations & Scalable Production Batches
- **Standardized Recipes**: Formulations link finished goods to multiple inventory ingredients with standard batch yields and preparation instructions.
- **Dynamic Batch Capacity**: Computes the maximum batches possible in real-time based on current stock on hand.
- **Controlled Production Execution**: Running a production batch (`POST /api/recipes/produce`) validates ingredient availability, aborts on shortages, consumes ingredients atomically via `production_consumed` movements, increments finished products, and records baker assignments in `production_batches`.
- **Order vs. Production Separation**: Customer orders do NOT consume ingredient stock upon submission; raw ingredients are only depleted upon batch baking.

### Financial Management & Accounting Recordkeeping
- **Entity Distinction**: Strict separation between customer orders, completed sales, customer invoices, payments received, supplier purchase orders, operating expenses, refunds, and financial ledger transactions.
- **Sales & Revenue Tracking**: Gross sales (frozen historical line pricing), discounts, customer refunds, and net sales tracked separately. Accrual revenue recognized from completed sales is explicitly distinguished from cash actually collected.
- **Payment Tenders & Idempotency**: Multi-channel collections (M-Pesa, Tigo Pesa, Airtel Money, Bank Transfer, Cash) with idempotency controls. Settlement payments against open invoices update receivables without double-counting sales revenue.
- **Operating Expenses**: Categorized overhead logging (`utilities_energy`, `premises_rent`, `salaries_wages`, `equipment_maintenance`, `logistics_delivery`, `packaging`, `marketing_promotion`, `other`) with responsible staff attribution and ledger entries.
- **Double-Counting Guard**: Strict safeguard preventing supplier purchase orders from being entered as loose operating expenses.
- **Financial Reports & P&L**: Daily, weekly, monthly, and yearly period filters. Gross profit and estimated net operating profit with documented assumptions, cash flow inflows and outflows, customer receivables, supplier payables, and period comparisons.
### Customer Communication & Notification System
- **Authoritative Order Confirmation**: Customer name, unique order reference, itemized frozen products and quantities, subtotal, discount, delivery fee, grand total, fulfillment method (`pickup` vs. `delivery`), current verified status, scheduled fulfillment time, and direct contact details. Explicitly differentiates initial order receipt ("Order Received (Awaiting Staff Review)") from staff acceptance ("Order Confirmed & Accepted").
- **12 Configurable Automated Templates**: Editable templates (`order_received`, `order_confirmed`, `payment_verified`, `pickup_instructions`, `delivery_confirmation`, `preparation_started`, `order_ready`, `order_dispatched`, `order_completed`, `cancellation_request_received`, `delay_notification`, `human_handoff_requested`) with dynamic placeholders (`{{customer_name}}`, `{{order_number}}`, `{{order_total}}`, `{{expected_time}}`, `{{delivery_address}}`, `{{pickup_location}}`, `{{bakery_phone}}`, `{{bakery_whatsapp}}`). Built-in status safeguards prevent asserting an order has been completed or paid unless verified in the database.
- **Fulfillment Messages**: Delivery orders communicate the saved street address, base delivery fee (TSh 7,000), and expected delivery window. Pickup orders communicate the physical bakery address (Plot 42, Haile Selassie Road, Masaki, Dar es Salaam), pickup operating hours, and customer pickup time.
- **Database-Backed Staff Notifications**: Triggers for new online orders, POS sales, payment verifications, status changes, cancellation requests, human handoff tickets, and low-stock alerts. Features unread badges, timestamping, direct deep-linking to relevant management modules, and real-time SSE broadcasts.
- **Human Handoff & Bot Contradiction Prevention**: Customers can request to speak to a human representative directly from the tracking modal or floating concierge. Creates a support ticket (`TKT-LK-XXXXX`), alerts staff, and **immediately pauses automated replies** (`is_automated_replies_paused: true`) so automated messages cannot contradict human staff. Staff can converse, adjust pause settings, and mark tickets as resolved with resolution notes.
- **Configurable Contact Channels & Verified Gateway Log**: Configurable business phone (+255 754 889 900), email (hello@lkbakehouse.co.tz), WhatsApp (+255 754 889 900), and Instagram (@lkbakehouse_tz) with one-click links. Audit ledger (`external_message_dispatches`) logs external messaging attempts with gateway references and delivery statuses, strictly distinguishing in-app notifications from external gateway deliveries.

---

## 2. Automated Test Verification

All 30 integration tests executed against the live PostgreSQL database passed:
1. Product Retrieval
2. Category Filtering
3. Authoritative Price Check
4. Promotion Eligibility
5. Order Creation Transaction
6. Duplicate Order Prevention Window
7. Payment Recording & Status Separation
8. Inventory Separation Check (No ingredient deduction on order receipt)
9. Role-Based Access Verification
10. Real-time Event Broadcaster
11. POS Atomic Sale Execution & Ledger Entry
12. POS Financial Transactions Ledger Check
13. POS Partial Payment & Outstanding Customer Balance
14. POS Refund Workflow Preserving Historical Records
15. Inventory Item & Opening Stock Movement
16. Auditable Stock Movement (Spoilage/Wastage)
17. PO Goods Receipt with WAC Recalculation
18. Duplicate Receipt Guard
19. Supplier Invoice Payment & Balance Tracking
20. Recipe Production & Shortage Prevention
21. Sales Revenue Accounting (Historical Prices, Gross, Discounts, Refunds, Net)
22. Accrual Revenue vs. Cash Collected & Settlement Idempotency
23. Operating Expenses & Ledger Integration
24. Supplier Accounts Payable (Invoicing vs. Payment Disbursals)
25. Cash Flow Summary & Net Liquidity Shift
26. Order Confirmation & Status Differentiation (Receipt vs Acceptance)
27. Message Template Rendering & Verification Safeguards
28. Human Handoff Ticket Creation & Automated Reply Pausing Guarantee
29. Staff Conversation Thread & Ticket Resolution Workflow
30. External Message Gateway Verification & Audit Trail
