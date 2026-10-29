import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { getRazorpayClient } from '@/lib/razorpay';
import { PRICING_PLANS, CREDIT_PACKS } from '@/lib/pricingData';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { itemId, itemType, gstin, businessName } = body;

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
      const plan = PRICING_PLANS.find((p) => p.id === itemId);
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
      amountInInr = pack.rawPriceInr;
      itemName = pack.name;
      creditsAllotment = pack.credits;
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

    // Create Razorpay Order
    const razorpay = getRazorpayClient();
    const amountInPaise = Math.round(amountInInr * 100);
    const receiptNumber = `INV-${Date.now().toString().slice(-6)}`;

    const order = await razorpay.orders.create({
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
        gstin: typeof gstin === 'string' ? gstin.trim().toUpperCase() : '',
        businessName: typeof businessName === 'string' ? businessName.trim() : '',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      amountInr: amountInInr,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      itemName,
      receiptNumber,
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
