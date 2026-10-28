# DocStore: The Central Software Platform of Docdril

DocStore is the foundational central platform for the **Docdril** software ecosystem. It provides a data-driven catalog for discovering, accessing, and managing Docdril software products with a unified account system powered by Google Firebase.

---

## 1. Core Principle

```
ONE ECOSYSTEM.
ONE CENTRAL ACCOUNT.
ONE SHARED PLATFORM.
MULTIPLE INDEPENDENT SOFTWARE PRODUCTS.
```

Products in the Docdril ecosystem are independently deployable while integrating with common identity, data discovery, and authorization infrastructure.

---

## 2. Architecture & Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI & Styling**: React 18, TypeScript, Tailwind CSS, Lucide React icons
- **Identity & Authentication**: Firebase Authentication (Email/Password, Google Auth ready, password reset, session persistence)
- **Database**: Cloud Firestore (Google Firebase project: `software-business`)
- **Server Boundaries**: Next.js Route Handlers (`/api/admin/*`) running Firebase Admin SDK for privileged verification and catalog administration
- **Security**: Granular Firestore Security Rules (`firestore.rules`) enforcing least privilege and strict ownership isolation

---

## 3. Implemented Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | DocStore homepage introducing the ecosystem, featured apps, search, and category filters |
| `/apps` | Public | Data-driven software catalog with search and category filtering |
| `/apps/[slug]` | Public | Individual product detail page with features, launch endpoint, and upcoming release notice |
| `/dashboard` | Authenticated | User dashboard displaying account info, "My Applications", active tools, and honest entitlement indicators |
| `/account` | Authenticated | Account settings, display name management, password reset triggers, and sign out |
| `/sign-in` | Public (Guest) | Central sign-in page with validation and redirect support |
| `/sign-up` | Public (Guest) | Account registration initializing user profile in Firestore |
| `/forgot-password` | Public (Guest) | Secure password reset dispatch |
| `/admin` | Admin Only | Product catalog administration to create/update products, set statuses, and configure launch URLs |
| `/api/admin/apps` | Admin Only (Bearer Token) | Server endpoint for registering and updating catalog entries |
| `/api/admin/seed` | Admin Only (Bearer Token) | Server endpoint for seeding demonstration catalog entries into Firestore |

---

## 4. Firestore Data Model

### Collections in Release 1.0

#### `users/{uid}` (Private User Profile)
```typescript
interface UserProfile {
  uid: string;                 // Matches Firebase Auth UID
  email: string;               // Primary account email
  displayName: string | null;  // User display name
  photoURL?: string | null;    // Profile avatar URL
  isAdmin?: boolean;           // Administrative flag (protected against client escalation)
  createdAt: Timestamp;        // Server creation timestamp
  updatedAt: Timestamp;        // Server modification timestamp
}
```

#### `apps/{appId}` (Product Catalog)
```typescript
interface DocApp {
  id: string;                  // Firestore document ID
  slug: string;                // Unique URL-friendly slug (e.g. 'docdril-canvas')
  name: string;                // Product name
  shortDescription: string;    // Brief summary shown on catalog cards
  description: string;         // Comprehensive product description
  category: string;            // 'creative' | 'animation' | 'productivity' | 'utilities'
  icon?: string;               // Visual icon identifier
  status: 'draft' | 'coming_soon' | 'active' | 'archived';
  visibility: 'public' | 'private';
  applicationUrl?: string | null; // Validated launch endpoint
  version?: string;            // Semantic version (e.g. '1.0.0')
  tags?: string[];             // Capability keywords
  isDemo?: boolean;            // Clearly marks demonstration records
  createdAt: number;
  updatedAt: number;
}
```

#### `entitlements/{entitlementId}` (Access Rights - Phase 2 Foundation)
```typescript
interface Entitlement {
  id: string;
  userId: string;              // Target user UID
  appId: string;               // Associated application ID
  status: 'active' | 'revoked' | 'expired';
  source: 'free' | 'purchase' | 'subscription' | 'admin';
  validUntil?: number | null;
  createdAt: number;
}
```

