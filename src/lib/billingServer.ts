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
