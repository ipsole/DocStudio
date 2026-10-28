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
  featured?: boolean;
  version?: string;
  tags?: string[];
  thumbnailUrl?: string;
  badge?: string;
  isDemo?: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
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

export interface AppCategoryItem {
  id: string;
  label: string;
  description?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
