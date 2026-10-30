import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRazorpayKeySecret } from '@/lib/razorpay';
import {
  recordOrderAdmin,
  upgradeUserPlanAdmin,
  addSharedCreditsAdmin,
  activateEliteMembershipAdmin,
  sanitizeForFirestore,
} from '@/lib/billingServer';
import { sendPurchaseConfirmationEmail } from '@/lib/email/receiptEmail';
import { OrderRecord, PaymentMethodSummary, SubscriptionPlan } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('[Razorpay Webhook] Missing x-razorpay-signature header.');
      return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 });
    }

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || getRazorpayKeySecret() || '';

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Webhook secret not configured on server.');
      return NextResponse.json({ error: 'SERVER_MISCONFIGURED' }, { status: 500 });
    }

    // Cryptographic HMAC SHA256 timing-safe signature verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error('[Razorpay Webhook] Invalid signature received.');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      if (!payment) {
        return NextResponse.json({ status: 'ok', warning: 'No payment entity' });
      }

      const notes = payment.notes || order?.notes || {};
      const userId = notes.userId;
      const userEmail = notes.userEmail || payment.email || '';
      const itemId = notes.itemId;
      const itemType = notes.itemType;
      const itemName = notes.itemName || 'DocStudio Service';
      const creditsAdded = Number(notes.creditsAllotment || 0);

      const methodType = (payment.method as 'card' | 'upi' | 'netbanking' | 'wallet') || 'other';
      const paymentMethod: PaymentMethodSummary = {
        type: methodType,
        brand: payment.card?.network || payment.card?.type || undefined,
        last4: payment.card?.last4 || undefined,
        vpa: payment.vpa || undefined,
        bank: payment.bank || undefined,
        wallet: payment.wallet || undefined,
      };

      const orderRecord: OrderRecord = {
        id: payment.order_id || `order_${payment.id}`,
        razorpayOrderId: payment.order_id || `order_${payment.id}`,
        razorpayPaymentId: payment.id,
        userId: userId || 'anonymous',
        userEmail,
        amount: Number(payment.amount) / 100,
        amountPaise: Number(payment.amount),
        currency: 'INR',
        status: 'paid',
        itemType: itemType || 'credit_pack',
        itemId: itemId || 'custom',
        itemName,
        creditsAdded,
        paymentMethod,
        receiptNumber: notes.receiptNumber || `INV-${payment.id.slice(-6).toUpperCase()}`,
        createdAt: Date.now(),
        paidAt: Date.now(),
      };

      const sanitizedOrder = sanitizeForFirestore(orderRecord);

      // Persist order with Admin privileges
      await recordOrderAdmin(sanitizedOrder);

      // Provision entitlements
      if (userId) {
        if (itemType === 'subscription') {
          const targetPlan: SubscriptionPlan = (itemId === 'enterprise' ? 'enterprise' : 'pro') as SubscriptionPlan;
          await upgradeUserPlanAdmin(userId, userEmail, targetPlan);
        } else if (itemType === 'credit_pack' && creditsAdded > 0) {
          await addSharedCreditsAdmin(userId, userEmail, creditsAdded);
        } else if (itemType === 'membership') {
          await activateEliteMembershipAdmin(userId, userEmail, creditsAdded || 150);
        }
      }

      // Dispatch confirmation email
      if (userEmail) {
        try {
          await sendPurchaseConfirmationEmail({
            order: orderRecord,
            recipientEmail: userEmail,
            recipientName: notes.userName || undefined,
          });
        } catch (mailErr) {
          console.warn('[Razorpay Webhook] Email dispatch warning:', mailErr);
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook error';
    console.error('[Razorpay Webhook] Processing error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