#### Reserved Billing Schema (Roadmap for Phase 2 Razorpay Integration)
- `orders/{orderId}`: Reserved for verified transaction records
- `subscriptions/{subscriptionId}`: Reserved for recurring plan states

---

## 5. Security Rules (`firestore.rules`)

The security rules enforce:
1. **Public Catalog Access**: Public queries can only read products where `visibility == 'public'` and `status in ['active', 'coming_soon']`.
2. **User Profile Isolation**: Users can only read and update their own document (`request.auth.uid == userId`). Client updates are restricted to safe fields and cannot grant admin privileges.
3. **Entitlements Protection**: Client-side writing to `entitlements`, `orders`, and `subscriptions` is **strictly forbidden (`allow write: if false;`)**. Only trusted server-side operations via the Firebase Admin SDK can create or modify access records.
4. **Administrative Operations**: Catalog modifications are restricted to users with the `admin: true` token claim or a verified record in the `admins` collection.

### Deploying Security Rules to Firebase
```bash
firebase deploy --only firestore:rules --project software-business
```

---

## 6. Environment Variable Setup

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the variables with your credentials from the **software-business** Firebase project:

```env
# Client-Side Configuration (Firebase Console -> Project Settings -> General -> Your apps -> Web app)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=software-business.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=software-business
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=software-business.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...

# Set to false once real catalog items are published in Firestore
NEXT_PUBLIC_ENABLE_DEMO_DATA=true

# Server-Side Admin SDK (Firebase Console -> Project Settings -> Service accounts)
FIREBASE_ADMIN_PROJECT_ID=software-business
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@software-business.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional bootstrap secret for administrative endpoints
DOCSTORE_ADMIN_SECRET=your_super_secret_admin_key
```

---

## 7. Local Development & Build

### Install dependencies
```bash
npm install
```

### Run local development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm run start
```

---

## 8. Integration Architecture for Future Docdril Apps

Future independent software products (whether hosted on a subdomain like `canvas.docdril.com` or separately deployed) can integrate with DocStore using one of two patterns:

1. **Shared Firebase Authentication**:
   - The satellite application initializes the same Firebase Auth domain (`software-business.firebaseapp.com`).
   - The user's ID token is sent in the `Authorization: Bearer <token>` header to the satellite app's backend.
   - The satellite app verifies the ID token using `firebase-admin` and inspects the user's entitlements in Firestore (`entitlements` collection where `userId == uid` and `appId == targetAppId`).

2. **OAuth / SSO Redirection**:
   - The satellite app redirects unauthenticated users to `https://docstore.docdril.com/sign-in?redirect=https://canvas.docdril.com/callback`.
   - Upon successful sign-in, DocStore passes a short-lived session authorization ticket or redirects the authenticated user back to the satellite app.

---

## 9. Prepared Payment Roadmap (Razorpay)

When Docdril introduces paid products, the payment lifecycle will follow this secure flow:

1. **Order Initiation**: Client requests order creation from `/api/billing/create-order` with the selected `appId`.
2. **Server-Side Pricing**: The server looks up the official price from trusted Firestore data (not the client) and calls Razorpay Orders API.
3. **Checkout**: Razorpay Standard Checkout opens on the client.
4. **Webhook Verification**: Razorpay posts `payment.captured` to `/api/webhooks/razorpay`.
5. **Signature Validation**: The webhook handler computes the HMAC SHA256 signature using the Razorpay Webhook Secret.
6. **Entitlement Grant**: Upon verified signature, the backend atomically creates an `orders` record and writes an active record to `entitlements/{entitlementId}`.
7. **Instant Access**: The user's dashboard refreshes and displays the application under "My Applications" with an active Launch button.

---

## 10. Status & Scope of Release 1.0

- **Implemented**: Full data-driven catalog, multi-category filtering, search, slug-based product details, Firebase authentication, user dashboard with honest entitlement indicators, account settings with password reset, admin catalog management, Firestore security rules, responsive light-theme UI.
- **Intentionally Deferred**: Live Razorpay payment transactions, automatic credit-card billing, imaginary future product roadmaps, and fabricated user activity counts.
