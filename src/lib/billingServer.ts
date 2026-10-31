import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { OrderRecord, SubscriptionPlan, AppSubscription } from '@/types';
import { DEFAULT_APP_SUBSCRIPTIONS } from '@/lib/firebase/db';
import * as admin from 'firebase-admin';

const ORDERS_COLLECTION = 'orders';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const ENTITLEMENTS_COLLECTION = 'entitlements';

/**
 * Removes undefined fields or converts them to null so Firestore doesn't reject writes.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Persists an order to Firestore using privileged server credentials.
 */
export async function recordOrderAdmin(order: OrderRecord): Promise<boolean> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    console.warn('[DocStudio Billing Admin] Firestore Admin not initialized. Skipping admin order write.');
    return false;
  }

  try {
    const cleanOrder = sanitizeForFirestore(order);
    const orderRef = firestore.collection(ORDERS_COLLECTION).doc(order.id);

    await orderRef.set(
      {
        ...cleanOrder,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[DocStudio Billing Admin] Successfully persisted order ${order.id} for user ${order.userId}`);
    return true;
  } catch (err) {
    console.error('[DocStudio Billing Admin] Error saving order with Admin SDK:', err);
    return false;
  }
}

/**
 * Upgrades user plan and adds plan credits using Firebase Admin SDK.
 */
export async function upgradeUserPlanAdmin(
  userId: string,
  userEmail: string,
  plan: SubscriptionPlan,
  customCredits?: number,
  periodDurationDays = 30
): Promise<boolean> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    console.warn('[DocStudio Billing Admin] Firestore Admin not initialized. Skipping plan upgrade.');
    return false;
  }

  const now = Date.now();
  const nextPeriodEnd = now + periodDurationDays * 24 * 60 * 60 * 1000;
  const planCredits =
    typeof customCredits === 'number'
      ? customCredits
      : plan === 'pro'
      ? 500
      : plan === 'enterprise'
      ? 2500
      : 50;

  try {
    const subsRef = firestore.collection(SUBSCRIPTIONS_COLLECTION);
    const snap = await subsRef.where('userId', '==', userId).get();

    if (!snap.empty) {
      const batch = firestore.batch();
      snap.docs.forEach((docSnap) => {
        const currentData = docSnap.data();
        const currentTotal = typeof currentData.creditsTotal === 'number' ? currentData.creditsTotal : 100;
        const currentRemaining = typeof currentData.creditsRemaining === 'number' ? currentData.creditsRemaining : 100;

        batch.update(docSnap.ref, {
          plan,
          status: 'active',
          creditsTotal: currentTotal + planCredits,
          creditsRemaining: currentRemaining + planCredits,
          currentPeriodEnd: nextPeriodEnd,
          validUntil: nextPeriodEnd,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      console.log(`[DocStudio Billing Admin] Upgraded existing subscriptions to "${plan}" for user ${userId}`);
    } else {
      // Seed initial subscriptions directly if none exist
      const batch = firestore.batch();
      DEFAULT_APP_SUBSCRIPTIONS.forEach((starter) => {
        const subId = `${userId}_${starter.appId}`;
        const ref = subsRef.doc(subId);
        batch.set(
          ref,
          {
            userId,
            userEmail,
            appId: starter.appId,
            appName: starter.appName,
            plan,
            status: 'active',
            creditsTotal: starter.creditsTotal + planCredits,
            creditsRemaining: starter.creditsTotal + planCredits,
            creditsUsed: 0,
            creditsResetPeriod: 'monthly',
            features: starter.features,
            currentPeriodEnd: nextPeriodEnd,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      console.log(`[DocStudio Billing Admin] Seeded new upgraded subscriptions for user ${userId}`);
    }

    // Set entitlement record
    const entRef = firestore.collection(ENTITLEMENTS_COLLECTION).doc(`${userId}_${plan}`);
    await entRef.set(
      {
        userId,
        appId: 'all',
        plan,
        status: 'active',
        source: 'razorpay',
        validUntil: nextPeriodEnd,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    console.error('[DocStudio Billing Admin] Error upgrading user plan with Admin SDK:', err);
    return false;
  }
}

/**
 * Adds credits to a user's primary subscription using Firebase Admin SDK.
 */
export async function addSharedCreditsAdmin(
  userId: string,
  userEmail: string,
  amount: number
): Promise<boolean> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    console.warn('[DocStudio Billing Admin] Firestore Admin not initialized. Skipping credit addition.');
    return false;
  }

  try {
    const subsRef = firestore.collection(SUBSCRIPTIONS_COLLECTION);
    const snap = await subsRef.where('userId', '==', userId).get();

    if (!snap.empty) {
      // Add to primary subscription (first document)
      const primaryDoc = snap.docs[0];
      const data = primaryDoc.data();
      const currentRemaining = typeof data.creditsRemaining === 'number' ? data.creditsRemaining : 0;
      const currentTotal = typeof data.creditsTotal === 'number' ? data.creditsTotal : 0;

      await primaryDoc.ref.update({
        creditsRemaining: currentRemaining + amount,
        creditsTotal: currentTotal + amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[DocStudio Billing Admin] Added +${amount} credits to user ${userId} (${primaryDoc.id})`);
    } else {
      // Seed initial subscriptions with added credits
      const batch = firestore.batch();
      DEFAULT_APP_SUBSCRIPTIONS.forEach((starter, index) => {
        const subId = `${userId}_${starter.appId}`;
        const ref = subsRef.doc(subId);
        const extra = index === 0 ? amount : 0;
        batch.set(
          ref,
          {
            userId,
            userEmail,
            appId: starter.appId,
            appName: starter.appName,
            plan: starter.plan,
            status: 'active',
            creditsTotal: starter.creditsTotal + extra,
            creditsRemaining: starter.creditsTotal + extra,
            creditsUsed: 0,
            creditsResetPeriod: 'monthly',
            features: starter.features,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      console.log(`[DocStudio Billing Admin] Seeded subscriptions with +${amount} top-up credits for user ${userId}`);
    }

    return true;
  } catch (err) {
    console.error('[DocStudio Billing Admin] Error adding credits with Admin SDK:', err);
    return false;
  }
}

/**
 * Checks whether a user holds an active, unexpired Elite Membership.
 */
export async function isUserEliteAdmin(userId: string): Promise<boolean> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore || !userId) return false;
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const data = userDoc.data();
    if (!data?.isEliteMember) return false;
    const expiresAt = Number(data.eliteExpiresAt) || 0;
    return expiresAt > Date.now();
  } catch (err) {
    console.error('[DocStudio Billing Admin] Error checking elite membership:', err);
    return false;
  }
}

