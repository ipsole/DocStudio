import * as admin from 'firebase-admin';

export const isFirebaseAdminConfigured = (): boolean => {
  return Boolean(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  );
};

let adminApp: admin.app.App | undefined;

export function getFirebaseAdmin(): {
  app: admin.app.App | undefined;
  auth: admin.auth.Auth | undefined;
  firestore: admin.firestore.Firestore | undefined;
} {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK cannot be executed on the client side.');
  }

  if (!admin.apps.length) {
    if (isFirebaseAdminConfigured()) {
      try {
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
        adminApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'software-business',
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
      } catch (err) {
        console.error('[DocStore Admin] Failed to initialize Firebase Admin SDK:', err);
      }
    } else {
      // In GCP/Firebase environments, applicationDefault might be available
      try {
        adminApp = admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'software-business',
        });
      } catch {
        // Safe fallback in local development without admin credentials
      }
    }
  } else {
    adminApp = admin.app();
  }

  return {
    app: adminApp,
    auth: adminApp ? admin.auth(adminApp) : undefined,
    firestore: adminApp ? admin.firestore(adminApp) : undefined,
  };
}
