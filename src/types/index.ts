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
  isEliteMember?: boolean;
  eliteExpiresAt?: number | string | null;
  eliteJoinedAt?: number | string | null;
  isDeactivated?: boolean;
  deactivatedAt?: string | number | null;
  savedPaymentMethod?: PaymentMethodSummary | null;
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
  itemType: 'subscription' | 'credit_pack' | 'membership';
  itemId: string;
  itemName: string;
  creditsAdded?: number;
  quantity?: number;
  paymentMethod?: PaymentMethodSummary;
  couponCode?: string;
  discountAmount?: number;
  isEliteDiscount?: boolean;
  eliteDiscountAmount?: number;
  originalAmount?: number;
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

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip?: string;
  location?: string;
  createdAt: string;
  lastActiveAt: string;
  status: 'active' | 'revoked';
  isCurrent?: boolean;
}

export interface QRLoginSession {
  tokenId: string;
  userId: string;
  username: string;
  userEmail: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'authenticated' | 'expired' | 'revoked';
  redeemedAt?: number;
  redeemedByDevice?: {
    deviceName?: string;
    browser?: string;
    os?: string;
    location?: string;
  };
}

export type CouponDiscountType = 'percentage' | 'flat';
export type CouponTargetType = 'all' | 'user';

export interface Coupon {
  id: string; // The coupon code (uppercase)
  code: string; // Uppercase coupon code
  description?: string;
  discountType: CouponDiscountType; // 'percentage' (% off) or 'flat' (₹ INR off)
  discountValue: number; // e.g. 50 (50% or ₹50)
  targetType: CouponTargetType; // 'all' or 'user'
  targetValue?: string; // target username (with or without @), email, or uid
  singleUsePerUser: boolean; // true = user can only use once
  maxTotalUses?: number; // optional total redemption limit
  currentUses: number;
  active: boolean;
  expiresAt?: number | null;
  createdAt: number;
  createdBy: string;
}

export interface CouponRedemption {
  id: string; // `${couponId}_${userId}`
  couponId: string;
  couponCode: string;
  userId: string;
  userEmail: string;
  username?: string;
  orderId?: string;
  discountAmountInr: number;
  redeemedAt: number;
}