/**
 * Activates or renews an annual Elite Membership for a user, adding welcome bonus credits.
 */
export async function activateEliteMembershipAdmin(
  userId: string,
  userEmail: string,
  bonusCredits = 150
): Promise<boolean> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    console.warn('[DocStudio Billing Admin] Firestore Admin not initialized. Skipping elite activation.');
    return false;
  }

  const now = Date.now();
  const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

  try {
    // 1. Update user profile document in users collection
    const userRef = firestore.collection('users').doc(userId);
    await userRef.set(
      {
        isEliteMember: true,
        eliteExpiresAt: oneYearFromNow,
        eliteJoinedAt: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Add welcome bonus credits
    if (bonusCredits > 0) {
      await addSharedCreditsAdmin(userId, userEmail, bonusCredits);
    }

    // 3. Persist entitlement record for ecosystem SSO
    const entRef = firestore.collection(ENTITLEMENTS_COLLECTION).doc(`${userId}_elite_membership`);
    await entRef.set(
      {
        userId,
        appId: 'all',
        plan: 'elite',
        status: 'active',
        source: 'razorpay',
        validUntil: oneYearFromNow,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[DocStudio Billing Admin] Successfully activated Elite Membership for user ${userId} (+${bonusCredits} credits)`);
    return true;
  } catch (err) {
    console.error('[DocStudio Billing Admin] Error activating elite membership with Admin SDK:', err);
    return false;
  }
}

/**
 * Fetches an app subscription using privileged Admin SDK credentials.
 * If dedicated appId subscription doesn't exist, gracefully falls back to the user's primary/active subscription.
 */
export async function getAppSubscriptionAdmin(
  userId: string,
  appId: string
): Promise<AppSubscription | null> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) return null;

  try {
    // 1. Direct match for specific appId
    const directDoc = await firestore.collection(SUBSCRIPTIONS_COLLECTION).doc(`${userId}_${appId}`).get();
    if (directDoc.exists) {
      const d = directDoc.data()!;
      return {
        id: directDoc.id,
        userId: d.userId,
        userEmail: d.userEmail || '',
        appId: d.appId || appId,
        appName: d.appName || d.appId || 'DocStudio Suite',
        plan: (d.plan || 'free') as SubscriptionPlan,
        status: (d.status || 'active') as any,
        creditsTotal: typeof d.creditsTotal === 'number' ? d.creditsTotal : 100,
        creditsRemaining: typeof d.creditsRemaining === 'number' ? d.creditsRemaining : 100,
        creditsUsed: typeof d.creditsUsed === 'number' ? d.creditsUsed : 0,
        creditsResetPeriod: d.creditsResetPeriod || 'monthly',
        features: Array.isArray(d.features) ? d.features : [],
        validUntil: d.validUntil || d.currentPeriodEnd || null,
        createdAt: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : d.createdAt) : Date.now(),
        updatedAt: d.updatedAt ? (d.updatedAt.toMillis ? d.updatedAt.toMillis() : d.updatedAt) : Date.now(),
      };
    }

    // 2. Resilient Fallback: If outside app uses a new/custom appId, look for ANY active subscription for this user
    const subsSnap = await firestore.collection(SUBSCRIPTIONS_COLLECTION).where('userId', '==', userId).get();
    if (!subsSnap.empty) {
      const subs = subsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      subs.sort((a: any, b: any) => (b.creditsRemaining || 0) - (a.creditsRemaining || 0));
      const best: any = subs[0];

      return {
        id: best.id,
        userId: best.userId,
        userEmail: best.userEmail || '',
        appId: appId,
        appName: best.appName || 'DocStudio Suite',
        plan: (best.plan || 'pro') as SubscriptionPlan,
        status: (best.status || 'active') as any,
        creditsTotal: typeof best.creditsTotal === 'number' ? best.creditsTotal : 100,
        creditsRemaining: typeof best.creditsRemaining === 'number' ? best.creditsRemaining : 100,
        creditsUsed: typeof best.creditsUsed === 'number' ? best.creditsUsed : 0,
        creditsResetPeriod: best.creditsResetPeriod || 'monthly',
        features: Array.isArray(best.features) ? best.features : [],
        validUntil: best.validUntil || best.currentPeriodEnd || null,
        createdAt: best.createdAt ? (best.createdAt.toMillis ? best.createdAt.toMillis() : best.createdAt) : Date.now(),
        updatedAt: best.updatedAt ? (best.updatedAt.toMillis ? best.updatedAt.toMillis() : best.updatedAt) : Date.now(),
      };
    }

    return null;
  } catch (err) {
    console.error('[DocStudio Billing Admin] Error fetching app subscription:', err);
    return null;
  }
}

/**
 * Atomically consumes credits using Firebase Admin SDK transactions.
 */
export async function consumeCreditsAdmin(
  userId: string,
  appId: string,
  amount: number,
  action = 'generation',
  metadata?: any
): Promise<{ success: boolean; creditsRemaining?: number; creditsUsed?: number; error?: string }> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    return { success: false, error: 'DATABASE_UNAVAILABLE' };
  }

  try {
    // 1. Determine target subscription document
    let targetDocRef = firestore.collection(SUBSCRIPTIONS_COLLECTION).doc(`${userId}_${appId}`);
    let docSnap = await targetDocRef.get();

    // If dedicated sub doesn't exist, fallback to the subscription with highest remaining credits
    if (!docSnap.exists) {
      const subsSnap = await firestore.collection(SUBSCRIPTIONS_COLLECTION).where('userId', '==', userId).get();
      if (subsSnap.empty) {
        return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
      }
      const subs = subsSnap.docs.map((d) => ({ ref: d.ref, ...d.data() }));
      subs.sort((a: any, b: any) => (b.creditsRemaining || 0) - (a.creditsRemaining || 0));
      targetDocRef = subs[0].ref;
    }

    let finalRemaining = 0;
    let finalUsed = 0;

    await firestore.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(targetDocRef);
      if (!freshSnap.exists) {
        throw new Error('SUBSCRIPTION_NOT_FOUND');
      }

      const data = freshSnap.data()!;
      const currentRemaining = typeof data.creditsRemaining === 'number' ? data.creditsRemaining : 0;
      const currentUsed = typeof data.creditsUsed === 'number' ? data.creditsUsed : 0;

      if (currentRemaining < amount) {
        finalRemaining = currentRemaining;
        const err = new Error('INSUFFICIENT_CREDITS');
        (err as any).creditsRemaining = currentRemaining;
        throw err;
      }

      finalRemaining = currentRemaining - amount;
      finalUsed = currentUsed + amount;

      transaction.update(targetDocRef, {
        creditsRemaining: finalRemaining,
        creditsUsed: finalUsed,
        lastDeductionAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      creditsRemaining: finalRemaining,
      creditsUsed: finalUsed,
    };
  } catch (err: any) {
    if (err.message === 'INSUFFICIENT_CREDITS') {
      return {
        success: false,
        error: 'INSUFFICIENT_CREDITS',
        creditsRemaining: err.creditsRemaining || 0,
      };
    }
    console.error('[DocStudio Billing Admin] Credit consumption error:', err);
    return {
      success: false,
      error: err.message || 'CONSUMPTION_FAILED',
    };
  }
}

/**
 * Ensures default subscriptions are seeded using Admin SDK if user has none.
 */
export async function ensureDefaultUserSubscriptionsAdmin(
  userId: string,
  userEmail: string
): Promise<void> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) return;

  try {
    const subsSnap = await firestore.collection(SUBSCRIPTIONS_COLLECTION).where('userId', '==', userId).get();
    if (!subsSnap.empty) return; // User already has subscriptions

    const batch = firestore.batch();
    for (const starter of DEFAULT_APP_SUBSCRIPTIONS) {
      const subRef = firestore.collection(SUBSCRIPTIONS_COLLECTION).doc(`${userId}_${starter.appId}`);
      batch.set(subRef, {
        userId,
        userEmail,
        appId: starter.appId,
        appName: starter.appName,
        plan: starter.plan,
        status: 'active',
        creditsTotal: starter.creditsTotal,
        creditsRemaining: starter.creditsTotal,
        creditsUsed: 0,
        creditsResetPeriod: 'monthly',
        features: starter.features,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    console.warn('[DocStudio Billing Admin] Error seeding default subscriptions:', err);
  }
}
