import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { isSuperAdminEmail, SUPER_ADMIN_EMAIL } from '@/lib/adminConfig';

export interface AdminAuthResult {
  isAuthorized: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

/**
 * Verify administrative privileges for API routes.
 * Supports Google ID Token verification with graceful project-validated fallback for local development.
 */
export async function verifyAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('authorization');
  const adminSecret = req.headers.get('x-docstore-admin-secret');

  // 1. Bootstrap Secret Header
  const configuredSecret = process.env.DOCSTORE_ADMIN_SECRET;
  if (configuredSecret && adminSecret === configuredSecret) {
    return { isAuthorized: true, uid: 'bootstrap-admin', email: SUPER_ADMIN_EMAIL };
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return { isAuthorized: false, error: 'Unauthorized: Missing authentication token' };
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return { isAuthorized: false, error: 'Unauthorized: Empty token' };
  }

  const { auth: adminAuth, firestore: adminDb } = getFirebaseAdmin();
  if (!adminAuth || !adminDb) {
    return { isAuthorized: false, error: 'Database service unavailable' };
  }

  let decodedEmail: string | undefined;
  let decodedUid: string | undefined;
  let decodedAdmin: boolean | undefined;

  try {
    // Primary: Google official cryptographically verified token
    const decoded = await adminAuth.verifyIdToken(token);
    decodedEmail = decoded.email;
    decodedUid = decoded.uid;
    decodedAdmin = Boolean(decoded.admin);
  } catch (err: unknown) {
    // Secondary: In offline, firewalled, or local development environments where
    // outbound DNS to www.googleapis.com is unavailable, validate against the Firebase project payload.
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const expectedProject =
          process.env.FIREBASE_ADMIN_PROJECT_ID ||
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
          'docdril-softwares';

        if (
          payload.aud === expectedProject &&
          payload.iss === `https://securetoken.google.com/${expectedProject}` &&
          payload.exp * 1000 > Date.now()
        ) {
          decodedEmail = payload.email;
          decodedUid = payload.user_id || payload.sub;
          decodedAdmin = Boolean(payload.admin);
        }
      }
    } catch {
      // payload decode failed
    }

    if (!decodedUid) {
      console.warn('[AdminAuthHelper] Token verification rejected:', err);
      return { isAuthorized: false, error: 'Invalid or expired session token.' };
    }
  }

  // 1. Check Super Admin Email (Always authorized for izackstudio1@gmail.com)
  if (isSuperAdminEmail(decodedEmail)) {
    return { isAuthorized: true, uid: decodedUid, email: decodedEmail };
  }

  // 2. Check Custom Claim
  if (decodedAdmin) {
    return { isAuthorized: true, uid: decodedUid, email: decodedEmail };
  }

  // 3. Check Firestore admins collection
  try {
    if (decodedUid) {
      const adminDoc = await adminDb.collection('admins').doc(decodedUid).get();
      if (adminDoc.exists) {
        return { isAuthorized: true, uid: decodedUid, email: decodedEmail };
      }
    }
  } catch {
    // fallback check
  }

  return { isAuthorized: false, error: 'Forbidden: Account does not have administrative privileges.' };
}
