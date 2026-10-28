import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  runTransaction,
  addDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';
import {
  DocApp,
  UserProfile,
  Entitlement,
  AppSubscription,
  CreditUsageRecord,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/types';
import { DEMO_APPS } from '../seedData';

const APPS_COLLECTION = 'apps';
const USERS_COLLECTION = 'users';
const ENTITLEMENTS_COLLECTION = 'entitlements';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const CREDIT_LOGS_COLLECTION = 'credit_logs';
const TOMBSTONES_COLLECTION = 'account_tombstones';

/**
 * Fetch public catalog apps (active and coming_soon products).
 * Drafts and archived products are excluded by query and security rules.
 */
export async function getPublicApps(): Promise<DocApp[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const appsRef = collection(db, APPS_COLLECTION);
      // Query for public apps.
      const q = query(
        appsRef,
        where('visibility', '==', 'public'),
        where('status', 'in', ['active', 'coming_soon'])
      );
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          slug: data.slug || docSnap.id,
          name: data.name || '',
          shortDescription: data.shortDescription || '',
          description: data.description || '',
          category: data.category || 'utilities',
          icon: data.icon,
          status: data.status || 'coming_soon',
          visibility: data.visibility || 'public',
          applicationUrl: data.applicationUrl || null,
          featured: Boolean(data.featured),
          version: data.version || '1.0.0',
          tags: Array.isArray(data.tags) ? data.tags : [],
          isDemo: Boolean(data.isDemo),
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
        } as DocApp;
      });

      if (apps.length > 0) {
        return apps;
      }
    } catch (err) {
      console.warn('[DocStore DB] Could not query Firestore apps, falling back:', err);
    }
  }

  // Fallback to demonstration data if enabled or when local database is unseeded
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== 'false') {
    return DEMO_APPS.filter(
      (app) => app.visibility === 'public' && (app.status === 'active' || app.status === 'coming_soon')
    );
  }

  return [];
}

/**
 * Fetch a single app by its unique slug.
 */
export async function getAppBySlug(slug: string): Promise<DocApp | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const appsRef = collection(db, APPS_COLLECTION);
      const q = query(appsRef, where('slug', '==', slug), where('visibility', '==', 'public'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          slug: data.slug,
          name: data.name,
          shortDescription: data.shortDescription,
          description: data.description,
          category: data.category,
          icon: data.icon,
          status: data.status,
          visibility: data.visibility,
          applicationUrl: data.applicationUrl,
          featured: data.featured,
          version: data.version,
          tags: data.tags,
          isDemo: Boolean(data.isDemo),
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
        } as DocApp;
      }
    } catch (err) {
      console.warn(`[DocStore DB] Error getting app by slug "${slug}":`, err);
    }
  }

  // Fallback check in demo data
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== 'false') {
    const found = DEMO_APPS.find((a) => a.slug === slug && a.visibility === 'public');
    return found || null;
  }

  return null;
}

/**
 * Fetch or initialize a user profile in Firestore
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null
): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !db) {
    return {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || null,
      isAdmin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
        createdAt: unknown;
        updatedAt: unknown;
      } = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        avatarIcon: photoURL ? 'google' : null,
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProfile);
      return {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        avatarIcon: photoURL ? 'google' : null,
        isAdmin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      const data = snap.data();
      // Sync Google photoURL to Firestore if missing
      if (photoURL && !data.photoURL) {
        try {
          await updateDoc(userDocRef, { photoURL });
        } catch {
          // ignore
        }
      }
      return {
        uid,
        email: data.email || email,
        displayName: data.displayName || null,
        phoneNumber: data.phoneNumber || null,
        bio: data.bio || null,
        photoURL: data.photoURL || photoURL || null,
        avatarIcon: data.avatarIcon || (photoURL || data.photoURL ? 'google' : null),
        isAdmin: Boolean(data.isAdmin),
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
      };
    }
  } catch (err) {
    console.error('[DocStore DB] Error ensuring user profile:', err);
    return null;
  }
}

/**
 * Update user profile details (only safe permitted fields)
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    phoneNumber?: string;
    bio?: string;
    avatarIcon?: string | null;
    photoURL?: string | null;
  }
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('[DocStore DB] Failed to update profile:', err);
    return false;
  }
}

/**
 * Fetch entitlements for the authenticated user
 */
