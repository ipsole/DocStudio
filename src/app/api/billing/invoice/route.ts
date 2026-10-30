import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { generatePrintableInvoiceHtml } from '@/lib/email/invoiceTemplate';
import { OrderRecord } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const receiptNumber = searchParams.get('receipt');

    if (!orderId && !receiptNumber) {
      return new NextResponse('Missing orderId or receipt query parameter.', { status: 400 });
    }

    const { firestore } = getFirebaseAdmin();
    if (!firestore) {
      return new NextResponse('Database unavailable.', { status: 500 });
    }

    let orderData: OrderRecord | null = null;

    if (orderId) {
      const doc = await firestore.collection('orders').doc(orderId).get();
      if (doc.exists) {
        orderData = doc.data() as OrderRecord;
      }
    }

    if (!orderData && receiptNumber) {
      const snapshot = await firestore
        .collection('orders')
        .where('receiptNumber', '==', receiptNumber)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        orderData = snapshot.docs[0].data() as OrderRecord;
      }
    }

    if (!orderData) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Invoice Not Found</h2>
          <p>The requested invoice record does not exist or has expired.</p>
          <a href="/">Return to DocStudio</a>
        </body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const invoiceHtml = generatePrintableInvoiceHtml(orderData, orderData.businessName || orderData.userEmail);

    return new NextResponse(invoiceHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return new NextResponse(`Error generating invoice: ${errorMsg}`, { status: 500 });
  }
}
