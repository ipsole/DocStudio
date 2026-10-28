import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

interface RawServiceAccount {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
}

function findServiceAccount(): admin.ServiceAccount | null {
  // 1. Check custom path in environment
  const customPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (customPath) {
    const resolvedPath = path.isAbsolute(customPath)
      ? customPath
      : path.join(process.cwd(), customPath);
    if (fs.existsSync(resolvedPath)) {
      try {
        const raw: RawServiceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        return {
          projectId: raw.project_id || raw.projectId,
          clientEmail: raw.client_email || raw.clientEmail,
          privateKey: raw.private_key || raw.privateKey,
        };
      } catch (e) {
        console.warn('[DocStore Admin] Error parsing service account at customPath:', e);
      }
    }
  }

  // 2. Check root directory for firebase-adminsdk JSON file
  try {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd);
    const serviceAccountFile = files.find(
      (f) => f.includes('firebase-adminsdk') && f.endsWith('.json')
    );
    if (serviceAccountFile) {
      const fullPath = path.join(cwd, serviceAccountFile);
      const raw: RawServiceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return {
        projectId: raw.project_id || raw.projectId,
        clientEmail: raw.client_email || raw.clientEmail,
        privateKey: raw.private_key || raw.privateKey,
      };
    }
  } catch (err) {
    console.warn('[DocStore Admin] Error finding service account file:', err);
  }

  // 3. Check direct environment variables
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    return {
      projectId:
        process.env.FIREBASE_ADMIN_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        'docdril-softwares',
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export const isFirebaseAdminConfigured = (): boolean => {
  return findServiceAccount() !== null;
};

export function getFirebaseAdmin(): {
  app: admin.app.App | undefined;
  auth: admin.auth.Auth | undefined;
  firestore: admin.firestore.Firestore | undefined;
} {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK cannot be executed on the client side.');
  }

  let adminApp: admin.app.App | undefined;

  if (admin.apps.length > 0) {
    adminApp = admin.app();
  } else {
    const serviceAccount = findServiceAccount();

    if (serviceAccount && serviceAccount.privateKey && serviceAccount.clientEmail) {
      try {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.projectId || 'docdril-softwares',
        });
      } catch (err) {
        console.error('[DocStore Admin] Failed to initialize Firebase Admin SDK with cert:', err);
      }
    } else {
      try {
        adminApp = admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'docdril-softwares',
        });
      } catch (err) {
        console.warn('[DocStore Admin] Default initialize fallback warning:', err);
      }
    }
  }

  return {
    app: adminApp,
    auth: adminApp ? admin.auth(adminApp) : undefined,
    firestore: adminApp ? admin.firestore(adminApp) : undefined,
  };
}
