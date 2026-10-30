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
  orderBy,
  onSnapshot,
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
  OrderRecord,
  DeviceSession,
  QRLoginSession,
} from '@/types';
import { DEMO_APPS } from '../seedData';

const APPS_COLLECTION = 'apps';
const USERS_COLLECTION = 'users';
const USERNAMES_COLLECTION = 'usernames';
const ENTITLEMENTS_COLLECTION = 'entitlements';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const CREDIT_LOGS_COLLECTION = 'credit_logs';
const TOMBSTONES_COLLECTION = 'account_tombstones';
const ORDERS_COLLECTION = 'orders';
const QR_LOGINS_COLLECTION = 'qr_logins';

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

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'docdril',
  'docstudio',
  'support',
  'help',
  'api',
  'auth',
  'system',
  'root',
  'account',
  'billing',
  'security',
  'official',
  'team',
]);

/**
 * Check if a username is available.
 * Usernames must be 3-20 lowercase alphanumeric characters or underscores.
 */
export async function isUsernameAvailable(
  username: string,
  currentUid?: string
): Promise<{ available: boolean; reason?: string }> {
  const clean = username.trim().toLowerCase();
  if (!clean || clean.length < 3 || clean.length > 20) {
    return { available: false, reason: 'Username must be between 3 and 20 characters.' };
  }
  if (!/^[a-z0-9_]+$/.test(clean)) {
    return { available: false, reason: 'Username can only contain lowercase letters, numbers, and underscores.' };
  }
  if (RESERVED_USERNAMES.has(clean)) {
    return { available: false, reason: 'This handle is reserved by the platform.' };
  }

  if (!isFirebaseConfigured() || !db) {
    return { available: true };
  }

  try {
    const usernameDocRef = doc(db, USERNAMES_COLLECTION, clean);
    const snap = await getDoc(usernameDocRef);
    if (!snap.exists()) {
      return { available: true };
    }
    const data = snap.data();
    if (data.uid === currentUid) {
      return { available: true };
    }
    return { available: false, reason: 'This username is already taken by another creator.' };
  } catch (err) {
    console.error('[DocStore DB] Error checking username availability:', err);
    return { available: true };
  }
}