export async function getUserEntitlements(userId: string): Promise<Entitlement[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const entRef = collection(db, ENTITLEMENTS_COLLECTION);
    const q = query(entRef, where('userId', '==', userId), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        userId: d.userId,
        appId: d.appId,
        status: d.status,
        source: d.source,
        validUntil: d.validUntil?.toMillis ? d.validUntil.toMillis() : null,
        createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now(),
      } as Entitlement;
    });
  } catch (err) {
    console.warn('[DocStore DB] Error getting user entitlements:', err);
    return [];
  }
}

/**
 * Default starter apps and credit allotments for subscriptions
 */
export const DEFAULT_APP_SUBSCRIPTIONS = [
  {
    appId: 'demo-canvas',
    appName: 'Docdril Canvas',
    plan: 'starter' as SubscriptionPlan,
    creditsTotal: 100,
    creditsRemaining: 100,
    creditsUsed: 0,
    features: ['unlimited_artboards', 'vector_export', 'cloud_sync'],
  },
  {
    appId: 'demo-motion',
    appName: 'Docdril Motion',
    plan: 'starter' as SubscriptionPlan,
    creditsTotal: 50,
    creditsRemaining: 50,
    creditsUsed: 0,
    features: ['1080p_render', 'timeline_sync', 'keyframes'],
  },
  {
    appId: 'demo-flow',
    appName: 'Docdril Flow',
    plan: 'free' as SubscriptionPlan,
    creditsTotal: 25,
    creditsRemaining: 25,
    creditsUsed: 0,
    features: ['basic_automation', 'webhook_trigger'],
  },
];

/**
 * Fetch all subscriptions and credit balances for a user.
 */
export async function getUserSubscriptions(userId: string): Promise<AppSubscription[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const subsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(subsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        userId: d.userId,
        userEmail: d.userEmail || '',
        appId: d.appId,
        appName: d.appName || d.appId,
        plan: (d.plan || 'free') as SubscriptionPlan,
        status: (d.status || 'active') as SubscriptionStatus,
        creditsTotal: typeof d.creditsTotal === 'number' ? d.creditsTotal : 100,
        creditsRemaining: typeof d.creditsRemaining === 'number' ? d.creditsRemaining : 100,
        creditsUsed: typeof d.creditsUsed === 'number' ? d.creditsUsed : 0,
        creditsResetPeriod: d.creditsResetPeriod || 'monthly',
        creditsResetAt: d.creditsResetAt?.toMillis ? d.creditsResetAt.toMillis() : null,
        features: Array.isArray(d.features) ? d.features : [],
        validUntil: d.validUntil?.toMillis ? d.validUntil.toMillis() : null,
        createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now(),
        updatedAt: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : Date.now(),
      } as AppSubscription;
    });
  } catch (err) {
    console.warn('[DocStore DB] Error getting user subscriptions:', err);
    return [];
  }
}

/**
 * Fetch a specific subscription for an app.
 */
