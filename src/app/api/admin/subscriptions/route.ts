import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { verifyAdminRequest } from '@/lib/adminAuthHelper';
import { SubscriptionPlan, SubscriptionStatus } from '@/types';

export const dynamic = 'force-dynamic';

async function verifyAdmin(req: NextRequest) {
  return verifyAdminRequest(req);
}

// GET: List all user subscriptions
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdmin(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const snapshot = await firestore.collection('subscriptions').orderBy('updatedAt', 'desc').limit(50).get();
    const subs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    return NextResponse.json({ success: true, data: subs });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

// POST: Grant or update subscription & credits for a user
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin(req);
  if (!authCheck.isAuthorized) {
    return NextResponse.json({ success: false, error: authCheck.error }, { status: 403 });
  }

  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const {
      userId,
      userEmail,
      appId,
      appName,
      plan = 'starter',
      creditsTotal = 100,
      creditsRemaining = 100,
      features = [],
    } = body;

    if (!userId || !appId) {
      return NextResponse.json({ success: false, error: 'userId and appId are required' }, { status: 400 });
    }

    const subId = `${userId}_${appId}`;
    const subRef = firestore.collection('subscriptions').doc(subId);

    const dataToSave = {
      userId,
      userEmail: userEmail || '',
      appId,
      appName: appName || appId,
      plan: plan as SubscriptionPlan,
      status: 'active' as SubscriptionStatus,
      creditsTotal: Number(creditsTotal),
      creditsRemaining: Number(creditsRemaining),
      creditsUsed: 0,
      creditsResetPeriod: 'monthly',
      features: Array.isArray(features) ? features : [],
      updatedAt: Date.now(),
    };

    await subRef.set(dataToSave, { merge: true });

    return NextResponse.json({ success: true, data: { id: subId, ...dataToSave } });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
