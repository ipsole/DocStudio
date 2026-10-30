import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { getRazorpayClient } from '@/lib/razorpay';
import { PRICING_PLANS, CREDIT_PACKS, ALL_PRICING_PLANS, ELITE_MEMBERSHIP } from '@/lib/pricingData';
import { validateCouponServer, recordCouponRedemptionAdmin } from '@/lib/couponsServer';
import {
  recordOrderAdmin,
  upgradeUserPlanAdmin,
  addSharedCreditsAdmin,
  activateEliteMembershipAdmin,
  isUserEliteAdmin,
  sanitizeForFirestore,
} from '@/lib/billingServer';
import { sendPurchaseConfirmationEmail } from '@/lib/email/receiptEmail';
import { OrderRecord, SubscriptionPlan } from '@/types';

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
    } else if (itemType === 'membership') {
      if (itemId !== ELITE_MEMBERSHIP.id) {
        return NextResponse.json(
          { success: false, error: 'INVALID_MEMBERSHIP', message: `Membership pass "${itemId}" does not exist.` },
          { status: 400 }
        );
      }
      amountInInr = ELITE_MEMBERSHIP.rawPriceInr;
      itemName = `${ELITE_MEMBERSHIP.name} Annual Pass`;
      creditsAllotment = ELITE_MEMBERSHIP.bonusCredits;
    } else {
      return NextResponse.json(
        { success: false, error: 'INVALID_TYPE', message: 'itemType must be "subscription", "credit_pack", or "membership".' },
        { status: 400 }
      );
    }

    if (amountInInr <= 0) {
      return NextResponse.json(
        { success: false, error: 'ZERO_AMOUNT', message: 'Free items do not require Razorpay checkout.' },
        { status: 400 }
      );
    }

    const originalAmountInr = amountInInr;

    // Check if user is an active Elite Member to apply 10% universal discount
    let isEliteDiscount = false;
    let eliteDiscountAmount = 0;
    const isElite = await isUserEliteAdmin(userId);

    if (isElite && itemType !== 'membership') {
      isEliteDiscount = true;
      eliteDiscountAmount = Math.round(amountInInr * (ELITE_MEMBERSHIP.discountPercentage / 100));
      amountInInr = Math.max(1, amountInInr - eliteDiscountAmount);
    }

    // Process coupon validation if supplied
    const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : undefined;
    let discountAmount = 0;

    if (couponCode) {
      const val = await validateCouponServer({
        code: couponCode,
        userId,
        userEmail,
        username: userName,
        amountInr: amountInInr,
      });

      if (!val.valid) {
        return NextResponse.json(
          { success: false, error: 'INVALID_COUPON', message: val.reason || 'Coupon code is invalid.' },
          { status: 400 }
        );
      }

      discountAmount = val.discountAmountInr || 0;
      amountInInr = val.finalAmountInr || 0;
    }

    // 100% discount fulfillment (Zero cost)
    if (amountInInr <= 0) {
      const receiptNumber = `INV-PROMO-${Date.now().toString().slice(-6)}`;
      const orderRecord: OrderRecord = {
        id: `order_free_${Date.now()}`,
        razorpayOrderId: `free_${Date.now()}`,
        userId,
        userEmail: userEmail || '',
        amount: 0,
        amountPaise: 0,
        currency: 'INR',
        status: 'paid',
        itemType,
        itemId,
        itemName,
        creditsAdded: creditsAllotment,
        quantity,
        paymentMethod: { type: 'other', wallet: '100% Promotional Discount' },
        couponCode: couponCode || undefined,
        discountAmount,
        isEliteDiscount: isEliteDiscount || undefined,
        eliteDiscountAmount: eliteDiscountAmount || undefined,
        originalAmount: originalAmountInr,
        receiptNumber,
        gstin: typeof gstin === 'string' ? gstin.trim().toUpperCase() : undefined,
        businessName: typeof businessName === 'string' ? businessName.trim() : undefined,
        createdAt: Date.now(),
        paidAt: Date.now(),
      };

      const sanitized = sanitizeForFirestore(orderRecord);
      await recordOrderAdmin(sanitized);

      if (itemType === 'subscription') {
        const isUltra = itemId === 'enterprise' || itemId === 'ultra' || itemId === 'ultra-yearly';
        const targetPlan: SubscriptionPlan = (isUltra ? 'enterprise' : 'pro') as SubscriptionPlan;
        const isYearly = itemId.includes('yearly');
        const periodDays = isYearly ? 365 : 30;
        await upgradeUserPlanAdmin(userId, userEmail || '', targetPlan, creditsAllotment, periodDays);
      } else if (itemType === 'credit_pack' && creditsAllotment > 0) {
        await addSharedCreditsAdmin(userId, userEmail || '', creditsAllotment);
      } else if (itemType === 'membership') {
        await activateEliteMembershipAdmin(userId, userEmail || '', creditsAllotment);
      }

      if (couponCode) {
        await recordCouponRedemptionAdmin({
          code: couponCode,
          userId,
          userEmail: userEmail || '',
          username: userName,
          orderId: orderRecord.id,
          discountAmountInr: discountAmount,
        });
      }

      try {
        if (userEmail) {
          await sendPurchaseConfirmationEmail({
            order: sanitized,
            recipientEmail: userEmail,
            recipientName: userName || undefined,
          });
        }
      } catch (e) {
        console.warn('[Billing API] Receipt email warning for promo order:', e);
      }

      return NextResponse.json({
        success: true,
        isFree: true,
        order: orderRecord,
        receiptNumber,
        message: '100% promotional discount applied! Order activated without payment.',
      });
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
        couponCode: couponCode || '',
        discountAmount: String(discountAmount),
        isEliteDiscount: isEliteDiscount ? 'true' : 'false',
        eliteDiscountAmount: String(eliteDiscountAmount),
        originalAmountInr: String(originalAmountInr),
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
      couponCode: couponCode || undefined,
      discountAmount,
      isEliteDiscount,
      eliteDiscountAmount,
      originalAmountInr,
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
