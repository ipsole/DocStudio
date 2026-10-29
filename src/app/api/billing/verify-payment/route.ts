import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRazorpayClient } from '@/lib/razorpay';
import { PRICING_PLANS, CREDIT_PACKS, ALL_PRICING_PLANS } from '@/lib/pricingData';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { saveOrderRecord, upgradeUserPlan, addSharedCredits } from '@/lib/firebase/db';
import {
  recordOrderAdmin,
  upgradeUserPlanAdmin,
  addSharedCreditsAdmin,
  sanitizeForFirestore,
} from '@/lib/billingServer';
import { sendPurchaseConfirmationEmail } from '@/lib/email/receiptEmail';
import { OrderRecord, PaymentMethodSummary, SubscriptionPlan } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      userEmail,
      itemId,
      itemType,
      receiptNumber,
      userName,
      gstin,
      businessName,
      quantity: rawQty,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PAYMENT_DETAILS', message: 'Required Razorpay verification parameters missing.' },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'SERVER_MISCONFIGURED', message: 'Razorpay Key Secret is missing on server.' },
        { status: 500 }
      );
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[Billing API] Tampered or invalid Razorpay signature detected!');
      return NextResponse.json(
        { success: false, error: 'INVALID_SIGNATURE', message: 'Cryptographic signature verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch official payment details from Razorpay
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Extract payment method details
    const methodType = (payment.method as 'card' | 'upi' | 'netbanking' | 'wallet') || 'other';
    const paymentMethod: PaymentMethodSummary = {
      type: methodType,
      brand: payment.card?.network || payment.card?.type || undefined,
      last4: payment.card?.last4 || undefined,
      vpa: payment.vpa || undefined,
      bank: payment.bank || undefined,
      wallet: payment.wallet || undefined,
    };

    // 3. Resolve item details and credits (with quantity support 1-7)
    const quantity = Math.max(1, Math.min(7, Math.floor(Number(rawQty || payment.notes?.quantity) || 1)));
    let itemName = 'DocStudio Software Service';
    let creditsAdded = 0;
    const amountInr = Number(payment.amount) / 100;

    if (itemType === 'subscription') {
      const plan = ALL_PRICING_PLANS.find((p) => p.id === itemId) || PRICING_PLANS.find((p) => p.id === itemId);
      if (plan) {
        itemName = plan.name;
        creditsAdded = plan.creditsAllotment;
      }
    } else if (itemType === 'credit_pack') {
      const pack = CREDIT_PACKS.find((p) => p.id === itemId);
      if (pack) {
        creditsAdded = pack.credits * quantity;
        itemName = quantity > 1 ? `${pack.name} (Qty: ${quantity} • +${creditsAdded} Credits)` : pack.name;
      }
    }

    const finalReceiptNumber = receiptNumber || `INV-${Date.now().toString().slice(-6)}`;

    // 4. Construct Order Record
    const orderRecord: OrderRecord = {
      id: razorpay_order_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userId: userId || 'anonymous',
      userEmail: userEmail || (payment.email as string) || '',
      amount: amountInr,
      amountPaise: Number(payment.amount),
      currency: 'INR',
      status: 'paid',
      itemType: itemType || 'credit_pack',
      itemId: itemId || 'custom',
      itemName,
      creditsAdded,
      quantity,
      paymentMethod,
      receiptNumber: finalReceiptNumber,
      gstin: gstin || (payment.notes?.gstin as string) || undefined,
      businessName: businessName || (payment.notes?.businessName as string) || undefined,
      createdAt: Date.now(),
      paidAt: Date.now(),
    };

    // 5. Database Persistence (Admin SDK for server-side authority)
    const sanitizedOrder = sanitizeForFirestore(orderRecord);
    const adminSaved = await recordOrderAdmin(sanitizedOrder);
    if (!adminSaved) {
      try {
        await saveOrderRecord(sanitizedOrder);
      } catch (clientDbErr) {
        console.warn('[Billing API] Client db fallback write skipped:', clientDbErr);
      }
    }

    // 6. Provision user account entitlements / credits via Admin SDK
    if (userId) {
      if (itemType === 'subscription') {
        const isUltra = itemId === 'enterprise' || itemId === 'ultra' || itemId === 'ultra-yearly';
        const targetPlan: SubscriptionPlan = (isUltra ? 'enterprise' : 'pro') as SubscriptionPlan;
        const isYearly = itemId.includes('yearly');
        const periodDurationDays = isYearly ? 365 : 30;

        const upgraded = await upgradeUserPlanAdmin(
          userId,
          userEmail || '',
          targetPlan,
          creditsAdded,
          periodDurationDays
        );
        if (!upgraded) {
          try {
            await upgradeUserPlan(userId, userEmail || '', targetPlan);
          } catch (upgradeErr) {
            console.warn('[Billing API] Client db plan upgrade skipped:', upgradeErr);
          }
        }
      } else if (itemType === 'credit_pack' && creditsAdded > 0) {
        const credited = await addSharedCreditsAdmin(userId, userEmail || '', creditsAdded);
        if (!credited) {
          try {
            await addSharedCredits(userId, userEmail || '', creditsAdded);
          } catch (creditErr) {
            console.warn('[Billing API] Client db credits addition skipped:', creditErr);
          }
        }
      }

      // 6b. Automatically persist/secure tokenized payment method if available
      if (paymentMethod && paymentMethod.type !== 'other') {
        try {
          const { firestore } = getFirebaseAdmin();
          if (firestore) {
            await firestore.collection('users').doc(userId).set(
              {
                savedPaymentMethod: paymentMethod,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (savePmErr) {
          console.warn('[Billing API] Saved payment method write warning:', savePmErr);
        }
      }
    }

    // 7. Dispatch purchase confirmation email
    if (orderRecord.userEmail) {
      try {
        await sendPurchaseConfirmationEmail({
          order: orderRecord,
          recipientEmail: orderRecord.userEmail,
          recipientName: userName || undefined,
        });
      } catch (emailErr) {
        console.warn('[Billing API] Non-blocking receipt email issue:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and account provisioned successfully.',
      order: orderRecord,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Payment verification failed.';
    console.error('[Billing API] Error verifying payment:', err);
    return NextResponse.json(
      { success: false, error: 'VERIFICATION_FAILED', message: errorMsg },
      { status: 500 }
    );
  }
}
