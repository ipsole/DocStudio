import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { verifyAdminRequest } from '@/lib/adminAuthHelper';
import { DEMO_APPS, DEFAULT_COUPONS } from '@/lib/seedData';

export async function POST(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
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
    for (const coupon of DEFAULT_COUPONS) {
      const docRef = firestore.collection('coupons').doc(coupon.code);
      batch.set(docRef, coupon, { merge: true });
    }
    batch.set(
      firestore.collection('system').doc('coupons_init'),
      {
        initializedAt: Date.now(),
        seededCount: DEFAULT_COUPONS.length,
      },
      { merge: true }
    );
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${DEMO_APPS.length} demo products and ${DEFAULT_COUPONS.length} default coupons to Firestore.`,
    });
  } catch (err: unknown) {
    console.error('[API Seed] Error seeding demo data:', err);
    return NextResponse.json({ success: false, error: 'Failed to seed database.' }, { status: 500 });
  }
}
