import dotenv from 'dotenv';
import { db } from '../src/db/index.ts';
import { orders, products, productVariants, messageTemplates, userProfiles } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

dotenv.config();

const API_BASE = 'http://localhost:3000';

async function runPriorityTests() {
  console.log('\n======================================================');
  console.log('LK BAKEHOUSE — PRIORITIZED FIXES VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, detail?: string) => {
    if (condition) {
      console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // Priority 1: Security & Staff Access Control Hardening
    // -------------------------------------------------------------------------
    console.log('--- Checking Priority 1: Security & Access Control ---');

    // 1.1 Unauthenticated request to protected admin endpoint MUST return 401
    const unauthRes = await fetch(`${API_BASE}/api/financial/summary`);
    assert(
      '1.1 Unauthenticated Request Blocked',
      unauthRes.status === 401,
      `Expected 401, got ${unauthRes.status} (Zero fallback to admin)`
    );

    // 1.2 Spoofed / fake staff role header without valid DB user MUST return 401
    const spoofRes = await fetch(`${API_BASE}/api/financial/summary`, {
      headers: {
        'x-staff-role': 'admin',
        'x-staff-session-id': '00000000-0000-0000-0000-000000000000',
      },
    });
    assert(
      '1.2 Spoofed Role Header Blocked',
      spoofRes.status === 401,
      `Expected 401 for unverified staff ID, got ${spoofRes.status}`
    );

    // 1.3 Verified staff credentials allow authorized access
    const authRes = await fetch(`${API_BASE}/api/financial/summary`, {
      headers: {
        'x-staff-session-id': 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
        'x-staff-email': 'admin@lkbakehouse.co.tz',
      },
    });
    assert(
      '1.3 Authenticated Admin Staff Access',
      authRes.status === 200,
      `Expected 200, got ${authRes.status}`
    );

    // -------------------------------------------------------------------------
    // Priority 2: Customer Privacy in Order Tracking
    // -------------------------------------------------------------------------
    console.log('\n--- Checking Priority 2: Customer Privacy in Order Tracking ---');

    const testTrackOrderNum = `PRIV-TEST-${Date.now()}`;
    const [insertedOrder] = await db.insert(orders).values({
      orderNumber: testTrackOrderNum,
      customerName: 'Amina Chole',
      customerPhone: '+255 754 998 811',
      customerEmail: 'amina.chole@gmail.com',
      deliveryStreetAddress: 'Plot 18, Chole Road, Masaki, Dar es Salaam',
      subtotalTzs: '25000.00',
      totalAmountTzs: '25000.00',
      fulfillmentType: 'delivery',
      status: 'confirmed',
    }).returning();

    // 2.1 Public lookup without contact param: returns safe preview with PII stripped
    const publicTrackRes = await fetch(`${API_BASE}/api/orders/track/${testTrackOrderNum}`);
    const publicData = await publicTrackRes.json();
    assert(
      '2.1 Unverified Public Order Tracking Protected',
      publicData.verified === false &&
      publicData.requiresVerification === true &&
      !publicData.customerPhone &&
      !publicData.deliveryStreetAddress,
      `PII hidden from anonymous lookups. Response: verified=${publicData.verified}`
    );

    // 2.2 Lookup with incorrect contact: returns 403 Forbidden
    const wrongContactRes = await fetch(`${API_BASE}/api/orders/track/${testTrackOrderNum}?contact=0799000000`);
    assert(
      '2.2 Incorrect Contact Rejected',
      wrongContactRes.status === 403,
      `Expected 403, got ${wrongContactRes.status}`
    );

    // 2.3 Lookup with correct contact: unlocks details with masked PII
    const verifiedTrackRes = await fetch(`${API_BASE}/api/orders/track/${testTrackOrderNum}?contact=0754998811`);
    const verifiedData = await verifiedTrackRes.json();
    assert(
      '2.3 Verified Customer Order Tracking with Masked PII',
      verifiedData.verified === true &&
      verifiedData.customerPhone.includes('•') &&
      verifiedData.customerPhone !== '+255 754 998 811' &&
      verifiedData.deliveryStreetAddress.includes('Chole Road'),
      `Masked Phone: ${verifiedData.customerPhone}, Masked Address: ${verifiedData.deliveryStreetAddress}`
    );

    // -------------------------------------------------------------------------
    // Priority 3: Administrative Product Management CRUD
    // -------------------------------------------------------------------------
    console.log('\n--- Checking Priority 3: Administrative Product CRUD ---');

    // 3.1 Create Product
    const newProductPayload = {
      name: `Artisan Spelt Loaf ${Date.now()}`,
      basePriceTzs: '13500.00',
      description: 'Slow-fermented organic ancient grain spelt bread.',
      leadTimeHours: 4,
      isFeatured: true,
      isAvailable: true,
      variants: [
        { variantName: 'Standard Loaf', priceAdjustmentTzs: '0.00' },
        { variantName: 'Sliced Loaf', priceAdjustmentTzs: '1000.00' },
      ],
    };

    const createProdRes = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-session-id': 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
        'x-staff-email': 'admin@lkbakehouse.co.tz',
      },
      body: JSON.stringify(newProductPayload),
    });
    const createdProd = await createProdRes.json();
    assert(
      '3.1 Admin Product Creation',
      createProdRes.status === 201 && Boolean(createdProd.id) && createdProd.variants?.length === 2,
      `Created product "${createdProd.name}" (ID: ${createdProd.id}) with 2 variants`
    );

    // 3.2 Update Product Price & Details
    const updateProdRes = await fetch(`${API_BASE}/api/products/${createdProd.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-session-id': 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
        'x-staff-email': 'admin@lkbakehouse.co.tz',
      },
      body: JSON.stringify({
        basePriceTzs: '14500.00',
        description: 'Updated slow-fermented organic spelt with sesame crust.',
      }),
    });
    const updatedProd = await updateProdRes.json();
    assert(
      '3.2 Admin Product Update',
      updateProdRes.status === 200 && Number(updatedProd.basePriceTzs) === 14500,
      `Updated price to TSh ${Number(updatedProd.basePriceTzs).toLocaleString()}`
    );

    // 3.3 Fast Availability Toggle
    const toggleRes = await fetch(`${API_BASE}/api/products/${createdProd.id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-session-id': 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
        'x-staff-email': 'admin@lkbakehouse.co.tz',
      },
      body: JSON.stringify({ isAvailable: false }),
    });
    const toggledProd = await toggleRes.json();
    assert(
      '3.3 Product Availability Toggle',
      toggleRes.status === 200 && toggledProd.isAvailable === false,
      `Toggled status: isAvailable=${toggledProd.isAvailable}`
    );

    // 3.4 Soft Archive Product
    const archiveRes = await fetch(`${API_BASE}/api/products/${createdProd.id}`, {
      method: 'DELETE',
      headers: {
        'x-staff-session-id': 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
        'x-staff-email': 'admin@lkbakehouse.co.tz',
      },
    });
    const archiveData = await archiveRes.json();
    assert(
      '3.4 Admin Product Archival',
      archiveRes.status === 200 && archiveData.archived === true,
      `Product archived successfully`
    );

    // -------------------------------------------------------------------------
    // Priority 5: Message Templates Management
    // -------------------------------------------------------------------------
    console.log('\n--- Checking Priority 5: Message Templates ---');

    const tmplRes = await fetch(`${API_BASE}/api/communication/templates`);
    const tmplList = await tmplRes.json();
    assert(
      '5.1 All 12 Automated Response Templates Available',
      Array.isArray(tmplList) && tmplList.length === 12,
      `Found ${tmplList.length} editable message templates`
    );

    const updateTmplRes = await fetch(`${API_BASE}/api/communication/templates/order_received`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-session-id': 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
        'x-staff-email': 'admin@lkbakehouse.co.tz',
      },
      body: JSON.stringify({
        subject: 'LK Bakehouse: We have received your order #{{order_number}}',
      }),
    });
    const updatedTmpl = await updateTmplRes.json();
    assert(
      '5.2 Admin Message Template Customization',
      updateTmplRes.status === 200 && updatedTmpl.subject.includes('#{{order_number}}'),
      `Template subject updated in PostgreSQL`
    );

    // Cleanup test records
    if (insertedOrder?.id) {
      await db.delete(orders).where(eq(orders.id, insertedOrder.id));
    }
    if (createdProd?.id) {
      await db.delete(productVariants).where(eq(productVariants.productId, createdProd.id));
      await db.delete(products).where(eq(products.id, createdProd.id));
    }

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`PRIORITIZED SUITE RESULT: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');
}

runPriorityTests().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
