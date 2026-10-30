import fs from 'fs';
import path from 'path';
import { getFirebaseAdmin } from './firebase/admin';
import { Coupon, CouponRedemption } from '@/types';
import { DEFAULT_COUPONS } from '@/lib/seedData';

const COUPONS_COLLECTION = 'coupons';
const REDEMPTIONS_COLLECTION = 'coupon_redemptions';

const DATA_DIR = path.join(process.cwd(), '.data');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const REDEMPTIONS_FILE = path.join(DATA_DIR, 'coupon_redemptions.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore in read-only / restricted environments
  }
}

function readLocalCoupons(): Coupon[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(COUPONS_FILE)) return [];
    const raw = fs.readFileSync(COUPONS_FILE, 'utf8');
    return JSON.parse(raw) as Coupon[];
  } catch {
    return [];
  }
}

function writeLocalCoupons(coupons: Coupon[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2), 'utf8');
  } catch (err) {
    console.warn('[CouponsServer] Error writing local coupons file:', err);
  }
}

function readLocalRedemptions(): CouponRedemption[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(REDEMPTIONS_FILE)) return [];
    const raw = fs.readFileSync(REDEMPTIONS_FILE, 'utf8');
    return JSON.parse(raw) as CouponRedemption[];
  } catch {
    return [];
  }
}

function writeLocalRedemptions(redemptions: CouponRedemption[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(REDEMPTIONS_FILE, JSON.stringify(redemptions, null, 2), 'utf8');
  } catch (err) {
    console.warn('[CouponsServer] Error writing local redemptions file:', err);
  }
}

/**
 * List all coupons from Firestore, with local JSON persistence and built-in DEFAULT_COUPONS fallback
 */
