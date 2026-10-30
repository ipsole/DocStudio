import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { verifyAdminRequest } from '@/lib/adminAuthHelper';
import { DEMO_APPS } from '@/lib/seedData';

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