/**
 * Fetch or initialize a user profile in Firestore
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null,
  phoneNumber?: string | null
): Promise<UserProfile | null> {
  const baseName = email ? email.split('@')[0] : (phoneNumber ? `creator_${phoneNumber.replace(/[^0-9]/g, '').slice(-4)}` : `creator_${uid.slice(0, 5)}`);
  const fallbackUsername = (baseName || 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

  // Check localStorage cache first for fallback
  let localCache: Partial<UserProfile> | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`docstudio_profile_${uid}`);
      if (stored) localCache = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  if (!isFirebaseConfigured() || !db) {
    return {
      uid,
      email,
      displayName: localCache?.displayName || displayName || email.split('@')[0],
      username: localCache?.username || fallbackUsername,
      usernameLower: (localCache?.username || fallbackUsername).toLowerCase(),
      phoneNumber: localCache?.phoneNumber || null,
      bio: localCache?.bio || null,
      photoURL: photoURL || null,
      avatarIcon: localCache?.avatarIcon || (photoURL ? 'google' : null),
      isAdmin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      const newProfile = {
        uid,
        email,
        displayName: localCache?.displayName || displayName || email.split('@')[0],
        username: localCache?.username || fallbackUsername,
        usernameLower: (localCache?.username || fallbackUsername).toLowerCase(),
        phoneNumber: localCache?.phoneNumber || phoneNumber || null,
        bio: localCache?.bio || null,
        photoURL: photoURL || null,
        avatarIcon: localCache?.avatarIcon || (photoURL ? 'google' : null),
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      try {
        await setDoc(userDocRef, newProfile);
      } catch (writeErr) {
        console.warn('[DocStore DB] Could not write user profile to Firestore (check rules):', writeErr);
      }

      // Register username index if available
      try {
        const usernameDocRef = doc(db, USERNAMES_COLLECTION, fallbackUsername);
        const uSnap = await getDoc(usernameDocRef);
        if (!uSnap.exists()) {
          await setDoc(usernameDocRef, { uid, username: fallbackUsername, createdAt: serverTimestamp() });
        }
      } catch (uErr) {
        console.warn('[DocStore DB] Could not claim username index:', uErr);
      }

      const returnedProfile: UserProfile = {
        uid,
        email,
        displayName: newProfile.displayName,
        username: newProfile.username,
        usernameLower: newProfile.usernameLower,
        phoneNumber: newProfile.phoneNumber,
        bio: newProfile.bio,
        photoURL: photoURL || null,
        avatarIcon: newProfile.avatarIcon,
        isAdmin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`docstudio_profile_${uid}`, JSON.stringify(returnedProfile));
        } catch {
          // ignore
        }
      }

      return returnedProfile;
    } else {
      const data = snap.data();
      const currentUsername = data.username || localCache?.username || fallbackUsername;

      const profileResult: UserProfile = {
        uid,
        email: data.email || email,
        displayName: data.displayName || localCache?.displayName || null,
        username: currentUsername,
        usernameLower: currentUsername.toLowerCase(),
        phoneNumber: data.phoneNumber || localCache?.phoneNumber || phoneNumber || null,
        bio: data.bio || localCache?.bio || null,
        photoURL: data.photoURL || photoURL || null,
        avatarIcon: data.avatarIcon || localCache?.avatarIcon || (photoURL || data.photoURL ? 'google' : null),
        isAdmin: Boolean(data.isAdmin),
        isDeactivated: Boolean(data.isDeactivated),
        deactivatedAt: data.deactivatedAt?.toMillis ? data.deactivatedAt.toMillis() : (data.deactivatedAt || null),
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`docstudio_profile_${uid}`, JSON.stringify(profileResult));
        } catch {
          // ignore
        }
      }

      return profileResult;
    }
  } catch (err) {
    console.warn('[DocStore DB] Error accessing Firestore user profile (using local cache):', err);
    return {
      uid,
      email,
      displayName: localCache?.displayName || displayName || email.split('@')[0],
      username: localCache?.username || fallbackUsername,
      usernameLower: (localCache?.username || fallbackUsername).toLowerCase(),
      phoneNumber: localCache?.phoneNumber || null,
      bio: localCache?.bio || null,
      photoURL: photoURL || null,
      avatarIcon: localCache?.avatarIcon || (photoURL ? 'google' : null),
      isAdmin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

/**
 * Update user profile details (only safe permitted fields)
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    username?: string;
    phoneNumber?: string;
    bio?: string;
    avatarIcon?: string | null;
    photoURL?: string | null;
  }
): Promise<boolean> {
  // Always update local cache immediately so edits are preserved
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(`docstudio_profile_${uid}`);
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        `docstudio_profile_${uid}`,
        JSON.stringify({ ...parsed, ...updates })
      );
    } catch {
      // ignore
    }
  }

  if (!isFirebaseConfigured() || !db) return true;

  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);

    // If username is being updated, handle username index
    if (updates.username) {
      const clean = updates.username.trim().toLowerCase();

      try {
        const userSnap = await getDoc(userDocRef);
        const oldUsername = userSnap.data()?.username?.toLowerCase();

        if (oldUsername !== clean) {
          const uCheck = await isUsernameAvailable(clean, uid);
          if (!uCheck.available) {
            throw new Error(uCheck.reason || 'Username is not available');
          }

          // Try updating username index doc
          try {
            const newUDocRef = doc(db, USERNAMES_COLLECTION, clean);
            await setDoc(newUDocRef, {
              uid,
              username: clean,
              updatedAt: serverTimestamp(),
            });

            if (oldUsername) {
              await deleteDoc(doc(db, USERNAMES_COLLECTION, oldUsername));
            }
          } catch (uErr) {
            console.warn('[DocStore DB] Could not write to usernames index (check security rules):', uErr);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already taken')) {
          throw err;
        }
      }

      await setDoc(
        userDocRef,
        {
          ...updates,
          username: clean,
          usernameLower: clean,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    }

    await setDoc(
      userDocRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('[DocStore DB] Failed to update profile in Firestore:', err);
    throw err;
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
 * Temporarily deactivates user account (pauses access and hides profile).
 */