export async function getAppSubscription(
  userId: string,
  appId: string
): Promise<AppSubscription | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const subDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${userId}_${appId}`);
    const snap = await getDoc(subDocRef);
    if (!snap.exists()) return null;

    const d = snap.data();
    return {
      id: snap.id,
      userId: d.userId,
      userEmail: d.userEmail || '',
      appId: d.appId,
      appName: d.appName || d.appId,
      plan: (d.plan || 'free') as SubscriptionPlan,
      status: (d.status || 'active') as SubscriptionStatus,
      creditsTotal: typeof d.creditsTotal === 'number' ? d.creditsTotal : 100,
      creditsRemaining: typeof d.creditsRemaining === 'number' ? d.creditsRemaining : 100,
      creditsUsed: typeof d.creditsUsed === 'number' ? d.creditsUsed : 0,
      creditsResetPeriod: d.creditsResetPeriod || 'monthly',
      creditsResetAt: d.creditsResetAt?.toMillis ? d.creditsResetAt.toMillis() : null,
      features: Array.isArray(d.features) ? d.features : [],
      validUntil: d.validUntil?.toMillis ? d.validUntil.toMillis() : null,
      createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now(),
      updatedAt: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : Date.now(),
    };
  } catch (err) {
    console.error('[DocStore DB] Error fetching app subscription:', err);
    return null;
  }
}

/**
 * Normalizes email by trimming, lowercasing, and stripping Gmail dot/plus tricks
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!domain) return trimmed;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const cleanLocal = local.split('+')[0].replace(/\./g, '');
    return `${cleanLocal}@gmail.com`;
  }
  const cleanLocal = local.split('+')[0];
  return `${cleanLocal}@${domain}`;
}

/**
 * Computes a SHA-256 hash string for an identifier (GDPR-safe cryptographic fingerprint)
 */
export async function hashIdentifier(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks whether an email or Google identity has previously claimed free trial quota
 */
export async function checkIdentityTombstone(
  email: string,
  googleUid?: string | null
): Promise<{ exists: boolean; freeQuotaClaimed: boolean } | null> {
  if (!isFirebaseConfigured() || !db) return null;
  try {
    const norm = normalizeEmail(email);
    const emailHash = await hashIdentifier(norm);
    const tombRef = doc(db, TOMBSTONES_COLLECTION, emailHash);
    const snap = await getDoc(tombRef);
    if (snap.exists()) {
      const data = snap.data();
      return { exists: true, freeQuotaClaimed: Boolean(data.freeQuotaClaimed) };
    }

    if (googleUid) {
      const q = query(
        collection(db, TOMBSTONES_COLLECTION),
        where('googleUid', '==', googleUid),
        limit(1)
      );
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const d = qSnap.docs[0].data();
        return { exists: true, freeQuotaClaimed: Boolean(d.freeQuotaClaimed) };
      }
    }
  } catch (err) {
    console.warn('[DocStore DB] Tombstone check warning:', err);
  }
  return null;
}

/**
 * Completely wipes user account data and records an irreversible anti-abuse tombstone
 */
export async function deleteUserAccountData(
  userId: string,
  email: string,
  googleUid?: string | null
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    // 1. Record anti-abuse tombstone BEFORE wiping data so free tier cannot be re-exploited
    const norm = normalizeEmail(email);
    const emailHash = await hashIdentifier(norm);
    const tombRef = doc(db, TOMBSTONES_COLLECTION, emailHash);
    await setDoc(
      tombRef,
      {
        emailHash,
        googleUid: googleUid || null,
        freeQuotaClaimed: true,
        deletedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Delete user profile doc
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userDocRef);

    // 3. Delete user subscriptions
    const subsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const subsQuery = query(subsRef, where('userId', '==', userId));
    const subsSnap = await getDocs(subsQuery);
    for (const d of subsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 4. Delete user entitlements
    const entRef = collection(db, ENTITLEMENTS_COLLECTION);
    const entQuery = query(entRef, where('userId', '==', userId));
    const entSnap = await getDocs(entQuery);
    for (const d of entSnap.docs) {
      await deleteDoc(d.ref);
    }

    return true;
  } catch (err) {
    console.error('[DocStore DB] Error deleting user account data:', err);
    return false;
  }
}

/**
 * Initialize starter subscriptions and credits if none exist.
 */
export async function ensureDefaultUserSubscriptions(
  userId: string,
  userEmail: string,
  googleUid?: string | null
): Promise<AppSubscription[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const existing = await getUserSubscriptions(userId);
  if (existing.length > 0) return existing;

  // Anti-abuse check: verify if this user identity previously claimed free quota
  const tombstone = await checkIdentityTombstone(userEmail, googleUid);
  const previouslyClaimed = Boolean(tombstone?.freeQuotaClaimed);

  const initialized: AppSubscription[] = [];

  for (const starter of DEFAULT_APP_SUBSCRIPTIONS) {
    const subId = `${userId}_${starter.appId}`;
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subId);

    // If free tier was previously claimed, start with 0 credits to prevent re-creation exploitation
    const initialCredits = previouslyClaimed ? 0 : starter.creditsTotal;

    const subData = {
      userId,
      userEmail,
      appId: starter.appId,
      appName: starter.appName,
      plan: starter.plan,
      status: 'active',
      creditsTotal: initialCredits,
      creditsRemaining: initialCredits,
      creditsUsed: 0,
      creditsResetPeriod: 'monthly',
      features: starter.features,
      freeTrialPreviouslyClaimed: previouslyClaimed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(subRef, subData);
      initialized.push({
        id: subId,
        ...starter,
        creditsTotal: initialCredits,
        creditsRemaining: initialCredits,
        status: 'active',
        userId,
        userEmail,
        creditsResetPeriod: 'monthly',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn(`[DocStore DB] Failed to seed subscription for ${starter.appId}:`, err);
    }
  }

  return initialized.length > 0 ? initialized : existing;
}

/**
 * Atomically consumes credits when an app on a subdomain generates content.
 */
export async function consumeCredits(
  userId: string,
  appId: string,
  amount: number,
  action = 'generation',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; creditsRemaining: number; creditsUsed: number; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, creditsRemaining: 0, creditsUsed: 0, error: 'Database not configured' };
  }

  const subDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${userId}_${appId}`);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(subDocRef);
      if (!snap.exists()) {
        throw new Error('SUBSCRIPTION_NOT_FOUND');
      }

      const data = snap.data();
      if (data.status !== 'active' && data.status !== 'trialing') {
        throw new Error('SUBSCRIPTION_INACTIVE');
      }

      const remaining = typeof data.creditsRemaining === 'number' ? data.creditsRemaining : 0;
      const used = typeof data.creditsUsed === 'number' ? data.creditsUsed : 0;

      if (remaining < amount) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const newRemaining = remaining - amount;
      const newUsed = used + amount;

      transaction.update(subDocRef, {
        creditsRemaining: newRemaining,
        creditsUsed: newUsed,
        updatedAt: serverTimestamp(),
      });

      return { remaining: newRemaining, used: newUsed };
    });

    // Log the transaction
    try {
      const logsRef = collection(db, CREDIT_LOGS_COLLECTION);
      await addDoc(logsRef, {
        userId,
        appId,
        amount,
        remainingAfter: result.remaining,
        action,
        metadata: metadata || {},
        timestamp: serverTimestamp(),
      });
    } catch (logErr) {
      console.warn('[DocStore DB] Warning logging credit consumption:', logErr);
    }

    return {
      success: true,
      creditsRemaining: result.remaining,
      creditsUsed: result.used,
    };
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Failed to consume credits';
    return {
      success: false,
      creditsRemaining: 0,
      creditsUsed: 0,
      error: msg,
    };
  }
}

/**
 * Top up or grant credits to a subscription.
 */
export async function addCredits(
  userId: string,
  appId: string,
  amount: number
): Promise<{ success: boolean; creditsRemaining: number; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, creditsRemaining: 0, error: 'Database not configured' };
  }

  const subDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${userId}_${appId}`);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(subDocRef);
      if (!snap.exists()) {
        throw new Error('SUBSCRIPTION_NOT_FOUND');
      }

      const data = snap.data();
      const currentRemaining = typeof data.creditsRemaining === 'number' ? data.creditsRemaining : 0;
      const currentTotal = typeof data.creditsTotal === 'number' ? data.creditsTotal : 0;

      const newRemaining = currentRemaining + amount;
      const newTotal = currentTotal + amount;

      transaction.update(subDocRef, {
        creditsRemaining: newRemaining,
        creditsTotal: newTotal,
        updatedAt: serverTimestamp(),
      });

      return { remaining: newRemaining };
    });

    return { success: true, creditsRemaining: result.remaining };
  } catch (err: unknown) {
    return { success: false, creditsRemaining: 0, error: (err as Error).message };
  }
}
