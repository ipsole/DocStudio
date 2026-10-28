import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { DEMO_APPS } from '@/lib/seedData';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const adminSecretHeader = req.headers.get('x-docstore-admin-secret');
  const configuredSecret = process.env.DOCSTORE_ADMIN_SECRET;

  let isAuthorized = false;

  if (configuredSecret && adminSecretHeader && adminSecretHeader === configuredSecret) {
    isAuthorized = true;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    const { auth: adminAuth, firestore: adminDb } = getFirebaseAdmin();
    if (adminAuth && token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.admin === true) {
          isAuthorized = true;
        } else if (adminDb) {
          const snap = await adminDb.collection('admins').doc(decoded.uid).get();
          if (snap.exists) isAuthorized = true;
        }
      } catch {
        isAuthorized = false;
      }
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
  }

  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured.' }, { status: 503 });
  }

  try {
    const batch = firestore.batch();
    for (const app of DEMO_APPS) {
      const docRef = firestore.collection('apps').doc(app.id);
      batch.set(docRef, {
        ...app,
        updatedAt: Date.now(),
      }, { merge: true });
    }
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${DEMO_APPS.length} demo products to Firestore.`,
    });
  } catch (err: unknown) {
    console.error('[API Seed] Error seeding demo apps:', err);
    return NextResponse.json({ success: false, error: 'Failed to seed database.' }, { status: 500 });
  }
}
