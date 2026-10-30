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

    if (!orderId || !receiptNumber) {
      return new NextResponse('Both orderId and receipt parameters are required to securely locate the invoice.', { status: 400 });
    }

    const { firestore, auth: adminAuth } = getFirebaseAdmin();
    if (!firestore) {
      return new NextResponse('Database unavailable.', { status: 500 });
    }

    // Look up order record by orderId
    const doc = await firestore.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Invoice Not Found</h2>
          <p>The requested invoice record does not exist or has expired.</p>
          <a href="/">Return to DocStudio</a>
        </body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const orderData = doc.data() as OrderRecord;

    // Strict validation: receipt number must match the orderId record
    if (orderData.receiptNumber !== receiptNumber) {
      return new NextResponse('Security verification failed: receipt mismatch.', { status: 403 });
    }

    // If an authorization token is supplied, enforce ownership or admin privilege
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(idToken);
        const isSuperAdmin = decoded.email === 'izackstudio1@gmail.com' || decoded.admin === true;
        if (!isSuperAdmin && decoded.uid !== orderData.userId) {
          return new NextResponse('Access denied to this invoice.', { status: 403 });
        }
      } catch {
        return new NextResponse('Invalid authorization credentials.', { status: 401 });
      }
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
