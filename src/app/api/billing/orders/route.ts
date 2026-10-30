import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { OrderRecord } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    const queryEmail = searchParams.get('email');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const allParam = searchParams.get('all');

    let userId = queryUserId;
    let userEmail = queryEmail ? queryEmail.trim() : null;

    // Optional token validation
    const authHeader = request.headers.get('authorization');
    const { auth: adminAuth, firestore } = getFirebaseAdmin();

    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        userId = decoded.uid;
        if (decoded.email && !userEmail) {
          userEmail = decoded.email;
        }
      } catch (err) {
        // Fall back to query params
      }
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'userId or email is required to fetch orders.' },
        { status: 400 }
      );
    }

    if (!firestore) {
      return NextResponse.json(
        { success: true, orders: [], total: 0 }
      );
    }

    // Query by userId and/or userEmail (case-insensitive deduplication)
    const orderDocsMap = new Map<string, FirebaseFirestore.DocumentData>();

    if (userId) {
      const snapByUser = await firestore
        .collection('orders')
        .where('userId', '==', userId)
        .get();
      snapByUser.forEach((doc) => orderDocsMap.set(doc.id, { id: doc.id, ...doc.data() }));
    }

    if (userEmail) {
      const snapByEmail = await firestore
        .collection('orders')
        .where('userEmail', '==', userEmail)
        .get();
      snapByEmail.forEach((doc) => orderDocsMap.set(doc.id, { id: doc.id, ...doc.data() }));

      if (userEmail.toLowerCase() !== userEmail) {
        const snapByEmailLower = await firestore
          .collection('orders')
          .where('userEmail', '==', userEmail.toLowerCase())
          .get();
        snapByEmailLower.forEach((doc) => orderDocsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      }
    }

    const orders: OrderRecord[] = Array.from(orderDocsMap.values()).map((d) => {
      const createdAtMs =
        typeof d.createdAt?.toMillis === 'function'
          ? d.createdAt.toMillis()
          : typeof d.createdAt === 'number'
          ? d.createdAt
          : Date.now();

      const paidAtMs =
        typeof d.paidAt?.toMillis === 'function'
          ? d.paidAt.toMillis()
          : typeof d.paidAt === 'number'
          ? d.paidAt
          : createdAtMs;

      return {
        id: d.id,
        razorpayOrderId: d.razorpayOrderId || d.id,
        razorpayPaymentId: d.razorpayPaymentId || '',
        userId: d.userId || userId || '',
        userEmail: d.userEmail || userEmail || '',
        amount: Number(d.amount) || 0,
        amountPaise: Number(d.amountPaise) || 0,
        currency: 'INR',
        status: (d.status || 'paid') as 'paid' | 'created' | 'failed',
        itemType: (d.itemType || 'subscription') as 'subscription' | 'credit_pack',
        itemId: d.itemId || '',
        itemName: d.itemName || 'DocStudio Service',
        creditsAdded: Number(d.creditsAdded) || 0,
        quantity: Number(d.quantity) || 1,
        paymentMethod: d.paymentMethod,
        receiptNumber: d.receiptNumber || `INV-${String(d.id).slice(-6).toUpperCase()}`,
        gstin: d.gstin || undefined,
        businessName: d.businessName || undefined,
        createdAt: createdAtMs,
        paidAt: paidAtMs,
      };
    });

    // Sort newest first
    orders.sort((a, b) => b.createdAt - a.createdAt);

    const total = orders.length;
    const isPaginated = Boolean(pageParam || limitParam);
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.max(1, parseInt(limitParam || '5', 10));

    if (isPaginated && allParam !== 'true') {
      const startIndex = (page - 1) * limit;
      const paginatedOrders = orders.slice(startIndex, startIndex + limit);
      return NextResponse.json({
        success: true,
        orders: paginatedOrders,
        total,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    return NextResponse.json({
      success: true,
      orders,
      total,
      page: 1,
      pageSize: total,
      totalPages: 1,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user orders';
    console.warn('[Billing API] Error fetching user orders, returning empty fallback:', err);
    return NextResponse.json({
      success: true,
      orders: [],
      total: 0,
    });
  }
}
