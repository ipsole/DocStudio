export type AppStatus = 'draft' | 'coming_soon' | 'active' | 'archived';

export type AppVisibility = 'public' | 'private';

export interface DocApp {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  icon?: string;
  status: AppStatus;
  visibility: AppVisibility;
  applicationUrl?: string | null;
  subdomain?: string | null;
  featured?: boolean;
  version?: string;
  tags?: string[];
  thumbnailUrl?: string;
  badge?: string;
  isDemo?: boolean;
  defaultCredits?: number;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  username?: string | null;
  usernameLower?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  photoURL?: string | null;
  avatarIcon?: string | null;
  isAdmin?: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export type EntitlementStatus = 'active' | 'revoked' | 'expired';
export type EntitlementSource = 'free' | 'purchase' | 'subscription' | 'admin';

export interface Entitlement {
  id: string;
  userId: string;
  appId: string;
  status: EntitlementStatus;
  source: EntitlementSource;
  validUntil?: string | number | null;
  createdAt: string | number;
}

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'studio' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface AppSubscription {
  id: string;
  userId: string;
  userEmail: string;
  appId: string;
  appName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  
  // Credits and quotas
  creditsTotal: number;
  creditsRemaining: number;
  creditsUsed: number;
  creditsResetPeriod: 'monthly' | 'one_time' | 'unlimited';
  creditsResetAt?: number | string | null;
  
  // Features enabled for this tier
  features: string[];
  freeTrialPreviouslyClaimed?: boolean;
  
  // Billing & timestamps
  validUntil?: number | string | null;
  createdAt: number | string;
  updatedAt: number | string;
}

export interface CreditUsageRecord {
  id: string;
  userId: string;
  appId: string;
  amount: number;
  remainingAfter: number;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp: number | string;
}

export interface AppCategoryItem {
  id: string;
  label: string;
  description?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaymentMethodSummary {
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'other';
  brand?: string;
  last4?: string;
  vpa?: string;
  bank?: string;
  wallet?: string;
}

export interface OrderRecord {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  userId: string;
  userEmail: string;
  amount: number;
  amountPaise: number;
  currency: 'INR';
  status: 'created' | 'paid' | 'failed';
  itemType: 'subscription' | 'credit_pack';
  itemId: string;
  itemName: string;
  creditsAdded?: number;
  paymentMethod?: PaymentMethodSummary;
  receiptNumber: string;
  gstin?: string;
  businessName?: string;
  createdAt: number;
  paidAt?: number;
}

export interface SubdomainVerifyResponse {
  valid: boolean;
  user: {
    uid: string;
    email: string;
    displayName: string | null;
  };
  hasAccess: boolean;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    creditsRemaining: number;
    creditsTotal: number;
    creditsUsed: number;
    features: string[];
  } | null;
}
