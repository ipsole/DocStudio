import { OrderRecord } from '@/types';

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[DocStore Checkout] Failed to load Razorpay checkout.js script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

interface CheckoutOptions {
  itemId: string;
  itemType: 'subscription' | 'credit_pack';
  userId: string;
  userEmail: string;
  userName?: string;
  gstin?: string;
  businessName?: string;
  onVerifying?: () => void;
  onSuccess?: (order: OrderRecord) => void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

export async function openRazorpayCheckout({
  itemId,
  itemType,
  userId,
  userEmail,
  userName,
  gstin,
  businessName,
  onVerifying,
  onSuccess,
  onError,
  onDismiss,
}: CheckoutOptions): Promise<void> {
  try {
    // 1. Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Unable to connect to payment gateway. Please check your network connection.');
    }

    // 2. Create verified order on backend
    const res = await fetch('/api/billing/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, itemType, userId, userEmail, userName, gstin, businessName }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Could not initiate payment order.');
    }

    // 3. Configure Razorpay Standard Checkout options
    interface RazorpayResponse {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }

    interface RazorpayInstance {
      open: () => void;
      on: (event: string, handler: (resp: unknown) => void) => void;
    }

    interface RazorpayConstructor {
      new (options: unknown): RazorpayInstance;
    }

    const RazorpayClass = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;

    const rzp = new RazorpayClass({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency || 'INR',
      name: 'DocStudio',
      description: data.itemName,
      order_id: data.orderId,
      prefill: {
        name: businessName || userName || '',
        email: userEmail || '',
      },
      notes: {
        itemId,
        itemType,
        receiptNumber: data.receiptNumber,
        gstin: gstin || '',
        businessName: businessName || '',
      },
      theme: {
        color: '#09090b',
        backdrop_color: 'rgba(0, 0, 0, 0.85)',
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          onDismiss?.();
        },
      },
      handler: async (paymentResponse: RazorpayResponse) => {
        try {
          onVerifying?.();
          // 4. Verify payment on backend
          const verifyRes = await fetch('/api/billing/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              userId,
              userEmail,
              itemId,
              itemType,
              receiptNumber: data.receiptNumber,
              userName: businessName || userName,
              gstin,
              businessName,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.message || 'Payment signature verification failed.');
          }

          onSuccess?.(verifyData.order);
        } catch (verifyErr) {
          const msg = verifyErr instanceof Error ? verifyErr.message : 'Failed to finalize transaction.';
          onError?.(msg);
        }
      },
    });

    rzp.on('payment.failed', (failedResponse: unknown) => {
      const err = failedResponse as { error?: { description?: string } };
      onError?.(err?.error?.description || 'Payment failed or was cancelled.');
    });

    rzp.open();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment checkout could not be opened.';
    onError?.(msg);
  }
}
