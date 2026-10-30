import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, device } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { auth, firestore } = getFirebaseAdmin();

    if (!auth || !firestore) {
      return NextResponse.json(
        { error: 'Authentication engine unavailable. Please try standard sign in.' },
        { status: 500 }
      );
    }

    const qrDocRef = firestore.collection('qr_logins').doc(token);
    const snap = await qrDocRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Login session expired or invalid. Please generate a new QR code.' },
        { status: 404 }
      );
    }

    const sessionData = snap.data();
    if (!sessionData) {
      return NextResponse.json({ error: 'Session data corrupt.' }, { status: 400 });
    }

    // Check expiry
    if (Date.now() > sessionData.expiresAt) {
      await qrDocRef.update({ status: 'expired' });
      return NextResponse.json(
        { error: 'This QR login code has expired. Please refresh the QR code on your main device.' },
        { status: 400 }
      );
    }

    // Check if already used or revoked
    if (sessionData.status !== 'pending') {
      return NextResponse.json(
        { error: `This QR code has already been ${sessionData.status}.` },
        { status: 400 }
      );
    }

    // Mint Firebase custom token for client SDK authentication
    const customToken = await auth.createCustomToken(sessionData.userId, {
      source: 'qr_handshake',
      productionHost: 'docstudio.docdril.com',
    });

    // Mark QR session as authenticated
    await qrDocRef.update({
      status: 'authenticated',
      redeemedAt: Date.now(),
      redeemedByDevice: device || {},
    });

    return NextResponse.json({
      success: true,
      customToken,
      userId: sessionData.userId,
      username: sessionData.username,
      email: sessionData.userEmail,
    });
  } catch (err: any) {
    console.error('[QR Redeem API] Error redeeming QR token:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to authorize QR login.' },
      { status: 500 }
    );
  }
}
