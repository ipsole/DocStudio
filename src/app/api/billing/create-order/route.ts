import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { getRazorpayClient } from '@/lib/razorpay';
import { PRICING_PLANS, CREDIT_PACKS, ALL_PRICING_PLANS } from '@/lib/pricingData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { itemId, itemType, gstin, businessName, userName, userPhone } = body;
    const rawQuantity = Number(body.quantity) || 1;
    const quantity = Math.max(1, Math.min(7, Math.floor(rawQuantity)));

    if (!itemId || !itemType) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'itemId and itemType are required.' },
        { status: 400 }
      );
    }

    // Authenticate user
    let userId = body.userId;
    let userEmail = body.userEmail;

    const authHeader = request.headers.get('authorization');
    const { auth: adminAuth } = getFirebaseAdmin();

    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        userId = decoded.uid;
        userEmail = decoded.email || userEmail;
      } catch (err) {
        console.warn('[Billing API] ID Token verify warning, using fallback credentials:', err);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'User must be authenticated to initiate payment.' },
        { status: 401 }
      );
    }

    // Resolve trusted server-side pricing
    let amountInInr = 0;
    let itemName = '';
    let creditsAllotment = 0;

    if (itemType === 'subscription') {
      const plan = ALL_PRICING_PLANS.find((p) => p.id === itemId);
      if (!plan) {
        return NextResponse.json(
          { success: false, error: 'INVALID_PLAN', message: `Subscription plan "${itemId}" does not exist.` },
          { status: 400 }
        );
      }
      amountInInr = plan.rawPriceInr;
      itemName = plan.name;
      creditsAllotment = plan.creditsAllotment;
    } else if (itemType === 'credit_pack') {
      const pack = CREDIT_PACKS.find((p) => p.id === itemId);
      if (!pack) {
        return NextResponse.json(
          { success: false, error: 'INVALID_PACK', message: `Credit pack "${itemId}" does not exist.` },
          { status: 400 }
        );
      }
      amountInInr = pack.rawPriceInr * quantity;
      creditsAllotment = pack.credits * quantity;
      itemName = quantity > 1 ? `${pack.name} (Qty: ${quantity} • +${creditsAllotment} Credits)` : pack.name;
    } else {
      return NextResponse.json(
        { success: false, error: 'INVALID_TYPE', message: 'itemType must be "subscription" or "credit_pack".' },
        { status: 400 }
      );
    }

    if (amountInInr <= 0) {
      return NextResponse.json(
        { success: false, error: 'ZERO_AMOUNT', message: 'Free items do not require Razorpay checkout.' },
        { status: 400 }
      );
    }

    // Resolve or create Razorpay Customer ID for tokenized saved cards
    const razorpay = getRazorpayClient();
    let customerId: string | undefined;

    const { firestore } = getFirebaseAdmin();
    if (firestore && userId) {
      try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data()?.razorpayCustomerId) {
          customerId = userDoc.data()?.razorpayCustomerId;
        } else {
          const cleanPhone = userPhone ? String(userPhone).replace(/[^\d+]/g, '') : undefined;
          const customer = await razorpay.customers.create({
            name: userName || 'DocStudio User',
            email: userEmail || undefined,
            contact: cleanPhone || undefined,
            fail_existing: 0,
            notes: { userId },
          });
          if (customer?.id) {
            customerId = customer.id;
            await firestore.collection('users').doc(userId).set(
              { razorpayCustomerId: customer.id },
              { merge: true }
            );
          }
        }
      } catch (custErr: unknown) {
        const errObj = custErr as { statusCode?: number; error?: { description?: string } };
        if (errObj?.error?.description?.includes('already exists') || errObj?.statusCode === 400) {
          try {
            const list = await razorpay.customers.all({ count: 50 });
            const cleanPhone = userPhone ? String(userPhone).replace(/[^\d+]/g, '') : undefined;
            const existing = list.items.find(
              (c) =>
                (userEmail && c.email?.toLowerCase() === userEmail.toLowerCase()) ||
                (cleanPhone && String(c.contact) === cleanPhone)
            );
            if (existing?.id) {
              customerId = existing.id;
              await firestore.collection('users').doc(userId).set(
                { razorpayCustomerId: existing.id },
                { merge: true }
              );
            }
          } catch (listErr) {
            console.warn('[Billing API] Error fetching existing Razorpay customer list:', listErr);
          }
        }
        if (!customerId) {
          console.warn('[Billing API] Razorpay customer create/lookup warning:', custErr);
        }
      }
    }

    // Create Razorpay Order
    const amountInPaise = Math.round(amountInInr * 100);
    const receiptNumber = `INV-${Date.now().toString().slice(-6)}`;

    const orderPayload: Parameters<typeof razorpay.orders.create>[0] & { customer_id?: string } = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptNumber,
      notes: {
        userId,
        userEmail: userEmail || '',
        itemId,
        itemType,
        itemName,
        creditsAllotment: String(creditsAllotment),
        quantity: String(quantity),
        gstin: typeof gstin === 'string' ? gstin.trim().toUpperCase() : '',
        businessName: typeof businessName === 'string' ? businessName.trim() : '',
      },
    };

    if (customerId) {
      orderPayload.customer_id = customerId;
    }

    const order = await razorpay.orders.create(orderPayload);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      amountInr: amountInInr,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      itemName,
      receiptNumber,
      customerId,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create payment order.';
    console.error('[Billing API] Error creating Razorpay order:', err);
    return NextResponse.json(
      { success: false, error: 'ORDER_CREATION_FAILED', message: errorMsg },
      { status: 500 }
    );
  }
}
