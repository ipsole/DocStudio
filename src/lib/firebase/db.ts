import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';
import { DocApp, UserProfile, Entitlement } from '@/types';
import { DEMO_APPS } from '../seedData';

const APPS_COLLECTION = 'apps';
const USERS_COLLECTION = 'users';
const ENTITLEMENTS_COLLECTION = 'entitlements';

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
        isAdmin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      const data = snap.data();
      return {
        uid,
        email: data.email || email,
        displayName: data.displayName || null,
        phoneNumber: data.phoneNumber || null,
        bio: data.bio || null,
        photoURL: data.photoURL || null,
        avatarIcon: data.avatarIcon || null,
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
    avatarIcon?: string;
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