export async function listCouponsAdmin(): Promise<Coupon[]> {
  const localCoupons = readLocalCoupons();
  const { firestore } = getFirebaseAdmin();

  // If Firestore is unconfigured or unavailable, use local cache or fallback to DEFAULT_COUPONS
  if (!firestore) {
    if (localCoupons.length === 0) {
      writeLocalCoupons(DEFAULT_COUPONS);
      return DEFAULT_COUPONS;
    }
    return localCoupons;
  }

  try {
    const snap = await firestore
      .collection(COUPONS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    let remoteCoupons = snap.docs.map((d) => d.data() as Coupon);

    // Check if system initialization marker exists
    let hasBeenInitialized = false;
    try {
      const metaDoc = await firestore.collection('system').doc('coupons_init').get();
      hasBeenInitialized = metaDoc.exists;
    } catch {
      // ignore
    }

    // Auto-seed DEFAULT_COUPONS if Firestore has 0 coupons and was never initialized
    if (remoteCoupons.length === 0 && !hasBeenInitialized && localCoupons.length === 0) {
      try {
        const batch = firestore.batch();
        for (const coupon of DEFAULT_COUPONS) {
          batch.set(firestore.collection(COUPONS_COLLECTION).doc(coupon.code), coupon);
        }
        batch.set(
          firestore.collection('system').doc('coupons_init'),
          {
            initializedAt: Date.now(),
            initialCount: DEFAULT_COUPONS.length,
          },
          { merge: true }
        );
        await batch.commit();
        remoteCoupons = [...DEFAULT_COUPONS];
      } catch (seedErr) {
        console.warn('[CouponsServer] Auto-seed default coupons to Firestore failed:', seedErr);
        remoteCoupons = [...DEFAULT_COUPONS];
      }
    }

    // Merge remote and local (remote takes precedence, local fills any not yet synced)
    const remoteCodes = new Set(remoteCoupons.map((c) => c.code));
    const merged = [...remoteCoupons];
    for (const loc of localCoupons) {
      if (!remoteCodes.has(loc.code)) {
        merged.push(loc);
      }
    }

    if (merged.length === 0 && !hasBeenInitialized) {
      writeLocalCoupons(DEFAULT_COUPONS);
      return DEFAULT_COUPONS;
    }

    // Keep local cache up to date
    writeLocalCoupons(merged);
    return merged;
  } catch (err) {
    console.warn('[CouponsServer] Firestore query error in listCouponsAdmin, using fallback:', err);
    if (localCoupons.length === 0) {
      return DEFAULT_COUPONS;
    }
    return localCoupons;
  }
}

/**
 * Create or update a coupon
 * If originalCode is supplied and different from code, the previous coupon code is replaced cleanly.
 */
export async function saveCouponAdmin(
  data: Partial<Coupon> & { code: string; createdBy: string; originalCode?: string }
): Promise<Coupon> {
  const cleanCode = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) throw new Error('Coupon code is required');

  const originalCodeClean = data.originalCode
    ? data.originalCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    : undefined;

  const { firestore } = getFirebaseAdmin();
  const localCoupons = readLocalCoupons();

  // If code was renamed during edit, remove the old code first
  if (originalCodeClean && originalCodeClean !== cleanCode) {
    const withoutOld = localCoupons.filter((c) => c.code !== originalCodeClean);
    writeLocalCoupons(withoutOld);
    if (firestore) {
      try {
        await firestore.collection(COUPONS_COLLECTION).doc(originalCodeClean).delete();
      } catch (err) {
        console.warn('[CouponsServer] Error deleting previous coupon code during rename:', err);
      }
    }
  }

  const lookupKey = originalCodeClean || cleanCode;
  const existingLocal = localCoupons.find((c) => c.code === lookupKey);

  let existingRemoteData: Coupon | undefined;
  if (firestore) {
    try {
      const snap = await firestore.collection(COUPONS_COLLECTION).doc(lookupKey).get();
      if (snap.exists) {
        existingRemoteData = snap.data() as Coupon;
      }
    } catch (err) {
      console.warn('[CouponsServer] Firestore lookup failed in saveCouponAdmin:', err);
    }
  }

  const existing = existingRemoteData || existingLocal;

  const coupon: Coupon = {
    id: cleanCode,
    code: cleanCode,
    description: data.description?.trim() || '',
    discountType: data.discountType === 'flat' ? 'flat' : 'percentage',
    discountValue: Math.max(0, Number(data.discountValue) || 0),
    targetType: data.targetType === 'user' ? 'user' : 'all',
    targetValue: data.targetValue ? data.targetValue.trim().replace(/^@/, '').toLowerCase() : undefined,
    singleUsePerUser: data.singleUsePerUser !== false,
    maxTotalUses: data.maxTotalUses ? Number(data.maxTotalUses) : undefined,
    currentUses: existing ? (existing.currentUses || 0) : 0,
    active: data.active !== false,
    expiresAt: data.expiresAt ? Number(data.expiresAt) : null,
    createdAt: existing ? (existing.createdAt || Date.now()) : Date.now(),
    createdBy: data.createdBy,
  };

  // 1. Persist to local JSON fallback immediately
  const updatedLocal = localCoupons.filter((c) => c.code !== cleanCode && c.code !== originalCodeClean);
  updatedLocal.unshift(coupon);
  writeLocalCoupons(updatedLocal);

  // 2. Persist to Firestore if available (stripping any undefined properties)
  if (firestore) {
    try {
      const firestorePayload: Record<string, any> = {};
      for (const [key, val] of Object.entries(coupon)) {
        if (val !== undefined) {
          firestorePayload[key] = val;
        }
      }
      await firestore.collection(COUPONS_COLLECTION).doc(cleanCode).set(firestorePayload, { merge: true });
      await firestore.collection('system').doc('coupons_init').set(
        {
          initializedAt: Date.now(),
          lastUpdated: cleanCode,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('[CouponsServer] Firestore write failed in saveCouponAdmin:', err);
      throw new Error(`Failed to save coupon to Firestore: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return coupon;
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponAdmin(code: string, active: boolean): Promise<void> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Update local
  const localCoupons = readLocalCoupons();
  const updatedLocal = localCoupons.map((c) => (c.code === cleanCode ? { ...c, active } : c));
  writeLocalCoupons(updatedLocal);

  // 2. Update Firestore
  const { firestore } = getFirebaseAdmin();
  if (firestore) {
    try {
      await firestore.collection(COUPONS_COLLECTION).doc(cleanCode).update({ active });
    } catch (err) {
      console.error('[CouponsServer] Firestore update error in toggleCouponAdmin:', err);
      throw new Error(`Failed to update coupon in Firestore: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * Delete a coupon
 */
export async function deleteCouponAdmin(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Delete local
  const localCoupons = readLocalCoupons();
  const updatedLocal = localCoupons.filter((c) => c.code !== cleanCode);
  writeLocalCoupons(updatedLocal);

  // 2. Delete Firestore
  const { firestore } = getFirebaseAdmin();
  if (firestore) {
    try {
      await firestore.collection(COUPONS_COLLECTION).doc(cleanCode).delete();
      // Ensure coupons_init marker exists so deleting coupons doesn't trigger auto-reseed
      await firestore.collection('system').doc('coupons_init').set(
        {
          initializedAt: Date.now(),
          lastDeleted: cleanCode,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('[CouponsServer] Firestore delete error in deleteCouponAdmin:', err);
      throw new Error(`Failed to delete coupon in Firestore: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: Partial<Coupon>;
  discountAmountInr?: number;
  finalAmountInr?: number;
  isFree?: boolean;
  message?: string;
}

/**
 * Validate coupon against a specific user and order amount
 */
export async function validateCouponServer({
  code,
  userId,
  userEmail,
  username,
  amountInr,
}: {
  code: string;
  userId?: string;
  userEmail?: string;
  username?: string;
  amountInr: number;
}): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, reason: 'Please enter a coupon code.' };
  }

  let coupon: Coupon | undefined;
  const { firestore } = getFirebaseAdmin();

  if (firestore) {
    try {
      const couponDoc = await firestore.collection(COUPONS_COLLECTION).doc(cleanCode).get();
      if (couponDoc.exists) {
        coupon = couponDoc.data() as Coupon;
      }
    } catch (err) {
      console.warn('[CouponsServer] Firestore read error in validateCouponServer, falling back to local:', err);
    }
  }

  // Fall back to local storage
  if (!coupon) {
    const local = readLocalCoupons();
    coupon = local.find((c) => c.code === cleanCode);
  }

  // Fall back to DEFAULT_COUPONS if unseeded
  if (!coupon) {
    coupon = DEFAULT_COUPONS.find((c) => c.code === cleanCode);
  }

  if (!coupon) {
    return { valid: false, reason: `Coupon code "${cleanCode}" is invalid.` };
  }

  // 1. Active check
  if (!coupon.active) {
    return { valid: false, reason: `Coupon code "${cleanCode}" is currently disabled.` };
  }

  // 2. Expiration check
  if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
    return { valid: false, reason: `Coupon code "${cleanCode}" has expired.` };
  }

  // 3. Max total uses check
  if (coupon.maxTotalUses && (coupon.currentUses || 0) >= coupon.maxTotalUses) {
    return { valid: false, reason: 'This coupon has reached its maximum redemptions.' };
  }

  // 4. Target user / username scope check
  if (coupon.targetType === 'user' && coupon.targetValue) {
    if (!userId && !userEmail && !username) {
      return {
        valid: false,
        reason: 'This promo code is exclusive to a specific account. Please sign in to verify eligibility.',
      };
    }

    const cleanTarget = coupon.targetValue.toLowerCase();
    const cleanUsername = username ? username.replace(/^@/, '').toLowerCase() : '';
    const cleanEmail = userEmail ? userEmail.toLowerCase() : '';
    const cleanUid = userId ? userId.toLowerCase() : '';

    const matches =
      (cleanUsername && cleanUsername === cleanTarget) ||
      (cleanEmail && cleanEmail === cleanTarget) ||
      (cleanUid && cleanUid === cleanTarget);

    if (!matches) {
      return {
        valid: false,
        reason: `Promo code "${cleanCode}" is exclusive and not valid for your account.`,
      };
    }
  }

  // 5. Single use per user check
  if (coupon.singleUsePerUser && userId) {
    const redemptionId = `${cleanCode}_${userId}`;
    let alreadyRedeemed = false;

    if (firestore) {
      try {
        const redemptionDoc = await firestore.collection(REDEMPTIONS_COLLECTION).doc(redemptionId).get();
        if (redemptionDoc.exists) {
          alreadyRedeemed = true;
        }
      } catch (err) {
        console.warn('[CouponsServer] Firestore redemption check error:', err);
      }
    }

    if (!alreadyRedeemed) {
      const localRedemptions = readLocalRedemptions();
      if (
        localRedemptions.some(
          (r) => r.id === redemptionId || (r.couponCode === cleanCode && r.userId === userId)
        )
      ) {
        alreadyRedeemed = true;
      }
    }

    if (alreadyRedeemed) {
      return {
        valid: false,
        reason: `Your account has already redeemed coupon "${cleanCode}". Single-use limit reached.`,
      };
    }
  }

  // 6. Calculate discount
  let discountAmountInr = 0;
  if (coupon.discountType === 'percentage') {
    discountAmountInr = Math.round(((amountInr * coupon.discountValue) / 100) * 100) / 100;
  } else {
    discountAmountInr = Math.min(amountInr, coupon.discountValue);
  }

  discountAmountInr = Math.min(amountInr, Math.max(0, discountAmountInr));
  const finalAmountInr = Math.max(0, Math.round((amountInr - discountAmountInr) * 100) / 100);

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      targetType: coupon.targetType,
      description: coupon.description,
    },
    discountAmountInr,
    finalAmountInr,
    isFree: finalAmountInr === 0,
    message:
      coupon.discountType === 'percentage'
        ? `${coupon.discountValue}% discount applied (-₹${discountAmountInr.toFixed(2)})`
        : `Flat ₹${discountAmountInr.toFixed(2)} discount applied`,
  };
}

/**
 * Record coupon redemption upon successful payment or 100% discount checkout
 */
export async function recordCouponRedemptionAdmin({
  code,
  userId,
  userEmail,
  username,
  orderId,
  discountAmountInr,
}: {
  code: string;
  userId: string;
  userEmail: string;
  username?: string;
  orderId?: string;
  discountAmountInr: number;
}): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const redemptionId = `${cleanCode}_${userId}`;

  const redemption: CouponRedemption = {
    id: redemptionId,
    couponId: cleanCode,
    couponCode: cleanCode,
    userId,
    userEmail,
    username,
    orderId,
    discountAmountInr,
    redeemedAt: Date.now(),
  };

  // 1. Record in local redemptions
  const localRedemptions = readLocalRedemptions();
  localRedemptions.push(redemption);
  writeLocalRedemptions(localRedemptions);

  // 2. Increment local coupon uses
  const localCoupons = readLocalCoupons();
  const updatedCoupons = localCoupons.map((c) =>
    c.code === cleanCode ? { ...c, currentUses: (c.currentUses || 0) + 1 } : c
  );
  writeLocalCoupons(updatedCoupons);

  // 3. Record in Firestore if available
  const { firestore } = getFirebaseAdmin();
  if (firestore) {
    try {
      await firestore.collection(REDEMPTIONS_COLLECTION).doc(redemptionId).set(redemption);

      const couponRef = firestore.collection(COUPONS_COLLECTION).doc(cleanCode);
      const couponSnap = await couponRef.get();
      if (couponSnap.exists) {
        const current = couponSnap.data()?.currentUses || 0;
        await couponRef.update({ currentUses: current + 1 });
      }
    } catch (err) {
      console.warn('[CouponsServer] Error recording redemption in Firestore:', err);
    }
  }
}