export async function deactivateUserAccount(userId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, {
      isDeactivated: true,
      deactivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('[DocStore DB] Error deactivating user account:', err);
    return false;
  }
}

/**
 * Reactivates a previously deactivated user account.
 */
export async function reactivateUserAccount(userId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, {
      isDeactivated: false,
      deactivatedAt: null,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('[DocStore DB] Error reactivating user account:', err);
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

  if (initialized.length > 0) return initialized;
  if (existing.length > 0) return existing;

  // Fallback if Firestore writes are rejected by security rules
  return DEFAULT_APP_SUBSCRIPTIONS.map((starter) => ({
    id: `${userId}_${starter.appId}`,
    ...starter,
    creditsRemaining: starter.creditsTotal,
    status: 'active' as const,
    userId,
    userEmail,
    creditsResetPeriod: 'monthly',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
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

/**
 * Save an order record (transaction receipt) to Firestore and local cache.
 */
export async function saveOrderRecord(order: OrderRecord): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const key = `docstudio_orders_${order.userId}`;
      const existing = localStorage.getItem(key);
      const list: OrderRecord[] = existing ? JSON.parse(existing) : [];
      const updated = [order, ...list.filter((o) => o.id !== order.id && o.razorpayOrderId !== order.razorpayOrderId)];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  if (isFirebaseConfigured() && db) {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, order.id);
      await setDoc(orderRef, {
        ...order,
        createdAt: order.createdAt || Date.now(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[DocStore DB] Could not write order record to Firestore:', err);
    }
  }
}

export interface PaginatedOrdersResult {
  orders: OrderRecord[];
  total: number;
  totalPages: number;
  page: number;
}

/**
 * Fetch a single page of orders/invoices on demand (default limit: 5).
 * Keeps other pages unfetched to minimize Firestore reads & network bandwidth.
 */
export async function getUserOrdersPaginated(
  userId: string,
  userEmail?: string,
  page: number = 1,
  limit: number = 5
): Promise<PaginatedOrdersResult> {
  if (typeof window !== 'undefined') {
    try {
      const emailParam = userEmail ? `&email=${encodeURIComponent(userEmail)}` : '';
      const res = await fetch(
        `/api/billing/orders?userId=${encodeURIComponent(userId)}${emailParam}&page=${page}&limit=${limit}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          return {
            orders: data.orders,
            total: typeof data.total === 'number' ? data.total : data.orders.length,
            totalPages:
              typeof data.totalPages === 'number'
                ? data.totalPages
                : Math.max(1, Math.ceil((data.total || data.orders.length) / limit)),
            page: typeof data.page === 'number' ? data.page : page,
          };
        }
      }
    } catch (apiErr) {
      console.warn('[DocStore DB] Paginated orders fetch error:', apiErr);
    }
  }

  return { orders: [], total: 0, totalPages: 1, page: 1 };
}

/**
 * Fetch all orders/invoices for a given user.
 */
export async function getUserOrders(userId: string, userEmail?: string): Promise<OrderRecord[]> {
  let cachedOrders: OrderRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      const keyId = `docstudio_orders_${userId}`;
      const existingId = localStorage.getItem(keyId);
      if (existingId) {
        cachedOrders = JSON.parse(existingId);
      } else if (userEmail) {
        const keyEmail = `docstudio_orders_${userEmail}`;
        const existingEmail = localStorage.getItem(keyEmail);
        if (existingEmail) cachedOrders = JSON.parse(existingEmail);
      }
    } catch {
      // ignore
    }
  }

  // 1. Fetch via privileged server API endpoint (bypasses client security rules & missing indexes)
  if (typeof window !== 'undefined') {
    try {
      const emailParam = userEmail ? `&email=${encodeURIComponent(userEmail)}` : '';
      const res = await fetch(`/api/billing/orders?userId=${encodeURIComponent(userId)}${emailParam}&all=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          if (data.orders.length > 0) {
            localStorage.setItem(`docstudio_orders_${userId}`, JSON.stringify(data.orders));
            if (userEmail) {
              localStorage.setItem(`docstudio_orders_${userEmail}`, JSON.stringify(data.orders));
            }
            return data.orders;
          }
        }
      }
    } catch (apiErr) {
      console.warn('[DocStore DB] Server API orders fetch warning, falling back to direct db:', apiErr);
    }
  }

  if (isFirebaseConfigured() && db) {
    try {
      const orderDocsMap = new Map<string, OrderRecord>();

      const qUser = query(
        collection(db, ORDERS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapUser = await getDocs(qUser);
      snapUser.docs.forEach((d) => {
        const data = d.data();
        orderDocsMap.set(d.id, {
          id: d.id,
          razorpayOrderId: data.razorpayOrderId || d.id,
          razorpayPaymentId: data.razorpayPaymentId || '',
          userId: data.userId || userId,
          userEmail: data.userEmail || userEmail || '',
          amount: data.amount || 0,
          amountPaise: data.amountPaise || 0,
          currency: 'INR',
          status: data.status || 'paid',
          itemType: data.itemType || 'subscription',
          itemId: data.itemId || '',
          itemName: data.itemName || 'Docdril Software Service',
          creditsAdded: data.creditsAdded || 0,
          quantity: data.quantity || 1,
          paymentMethod: data.paymentMethod,
          receiptNumber: data.receiptNumber || `INV-${d.id.slice(-6).toUpperCase()}`,
          gstin: data.gstin || undefined,
          businessName: data.businessName || undefined,
          createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
          paidAt: typeof data.paidAt?.toMillis === 'function' ? data.paidAt.toMillis() : (data.paidAt || data.createdAt || Date.now()),
        });
      });

      if (userEmail) {
        try {
          const qEmail = query(
            collection(db, ORDERS_COLLECTION),
            where('userEmail', '==', userEmail)
          );
          const snapEmail = await getDocs(qEmail);
          snapEmail.docs.forEach((d) => {
            if (!orderDocsMap.has(d.id)) {
              const data = d.data();
              orderDocsMap.set(d.id, {
                id: d.id,
                razorpayOrderId: data.razorpayOrderId || d.id,
                razorpayPaymentId: data.razorpayPaymentId || '',
                userId: data.userId || userId,
                userEmail: data.userEmail || userEmail,
                amount: data.amount || 0,
                amountPaise: data.amountPaise || 0,
                currency: 'INR',
                status: data.status || 'paid',
                itemType: data.itemType || 'subscription',
                itemId: data.itemId || '',
                itemName: data.itemName || 'Docdril Software Service',
                creditsAdded: data.creditsAdded || 0,
                quantity: data.quantity || 1,
                paymentMethod: data.paymentMethod,
                receiptNumber: data.receiptNumber || `INV-${d.id.slice(-6).toUpperCase()}`,
                gstin: data.gstin || undefined,
                businessName: data.businessName || undefined,
                createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
                paidAt: typeof data.paidAt?.toMillis === 'function' ? data.paidAt.toMillis() : (data.paidAt || data.createdAt || Date.now()),
              });
            }
          });
        } catch {
          // ignore
        }
      }

      const remoteOrders = Array.from(orderDocsMap.values());
      if (remoteOrders.length > 0) {
        remoteOrders.sort((a, b) => b.createdAt - a.createdAt);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`docstudio_orders_${userId}`, JSON.stringify(remoteOrders));
          } catch {
            // ignore
          }
        }
        return remoteOrders;
      }
    } catch (err) {
      console.warn('[DocStore DB] Could not fetch remote orders:', err);
    }
  }

  return cachedOrders;
}

/**
 * Upgrade user subscriptions to a new plan across all active apps.
 */
export async function upgradeUserPlan(
  userId: string,
  userEmail: string,
  plan: SubscriptionPlan
): Promise<void> {
  const currentSubs = await ensureDefaultUserSubscriptions(userId, userEmail);
  const now = Date.now();
  const nextMonth = now + 30 * 24 * 60 * 60 * 1000;
  const planCredits = plan === 'pro' ? 500 : plan === 'enterprise' ? 2500 : 50;

  const updatedSubs = currentSubs.map((sub) => ({
    ...sub,
    plan,
    status: 'active' as SubscriptionStatus,
    creditsTotal: (sub.creditsTotal || 0) + planCredits,
    creditsRemaining: (sub.creditsRemaining || 0) + planCredits,
    currentPeriodEnd: nextMonth,
    updatedAt: now,
  }));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`docstudio_subscriptions_${userId}`, JSON.stringify(updatedSubs));
    } catch {
      // ignore
    }
  }

  if (isFirebaseConfigured() && db) {
    try {
      for (const sub of updatedSubs) {
        const subDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${userId}_${sub.appId}`);
        await setDoc(subDocRef, {
          ...sub,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('[DocStore DB] Could not write updated subscriptions to Firestore:', err);
    }
  }
}

/**
 * Add credits across user subscriptions (to primary suite).
 */
export async function addSharedCredits(
  userId: string,
  userEmail: string,
  amount: number
): Promise<void> {
  const currentSubs = await ensureDefaultUserSubscriptions(userId, userEmail);
  if (!currentSubs || currentSubs.length === 0) return;

  const primary = currentSubs[0];
  const updatedSubs = currentSubs.map((sub, index) => {
    if (index === 0) {
      return {
        ...sub,
        creditsRemaining: (sub.creditsRemaining || 0) + amount,
        creditsTotal: (sub.creditsTotal || 0) + amount,
        updatedAt: Date.now(),
      };
    }
    return sub;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`docstudio_subscriptions_${userId}`, JSON.stringify(updatedSubs));
    } catch {
      // ignore
    }
  }

  if (isFirebaseConfigured() && db) {
    try {
      const subDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, `${userId}_${primary.appId}`);
      await setDoc(subDocRef, {
        creditsRemaining: (primary.creditsRemaining || 0) + amount,
        creditsTotal: (primary.creditsTotal || 0) + amount,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[DocStore DB] Could not update shared credits in Firestore:', err);
    }
  }
}

/**
 * -------------------------------------------------------------
 * Active Device Session Management & Remote Revocation
 * -------------------------------------------------------------
 */

export async function syncDeviceSession(
  userId: string,
  session: Partial<DeviceSession> & { id: string }
): Promise<void> {
  if (!userId || !session.id) return;

  const sessionData: DeviceSession = {
    id: session.id,
    userId,
    deviceName: session.deviceName || 'Desktop Session',
    deviceType: session.deviceType || 'desktop',
    browser: session.browser || 'Browser',
    os: session.os || 'OS',
    location: session.location || 'Online Session',
    ip: session.ip || '',
    createdAt: session.createdAt || new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'active',
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`docstudio_active_session_${userId}`, JSON.stringify(sessionData));
    } catch {}
  }

  if (isFirebaseConfigured() && db) {
    try {
      const sessionRef = doc(db, USERS_COLLECTION, userId, 'sessions', session.id);
      await setDoc(sessionRef, {
        ...sessionData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[DocStore DB] Could not sync device session in Firestore:', err);
    }
  }
}

export async function getUserDeviceSessions(userId: string): Promise<DeviceSession[]> {
  if (!userId) return [];

  if (isFirebaseConfigured() && db) {
    try {
      const sessionsRef = collection(db, USERS_COLLECTION, userId, 'sessions');
      const q = query(sessionsRef, where('status', '==', 'active'), limit(20));
      const snap = await getDocs(q);
      const list: DeviceSession[] = snap.docs.map((d) => d.data() as DeviceSession);
      return list.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
    } catch (err) {
      console.warn('[DocStore DB] Error getting device sessions:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`docstudio_active_session_${userId}`);
      if (local) return [JSON.parse(local)];
    } catch {}
  }

  return [];
}

export function subscribeToDeviceSessions(
  userId: string,
  callback: (sessions: DeviceSession[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db || !userId) {
    callback([]);
    return () => {};
  }

  try {
    const sessionsRef = collection(db, USERS_COLLECTION, userId, 'sessions');
    const q = query(sessionsRef, where('status', '==', 'active'), limit(20));
    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: DeviceSession[] = snapshot.docs.map((d) => d.data() as DeviceSession);
        sessions.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
        callback(sessions);
      },
      (err) => {
        console.warn('[DocStore DB] Error listening to device sessions:', err);
      }
    );
  } catch (err) {
    console.warn('[DocStore DB] Failed to subscribe to device sessions:', err);
    return () => {};
  }
}

export function subscribeToCurrentSessionStatus(
  userId: string,
  sessionId: string,
  onRevoked: () => void
): () => void {
  if (!isFirebaseConfigured() || !db || !userId || !sessionId) {
    return () => {};
  }

  try {
    const sessionRef = doc(db, USERS_COLLECTION, userId, 'sessions', sessionId);
    return onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.status === 'revoked') {
          onRevoked();
        }
      }
    });
  } catch (err) {
    console.warn('[DocStore DB] Failed to subscribe to current session status:', err);
    return () => {};
  }
}

export async function revokeDeviceSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;

  if (isFirebaseConfigured() && db) {
    try {
      const sessionRef = doc(db, USERS_COLLECTION, userId, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'revoked',
        revokedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[DocStore DB] Error revoking device session:', err);
    }
  }
}

export async function revokeAllOtherDeviceSessions(userId: string, currentSessionId: string): Promise<void> {
  if (!userId) return;

  if (isFirebaseConfigured() && db) {
    try {
      const sessionsRef = collection(db, USERS_COLLECTION, userId, 'sessions');
      const q = query(sessionsRef, where('status', '==', 'active'));
      const snap = await getDocs(q);
      const updates = snap.docs
        .filter((d) => d.id !== currentSessionId)
        .map((d) =>
          updateDoc(d.ref, {
            status: 'revoked',
            revokedAt: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          })
        );
      await Promise.all(updates);
    } catch (err) {
      console.warn('[DocStore DB] Error revoking other device sessions:', err);
    }
  }
}

/**
 * -------------------------------------------------------------
 * Cross-Device Instant QR Code Login Handshake
 * -------------------------------------------------------------
 */

export async function createQRLoginSession(
  userId: string,
  username: string,
  userEmail: string
): Promise<string> {
  const tokenId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : 'qr_' + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);

  const newSession: QRLoginSession = {
    tokenId,
    userId,
    username: username.replace('@', ''),
    userEmail,
    createdAt: Date.now(),
    expiresAt: Date.now() + 180000, // 3 minutes validity
    status: 'pending',
  };

  if (isFirebaseConfigured() && db) {
    const qrDocRef = doc(db, QR_LOGINS_COLLECTION, tokenId);
    await setDoc(qrDocRef, {
      ...newSession,
      serverCreatedAt: serverTimestamp(),
    });
  }

  return tokenId;
}

export function subscribeToQRLogin(
  tokenId: string,
  callback: (session: QRLoginSession | null) => void
): () => void {
  if (!isFirebaseConfigured() || !db || !tokenId) {
    callback(null);
    return () => {};
  }

  try {
    const qrDocRef = doc(db, QR_LOGINS_COLLECTION, tokenId);
    return onSnapshot(qrDocRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as QRLoginSession);
      } else {
        callback(null);
      }
    });
  } catch (err) {
    console.warn('[DocStore DB] Error subscribing to QR login session:', err);
    return () => {};
  }
}

export async function cancelQRLogin(tokenId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db || !tokenId) return;

  try {
    const qrDocRef = doc(db, QR_LOGINS_COLLECTION, tokenId);
    await updateDoc(qrDocRef, {
      status: 'revoked',
      revokedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[DocStore DB] Error canceling QR login session:', err);
  }
}
