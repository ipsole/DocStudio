import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { auth: adminAuth, firestore } = getFirebaseAdmin();

    if (!authHeader || !authHeader.startsWith('Bearer ') || !adminAuth) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Bearer authentication token required.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Authentication token is invalid or expired.' },
        { status: 401 }
      );
    }

    if (!firestore) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Firestore Admin not initialized.' },
        { status: 500 }
      );
    }

    // Wipe stored payment method from user profile
    await firestore.collection('users').doc(userId).set(
      {
        savedPaymentMethod: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Stored payment method wiped securely.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to wipe payment method.';
    console.error('[Payment Method API] Error deleting payment method:', err);
    return NextResponse.json(
      { success: false, error: 'DELETE_FAILED', message: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { auth: adminAuth, firestore } = getFirebaseAdmin();

    if (!authHeader || !authHeader.startsWith('Bearer ') || !adminAuth) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Bearer authentication token required.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Authentication token is invalid or expired.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { paymentMethod } = body;

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'paymentMethod is required.' },
        { status: 400 }
      );
    }

    if (!firestore) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Firestore Admin not initialized.' },
        { status: 500 }
      );
    }

    await firestore.collection('users').doc(userId).set(
      {
        savedPaymentMethod: paymentMethod,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment method secured successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save payment method.';
    console.error('[Payment Method API] Error saving payment method:', err);
    return NextResponse.json(
      { success: false, error: 'SAVE_FAILED', message: msg },
      { status: 500 }
    );
  }
}
