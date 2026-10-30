'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AvatarEditModal } from '@/components/ui/AvatarEditModal';
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CreditTopUpModal } from '@/components/pricing/CreditTopUpModal';
import { LinkPhoneModal } from '@/components/ui/LinkPhoneModal';
import { CREDIT_PACKS, CreditPack } from '@/lib/pricingData';
import { ensureDefaultUserSubscriptions, isUsernameAvailable, getUserOrders } from '@/lib/firebase/db';
import { AppSubscription, OrderRecord, SubscriptionPlan, PaymentMethodSummary } from '@/types';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { InvoiceReceiptModal } from '@/components/billing/InvoiceReceiptModal';
import {
  User as UserIconLucide,
  AtSign,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Shield,
  ShieldCheck,
  KeyRound,
  Layers,
  FileText,
  Sliders,
  LogOut,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Camera,
  Pencil,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  Zap,
  Globe,
  Link2,
  Unlink,
  Smartphone,
  CreditCard,
  Receipt,
  Printer,
  ArrowRight,
  RefreshCw,
  Calendar,
  Trash2,
} from 'lucide-react';

type TabKey = 'profile' | 'subscriptions' | 'billing' | 'security' | 'settings' | 'legal';

export default function AccountPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const {
    user,
    profile,
    updateProfileDetails,
    changePassword,
    resetPassword,
    signOut,
    deleteAccount,
    isAdmin,
    linkGoogle,
    linkApple,
    unlinkProvider,
  } = useAuth();

  // Active tab state (with hash support)
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Profile fields state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<string | null>('User');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Live username availability check state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [creditTopUpSuccess, setCreditTopUpSuccess] = useState<string | null>(null);

  // Billing & Invoices state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [gstin, setGstin] = useState('');
  const [gstinSaved, setGstinSaved] = useState(false);
  const [savedPaymentMethod, setSavedPaymentMethod] = useState<PaymentMethodSummary | null>(null);
  const [isWipingPaymentMethod, setIsWipingPaymentMethod] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [wipeSuccessMsg, setWipeSuccessMsg] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification preferences
  const [lowCreditAlerts, setLowCreditAlerts] = useState(true);
  const [productAnnouncements, setProductAnnouncements] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Status feedback
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Detect SSO vs Email provider
  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com');
  const hasPasswordProvider = user?.providerData?.some((p) => p.providerId === 'password');
  const hasAppleProvider = user?.providerData?.some((p) => p.providerId === 'apple.com');
  const hasPhoneProvider = user?.providerData?.some((p) => p.providerId === 'phone') || Boolean(user?.phoneNumber);
  const linkedProvidersCount = user?.providerData?.length || 1;

  // Linked Providers & Identity state
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [providerActionLoading, setProviderActionLoading] = useState<string | null>(null);
  const [providerSuccess, setProviderSuccess] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const handleLinkGoogle = async () => {
    setProviderError(null);
    setProviderActionLoading('google.com');
    try {
      await linkGoogle();
      setProviderSuccess('Google Single Sign-On successfully linked to your account.');
      setTimeout(() => setProviderSuccess(null), 4000);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/credential-already-in-use') {
        setProviderError('This Google account is already linked to another Docdril user profile.');
      } else if (fbErr.code !== 'auth/popup-closed-by-user') {
        setProviderError(fbErr.message || 'Failed to connect Google account.');
      }
    } finally {
      setProviderActionLoading(null);
    }
  };

  const handleLinkApple = async () => {
    setProviderError(null);
    setProviderActionLoading('apple.com');
    try {
      await linkApple();
      setProviderSuccess('Apple ID successfully linked to your account.');
      setTimeout(() => setProviderSuccess(null), 4000);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/credential-already-in-use') {
        setProviderError('This Apple ID is already linked to another Docdril user profile.');
      } else if (fbErr.code === 'auth/operation-not-allowed') {
        setProviderError(
          'Sign in with Apple requires configuration in Firebase Console. You must supply your Apple Developer Services ID, Team ID, Key ID, and Private Key (.p8) in Firebase Console > Authentication > Sign-in method > Apple.'
        );
      } else if (fbErr.code !== 'auth/popup-closed-by-user') {
        setProviderError(fbErr.message || 'Failed to connect Apple ID.');
      }
    } finally {
      setProviderActionLoading(null);
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    if ((user?.providerData?.length || 0) <= 1) {
      setProviderError('You cannot disconnect your only login method. Connect another login method first.');
      return;
    }
    setProviderError(null);
    setProviderActionLoading(providerId);
    try {
      await unlinkProvider(providerId);
      setProviderSuccess(`Disconnected ${providerId} from your account.`);
      setTimeout(() => setProviderSuccess(null), 4000);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setProviderError(fbErr.message || 'Failed to disconnect login provider.');
    } finally {
      setProviderActionLoading(null);
    }
  };

  // Username fallback derivation
  const defaultUsername = (user?.email?.split('@')[0] || 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  const currentUsername = profile?.username || defaultUsername;

  // Measure exact initial top offset for zero-drift sticky locking
  const asideRef = useRef<HTMLElement>(null);
  const [stickyTop, setStickyTop] = useState<number | null>(null);

  useEffect(() => {
    const updateStickyTop = () => {
      if (asideRef.current) {
        const parent = asideRef.current.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const naturalTop = Math.round(parentRect.top + window.scrollY);
          setStickyTop(naturalTop);
        }
      }
    };

    updateStickyTop();
    const raf = requestAnimationFrame(updateStickyTop);
    window.addEventListener('resize', updateStickyTop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateStickyTop);
    };
  }, []);

  // Load URL hash on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as TabKey;
      if (['profile', 'subscriptions', 'billing', 'security', 'settings', 'legal'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  // Sync profile details
  useEffect(() => {
    if (profile || user) {
      setDisplayName(profile?.displayName || user?.displayName || '');
      const userDefault = (user?.email?.split('@')[0] || 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      setUsername(profile?.username || userDefault);
      setPhoneNumber(profile?.phoneNumber || '');
      setBio(profile?.bio || '');
      const hasGooglePhoto = Boolean(user?.photoURL || profile?.photoURL);
      const initialIcon = profile?.avatarIcon || (hasGooglePhoto ? 'google' : 'User');
      setAvatarIcon(initialIcon);
    }
  }, [profile, user]);

  // Debounced live username availability validation
  useEffect(() => {
    if (!isEditing) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    const clean = username.trim().toLowerCase();
    const currentClean = (profile?.username || defaultUsername || '').toLowerCase();

    // Matching user's current handle
    if (clean === currentClean && clean.length > 0) {
      setUsernameStatus('available');
      setUsernameMessage('Your current verified handle');
      return;
    }

    if (!clean) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username cannot be empty');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username must be at least 3 characters');
      return;
    }

    if (clean.length > 20) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username cannot exceed 20 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Only lowercase letters, numbers, and underscores allowed');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await isUsernameAvailable(clean, user?.uid);
        if (res.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username is available');
        } else {
          setUsernameStatus('unavailable');
          setUsernameMessage(res.reason || 'Username not available');
        }
      } catch {
        setUsernameStatus('idle');
        setUsernameMessage('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, isEditing, profile?.username, defaultUsername, user?.uid]);

  // Load subscriptions
  const loadSubscriptions = async () => {
    if (!user) return;
    try {
      setSubsLoading(true);
      const subs = await ensureDefaultUserSubscriptions(user.uid, user.email || '');
      setSubscriptions(subs);
    } catch (err) {
      console.error('[Account] Error loading subscriptions:', err);
    } finally {
      setSubsLoading(false);
    }
  };

  // Load user order receipts / invoices
  const loadOrders = async () => {
    if (!user) return;
    try {
      setOrdersLoading(true);
      const userOrders = await getUserOrders(user.uid, user.email || '');
      setOrders(userOrders);
    } catch (err) {
      console.error('[Account] Error loading orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
    loadOrders();
    if (typeof window !== 'undefined' && user?.uid) {
      const savedGstin = localStorage.getItem(`docstudio_gstin_${user.uid}`);
      if (savedGstin) setGstin(savedGstin);

      try {
        const rawMethod = localStorage.getItem(`docstudio_saved_payment_method_${user.uid}`);
        if (rawMethod) {
          setSavedPaymentMethod(JSON.parse(rawMethod));
        } else if (profile?.savedPaymentMethod) {
          setSavedPaymentMethod(profile.savedPaymentMethod);
        }
      } catch {
        // ignore
      }
    }
  }, [user, profile]);

  // If orders load and no explicit saved method was set, fallback to the latest paid order's method
  useEffect(() => {
    if (!savedPaymentMethod && orders.length > 0 && orders[0].paymentMethod && orders[0].paymentMethod.type !== 'other') {
      setSavedPaymentMethod(orders[0].paymentMethod);
    }
  }, [orders, savedPaymentMethod]);

  // Handler to wipe / delete stored payment method
  const handleWipePaymentMethod = async () => {
    if (!user) return;
    try {
      setIsWipingPaymentMethod(true);
      await fetch(`/api/billing/payment-method?userId=${encodeURIComponent(user.uid)}`, {
        method: 'DELETE',
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`docstudio_saved_payment_method_${user.uid}`);
      }
      setSavedPaymentMethod(null);
      setWipeConfirmOpen(false);
      setWipeSuccessMsg('Stored payment method wiped securely.');
      setTimeout(() => setWipeSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error wiping payment method:', err);
    } finally {
      setIsWipingPaymentMethod(false);
    }
  };

  // Copy Username Handle helper
  const handleCopyUsername = () => {
    if (!currentUsername) return;
    navigator.clipboard.writeText(`@${currentUsername}`);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  // Avatar save handler
  const handleSaveAvatar = async (newIcon: string) => {
    setAvatarIcon(newIcon);
    await updateProfileDetails({ avatarIcon: newIcon });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || user?.displayName || '');
    setUsername(profile?.username || defaultUsername);
    setUsernameStatus('idle');
    setUsernameMessage('');
    setPhoneNumber(profile?.phoneNumber || '');
    setBio(profile?.bio || '');
    setIsEditing(false);
    setGeneralError(null);
  };

  // Update Profile details handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setGeneralError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setGeneralError('Username must be 3-20 characters long and contain only lowercase letters, numbers, or underscores.');
      setProfileSaving(false);
      return;
    }

    if (usernameStatus === 'unavailable') {
      setGeneralError(usernameMessage || 'This username is already taken by another creator.');
      setProfileSaving(false);
      return;
    }

    if (cleanUsername !== (profile?.username || '').toLowerCase()) {
      const check = await isUsernameAvailable(cleanUsername, user?.uid);
      if (!check.available) {
        setUsernameStatus('unavailable');
        setUsernameMessage(check.reason || 'This username is already taken by another creator.');
        setGeneralError(check.reason || 'This username is already taken by another creator.');
        setProfileSaving(false);
        return;
      }
    }

    try {
      const hasGooglePhoto = Boolean(user?.photoURL || profile?.photoURL);
      await updateProfileDetails({
        displayName: displayName.trim(),
        username: cleanUsername,
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        avatarIcon: avatarIcon || (hasGooglePhoto ? 'google' : 'User'),
      });
      setProfileSuccess(true);
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      if (msg.toLowerCase().includes('permissions') || msg.includes('permission-denied')) {
        setGeneralError(
          'Cloud Firestore Security Rules are currently denying database writes in your Firebase Console. Your changes were safely cached locally, but you must publish the updated firestore.rules in Firebase Console to sync with the cloud database.'
        );
      } else {
        setGeneralError(msg);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // In-App Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordUpdating(true);
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  // Password reset email trigger
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setGeneralError(null);
    try {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to send password reset');
    }
  };

  // Top Up Success
  const handleTopUpSuccess = async (addedCredits: number) => {
    setCreditTopUpSuccess(`+${addedCredits} credits successfully added to your account!`);
    setTimeout(() => setCreditTopUpSuccess(null), 4000);
    await loadSubscriptions();
  };

  // Delete account handler
  const handleConfirmDelete = async () => {
    await deleteAccount();
    router.push('/');
  };

  // Aggregate credits
  const totalCreditsRemaining = subscriptions.reduce(
    (acc, sub) => acc + (sub.creditsRemaining || 0),
    0
  );
  const totalCreditsMax = subscriptions.reduce(
    (acc, sub) => acc + (sub.creditsTotal || 0),
    0
  );
  const totalCreditsPercentage =
    totalCreditsMax > 0 ? Math.min(100, Math.round((totalCreditsRemaining / totalCreditsMax) * 100)) : 0;

  // Active Plan & Subscription Lifecycle computation
  const activePlanTier: SubscriptionPlan = useMemo(() => {
    const hasEnterprise =
      subscriptions.some((s) => s.plan === 'enterprise') ||
      orders.some(
        (o) =>
          o.itemType === 'subscription' &&
          (o.itemId === 'enterprise' || o.itemName.toLowerCase().includes('ultra')) &&
          o.status === 'paid'
      );
    if (hasEnterprise) return 'enterprise';

    const hasPro =
      subscriptions.some((s) => s.plan === 'pro') ||
      orders.some(
        (o) =>
          o.itemType === 'subscription' &&
          (o.itemId === 'pro' || o.itemName.toLowerCase().includes('pro')) &&
          o.status === 'paid'
      );
    if (hasPro) return 'pro';

    return 'starter';
  }, [subscriptions, orders]);

  const latestSubOrder = useMemo(() => {
    return (
      orders.find((o) => o.itemType === 'subscription' && o.status === 'paid') ||
      orders.find((o) => o.status === 'paid')
    );
  }, [orders]);

  const isYearlyPlan = useMemo(() => {
    return Boolean(
      latestSubOrder &&
        (latestSubOrder.itemId?.includes('yearly') ||
          latestSubOrder.itemName?.toLowerCase().includes('annual') ||
          latestSubOrder.amount > 3000)
    );
  }, [latestSubOrder]);

  const planTierDisplayName =
    activePlanTier === 'enterprise'
      ? isYearlyPlan
        ? 'DocStudio Ultra Annual'
        : 'DocStudio Ultra Pass'
      : activePlanTier === 'pro'
      ? isYearlyPlan
        ? 'DocStudio Pro Annual'
        : 'DocStudio Pro Pass'
      : 'Starter (Free)';

  const planRenewalAmount =
    activePlanTier === 'enterprise'
      ? isYearlyPlan
        ? 9590
        : 999
      : activePlanTier === 'pro'
      ? isYearlyPlan
        ? 4790
        : 499
      : 0;

  const cycleDurationDays = isYearlyPlan ? 365 : 30;
  const cycleStartMs = latestSubOrder ? latestSubOrder.paidAt || latestSubOrder.createdAt : Date.now();
  const nextRenewalDateMs = cycleStartMs + cycleDurationDays * 24 * 60 * 60 * 1000;
  const nextRenewalDateFormatted = new Date(nextRenewalDateMs).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const daysUntilRenewal = Math.max(0, Math.ceil((nextRenewalDateMs - Date.now()) / (24 * 60 * 60 * 1000)));

  // Sidebar navigation items
  const navItems: { key: TabKey; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'profile', label: 'Account', icon: UserIconLucide },
    { key: 'subscriptions', label: 'Subscriptions', icon: Layers, badge: `${totalCreditsRemaining} pts` },
    { key: 'billing', label: 'Billing', icon: CreditCard, badge: orders.length > 0 ? `${orders.length}` : undefined },
    { key: 'security', label: 'Security', icon: KeyRound },
    { key: 'settings', label: 'Preferences', icon: Sliders },
    { key: 'legal', label: 'Terms', icon: FileText },
  ];

  return (
    <ProtectedRoute>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-neutral-900 dark:text-white transition-colors duration-200">
        
        {/* Mobile Header (Settings title + Horizontal Tabs) */}
        <div className="md:hidden space-y-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
            Settings
          </h1>
          <div className="overflow-x-auto pb-2 -mx-4 px-4 flex items-center gap-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTabChange(item.key)}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-sans font-medium flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-neutral-100/80 dark:bg-neutral-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Desktop Layout */}
        <div className="w-full flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Navigation Sidebar - Sticky Locked in Viewport from Scroll 0 */}
          <aside
            ref={asideRef}
            style={{ top: stickyTop !== null ? `${stickyTop}px` : undefined }}
            className="hidden md:block w-64 shrink-0 space-y-4 sticky top-[112px] self-start"
          >
            <div className="pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                Settings
              </h1>
            </div>

            <nav className="p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl space-y-1 shadow-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabChange(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-sans font-medium transition-all text-left cursor-pointer group ${
                      isActive
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'opacity-100'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-black/10 dark:text-neutral-950'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-70 ml-1" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Account Card in Sidebar */}
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} profile={profile} avatarIcon={avatarIcon} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white truncate font-sans">
                    {displayName || 'DocStudio User'}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono flex items-center gap-1">
                    <span>@{currentUsername}</span>
                    <VerifiedBadge size="sm" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-900 flex items-center justify-end">
                <button
                  type="button"
                  onClick={signOut}
                  className="text-[11px] font-sans text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Main Content Pane */}
          <main className="w-full flex-1 min-w-0 md:pt-[56px] space-y-6">

            {/* Global Feedback Banners */}
            {generalError && (
              <div className="p-4 border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs font-sans flex items-center gap-2 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-sans flex items-center gap-2 rounded-xl animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Profile details updated successfully.</span>
              </div>
            )}

            {creditTopUpSuccess && (
              <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-sans flex items-center gap-2 rounded-xl animate-fadeIn">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{creditTopUpSuccess}</span>
              </div>
            )}

            {/* TAB 1: Account */}
            {activeTab === 'profile' && (
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header Row: Live Avatar Hero + Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-900">
                  <div className="flex items-center gap-5">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setIsAvatarModalOpen(true)}
                      title="Click to change avatar"
                    >
                      <UserAvatar
                        user={user}
                        profile={profile}
                        avatarIcon={avatarIcon}
                        size="xl"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                        <Camera className="w-5 h-5 drop-shadow-sm" />
                        <span className="text-[9px] font-sans font-medium mt-0.5">Edit</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                          {displayName || 'DocStudio User'}
                        </h2>
                        {isAdmin && (
                          <Badge variant="info">
                            <Shield className="w-3 h-3" />
                            ADMIN
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 font-sans flex-wrap">
                        <span className="bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-800 dark:text-neutral-200 rounded-lg flex items-center gap-1.5 font-medium">
                          <span className="text-neutral-400 dark:text-neutral-500">@</span>
                          <span>{currentUsername}</span>
                          <VerifiedBadge size="sm" />
                          <button
                            type="button"
                            onClick={handleCopyUsername}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors ml-0.5"
                            title="Copy handle"
                          >
                            {copiedUsername ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                        <button
                          type="button"
                          onClick={() => setIsAvatarModalOpen(true)}
                          className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Change Avatar</span>
                        </button>
                      </div>

                      {/* Bio in Profile Header */}
                      {bio ? (
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans max-w-lg leading-relaxed pt-1 whitespace-pre-line line-clamp-2">
                          {bio}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 font-sans italic flex items-center gap-1 cursor-pointer pt-1 transition-colors group"
                        >
                          <span className="group-hover:underline">+ Add a bio to your profile</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>STATUS: </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">VERIFIED</span>
                  </div>
                </div>

                {/* Profile Details: VIEW MODE vs EDIT MODE */}
                {!isEditing ? (
                  /* 1. VIEW MODE */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-neutral-900 dark:text-white">
                          Personal Information
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          Your unique public identity handle and registered credentials.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          <UserIconLucide className="w-3.5 h-3.5" />
                          <span>Full Name</span>
                        </div>
                        <p className="text-sm font-bold text-neutral-950 dark:text-white font-sans">
                          {displayName || 'DocStudio User'}
                        </p>
                      </div>

                      {/* Unique Username Handle */}
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          <div className="flex items-center gap-1.5">
                            <AtSign className="w-3.5 h-3.5" />
                            <span>Username</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            Unique Handle
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-sm font-bold font-mono text-neutral-950 dark:text-white">
                            @{currentUsername}
                          </p>
                          <VerifiedBadge size="sm" />
                        </div>
                      </div>

                      {/* Email Address (Immutable) */}
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email Address</span>
                          </div>
                          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </span>
                        </div>
                        <p className="text-sm font-bold text-neutral-950 dark:text-white font-sans truncate">
                          {user?.email || 'N/A'}
                        </p>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
                          Primary email anchor tied to your single-sign-on credentials.
                        </p>
                      </div>

                      {/* Phone Number */}
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          <Phone className="w-3.5 h-3.5" />
                          <span>Phone Number</span>
                        </div>
                        <p
                          className={`text-sm font-sans ${
                            phoneNumber
                              ? 'font-bold text-neutral-950 dark:text-white font-mono'
                              : 'text-neutral-400 italic'
                          }`}
                        >
                          {phoneNumber || 'Not provided'}
                        </p>
                      </div>

                      {/* Bio / About Me (Dedicated Full Width Card) */}
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2 sm:col-span-2">
                        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Bio / About Me</span>
                          </div>
                          {!bio && (
                            <button
                              type="button"
                              onClick={() => setIsEditing(true)}
                              className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 hover:underline cursor-pointer"
                            >
                              + Add Bio
                            </button>
                          )}
                        </div>
                        {bio ? (
                          <p className="text-sm font-normal text-neutral-800 dark:text-neutral-200 font-sans whitespace-pre-line leading-relaxed">
                            {bio}
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-sans italic">
                            No bio added yet. Tell creators and collaborators about yourself or your software workflows.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. EDIT MODE */
                  <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-900">
                      <div>
                        <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-neutral-900 dark:text-white">
                          Edit Profile Details
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          Update your public name, unique handle, and personal details.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-sans flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Full Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Docdril User"
                        required
                      />

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            Username / Handle
                          </label>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans">
                            Always unique
                          </span>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-mono text-sm">
                            @
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                              setUsername(val);
                            }}
                            placeholder="username"
                            maxLength={20}
                            required
                            className={`w-full rounded-lg border bg-white dark:bg-neutral-900/90 pl-8 pr-10 py-2.5 text-sm font-mono text-neutral-900 dark:text-white focus:outline-none transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500 ${
                              usernameStatus === 'unavailable'
                                ? 'border-rose-500 focus:border-rose-500 dark:border-rose-500 dark:focus:border-rose-500 ring-1 ring-rose-500/30'
                                : usernameStatus === 'available'
                                ? 'border-emerald-500 focus:border-emerald-500 dark:border-emerald-500 dark:focus:border-emerald-500'
                                : usernameStatus === 'invalid'
                                ? 'border-amber-500 focus:border-amber-500 dark:border-amber-500 dark:focus:border-amber-500'
                                : 'border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-neutral-950 dark:focus:border-white'
                            }`}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {usernameStatus === 'checking' && (
                              <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                            )}
                            {usernameStatus === 'available' && (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                            {usernameStatus === 'unavailable' && (
                              <XCircle className="w-4 h-4 text-rose-500" />
                            )}
                            {usernameStatus === 'invalid' && (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        </div>

                        {/* Live availability feedback */}
                        {usernameStatus === 'unavailable' && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-sans mt-1 animate-fadeIn">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">Username not available</span>
                            <span className="text-rose-500/80 dark:text-rose-400/80">— {usernameMessage}</span>
                          </div>
                        )}
                        {usernameStatus === 'available' && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-sans mt-1 animate-fadeIn">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{usernameMessage}</span>
                            {username.trim().toLowerCase() === (profile?.username || defaultUsername || '').toLowerCase() && (
                              <VerifiedBadge size="sm" />
                            )}
                          </div>
                        )}
                        {usernameStatus === 'invalid' && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-sans mt-1 animate-fadeIn">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{usernameMessage}</span>
                          </div>
                        )}
                        {usernameStatus === 'checking' && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-1 animate-fadeIn">
                            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                            <span>Checking handle availability...</span>
                          </div>
                        )}
                        {usernameStatus === 'idle' && (
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
                            3-20 characters (lowercase letters, numbers, underscores).
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            Email Address
                          </label>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            Non-changeable
                          </span>
                        </div>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          readOnly
                          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/60 px-3.5 py-2.5 text-sm font-sans text-neutral-500 dark:text-neutral-400 cursor-not-allowed select-all"
                        />
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
                          Email cannot be edited as it is the permanent security identifier for your account.
                        </p>
                      </div>

                      <Input
                        label="Phone Number"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        helperText="Optional for notifications and security recovery"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          Bio / About Me
                        </label>
                        <span className={`text-[11px] font-mono ${bio.length >= 260 ? 'text-amber-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'}`}>
                          {bio.length} / 280
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={280}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell the community about your creative work, background, or what you build with Docdril..."
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-neutral-950 dark:focus:border-white bg-white dark:bg-neutral-900/90 px-3.5 py-2.5 text-sm font-sans text-neutral-900 dark:text-white focus:outline-none transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none leading-relaxed"
                      />
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
                        Displayed on your public profile header and workspace team cards.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-900">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={profileSaving}
                        disabled={profileSaving || usernameStatus === 'unavailable' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={handleCancelEdit}
                        disabled={profileSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                      Subscriptions & Credits
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                      Shared balance across all Docdril creative pipelines and document engines.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedPack(CREDIT_PACKS[1]);
                        setIsTopUpOpen(true);
                      }}
                      className="gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Add Credits</span>
                    </Button>

                    <Link href="/pricing">
                      <Button variant="primary" size="sm" className="gap-1.5">
                        <span>Upgrade Plan</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Section 1: Generation Credits Vault */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Generation Credits Vault
                    </h3>
                  </div>

                  <div className="p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold font-mono text-neutral-950 dark:text-white">
                          {subsLoading ? '...' : totalCreditsRemaining}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          credits available / {totalCreditsMax} total monthly pool
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {totalCreditsPercentage}% remaining
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${totalCreditsPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Active Software Subscriptions */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Active Software Subscriptions
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Your entitlement tiers and feature allowances across each Docdril product.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Canvas */}
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            ACTIVE
                          </span>
                          <span className="text-xs font-semibold uppercase text-neutral-500">CANVAS</span>
                        </div>
                        <h4 className="text-base font-bold text-neutral-950 dark:text-white font-sans">
                          Docdril Canvas
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                          Visual vector design, artboard layout, and high-res SVG/PNG export pipelines.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                        <span className="text-neutral-500 font-sans">Tier: <strong className="text-neutral-900 dark:text-white capitalize">{subscriptions[0]?.plan || 'Starter'}</strong></span>
                        <Link href="/dashboard" className="text-neutral-900 dark:text-white font-semibold hover:underline flex items-center gap-1">
                          Launch <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Motion */}
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                            SOON
                          </span>
                          <span className="text-xs font-semibold uppercase text-neutral-500">MOTION</span>
                        </div>
                        <h4 className="text-base font-bold text-neutral-950 dark:text-white font-sans">
                          Docdril Motion
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                          Kinetic typography sequencer, timeline keyframing, and 60 FPS video renderer.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                        <span className="text-neutral-500 font-sans">Tier: <strong className="text-neutral-900 dark:text-white capitalize">{subscriptions[1]?.plan || 'Starter'}</strong></span>
                        <span className="text-neutral-400 italic">Early Access</span>
                      </div>
                    </div>

                    {/* Flow */}
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            ACTIVE
                          </span>
                          <span className="text-xs font-semibold uppercase text-neutral-500">FLOW</span>
                        </div>
                        <h4 className="text-base font-bold text-neutral-950 dark:text-white font-sans">
                          Docdril Flow
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                          Productivity pipeline and document workflow utility for multi-format transformations.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                        <span className="text-neutral-500 font-sans">Tier: <strong className="text-neutral-900 dark:text-white capitalize">{subscriptions[2]?.plan || 'Starter'}</strong></span>
                        <Link href="/dashboard" className="text-neutral-900 dark:text-white font-semibold hover:underline flex items-center gap-1">
                          Launch <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Extra Credit Packs */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Top-Up Extra Credits On Demand
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Need more credits right now? Extra credits never expire and roll over indefinitely.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CREDIT_PACKS.map((pack) => (
                      <div
                        key={pack.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 min-w-0 ${
                          pack.popular
                            ? 'border-neutral-950 dark:border-white bg-neutral-50 dark:bg-neutral-900/90 shadow-md ring-1 ring-neutral-950/10 dark:ring-white/20'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                              {pack.name}
                            </span>
                            {pack.savingsBadge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                                {pack.savingsBadge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                              {pack.priceInr}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono">
                              / {pack.priceUsd}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                            +{pack.credits} Credits • {pack.costPerCredit}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant={pack.popular ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            setSelectedPack(pack);
                            setIsTopUpOpen(true);
                          }}
                          className="w-full"
                        >
                          Top-Up {pack.credits} Credits
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Billing & Invoices */}
            {activeTab === 'billing' && (
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                      Billing & Invoices
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                      Manage payment methods, view official tax receipts, and access your transaction history.
                    </p>
                  </div>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-black text-xs font-semibold self-start sm:self-auto hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Pricing Plans</span>
                  </Link>
                </div>

                {/* Section 1: Plan Renewal & Subscription Cycle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                          Plan Renewal & Subscription Cycle
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          Active subscription tier, automated renewal schedule, and recurring entitlement status.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {activePlanTier === 'starter' ? 'Free Tier Active' : 'Auto-Renew Active'}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-base sm:text-lg font-bold font-sans text-neutral-950 dark:text-white">
                            {planTierDisplayName}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                            {activePlanTier === 'enterprise'
                              ? 'Team / Ultra'
                              : activePlanTier === 'pro'
                              ? 'Creator Pro'
                              : 'Free Forever'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          {activePlanTier === 'starter'
                            ? 'Access to starter artboards and 50 monthly credits. Upgrade anytime to unlock all software suites.'
                            : 'Unlimited access to all creative suites, 4K exports, priority cloud rendering, and 500 monthly generation credits.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href="/pricing"
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-950 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
                        >
                          {activePlanTier === 'starter' ? 'Upgrade to Pro' : 'Change Plan'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPack(CREDIT_PACKS[1]);
                            setIsTopUpOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                        >
                          + Buy Credits
                        </button>
                      </div>
                    </div>

                    {/* Renewal Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-sans block">
                          Billing Frequency
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white font-sans mt-1 block">
                          {isYearlyPlan ? 'Yearly (Annual)' : 'Monthly'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-sans block">
                          Renewal Amount
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white font-sans mt-1 block">
                          ₹{planRenewalAmount}.00{' '}
                          <span className="text-xs text-neutral-400 font-normal">
                            {isYearlyPlan ? '/ yr' : '/ mo'}
                          </span>
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-sans block">
                          Next Billing Date
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white font-sans mt-1 block font-mono">
                          {activePlanTier === 'starter' ? 'N/A' : nextRenewalDateFormatted}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-sans block">
                          Cycle Status
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans mt-1 block">
                          {activePlanTier === 'starter' ? 'Active' : `${daysUntilRenewal} Days Remaining`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Active Payment Channel */}
                <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                          Active Payment Channel & Stored Details
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          Tokenized and securely processed. Compliant with RBI guidelines.
                        </p>
                      </div>
                    </div>
                    {wipeSuccessMsg && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1 animate-fadeIn">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{wipeSuccessMsg}</span>
                      </span>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-sm">
                        <CreditCard className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <div>
                        {savedPaymentMethod ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold font-sans text-neutral-900 dark:text-white">
                                {savedPaymentMethod.type === 'card'
                                  ? `${savedPaymentMethod.brand || 'Card'} •••• ${savedPaymentMethod.last4 || '****'}`
                                  : savedPaymentMethod.type === 'upi'
                                  ? `UPI • ${savedPaymentMethod.vpa || 'Verified VPA'}`
                                  : 'Saved 1-Click Method'}
                              </p>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                Stored
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                              Pre-selected for 1-click checkout • Secured with RBI-compliant tokenization
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold font-sans text-neutral-900 dark:text-white">
                              Standard Checkout
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                              No saved cards or UPI on file. UPI, Visa, Mastercard, RuPay & NetBanking entered securely at checkout.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {savedPaymentMethod && (
                        <>
                          {wipeConfirmOpen ? (
                            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
                              <span className="text-[11px] font-medium text-red-700 dark:text-red-300 px-1">
                                Wipe stored method?
                              </span>
                              <button
                                type="button"
                                onClick={handleWipePaymentMethod}
                                disabled={isWipingPaymentMethod}
                                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                {isWipingPaymentMethod ? 'Wiping...' : 'Yes, Wipe'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setWipeConfirmOpen(false)}
                                className="px-2 py-1 rounded-lg text-neutral-600 dark:text-neutral-400 text-[11px] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setWipeConfirmOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Wipe Stored Method</span>
                            </button>
                          )}
                        </>
                      )}

                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-4 h-4" />
                        <span>256-Bit SSL</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Invoices & Transaction History */}
                <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                        Invoices & Transaction History
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                        Download and review official electronic receipts for subscriptions and extra credit purchases.
                      </p>
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="p-8 text-center text-xs text-neutral-500 font-sans flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading transaction receipts...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-10 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center space-y-3 bg-neutral-50/50 dark:bg-neutral-950/40">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div className="max-w-sm mx-auto space-y-1">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white font-sans">
                          No transactions yet
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          When you upgrade to DocStudio Pro or purchase credit packs, your electronic receipts and invoices will be stored here.
                        </p>
                      </div>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white underline underline-offset-4 hover:opacity-80 pt-1"
                      >
                        <span>Explore Subscriptions</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Description</th>
                              <th className="py-3 px-4">Invoice ID</th>
                              <th className="py-3 px-4">Amount</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                            {orders.map((order) => {
                              const dateStr = new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              });

                              return (
                                <tr key={order.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition-colors">
                                  <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                                    {dateStr}
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                      <span>{order.itemName}</span>
                                      {order.quantity && order.quantity > 1 ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                          ×{order.quantity}
                                        </span>
                                      ) : null}
                                    </div>
                                    {order.creditsAdded ? (
                                      <span className="block text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                                        +{order.creditsAdded} credits
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                                    {order.receiptNumber}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-950 dark:text-white">
                                    ₹{order.amount.toFixed(2)}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                                      Paid
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setIsInvoiceModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors font-medium text-[11px]"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4: Billing & Tax Info (GSTIN) */}
                <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Tax & Invoicing Details
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Enter your organization's GSTIN to include tax identification on your Razorpay receipts.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-sans mb-1.5">
                          Billing Email
                        </label>
                        <input
                          type="text"
                          value={user?.email || ''}
                          disabled
                          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 px-3.5 py-2 text-xs font-mono text-neutral-500 select-all cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-sans mb-1.5">
                          GSTIN / Business Tax ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value.toUpperCase())}
                          placeholder="22AAAAA0000A1Z5"
                          maxLength={15}
                          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {gstinSaved ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1 animate-fadeIn">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Billing information saved.</span>
                        </span>
                      ) : <span />}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (typeof window !== 'undefined' && user?.uid) {
                            localStorage.setItem(`docstudio_gstin_${user.uid}`, gstin);
                            setGstinSaved(true);
                            setTimeout(() => setGstinSaved(false), 3000);
                          }
                        }}
                        className="text-xs"
                      >
                        Save Billing Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Security */}
            {activeTab === 'security' && (
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                      Security & Authentication
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                      Manage your login credentials, password updates, and session devices.
                    </p>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 self-start sm:self-center">
                    {isGoogleUser ? 'Google SSO' : 'Email & Password'}
                  </span>
                </div>

                {/* Section 1: Connected Authentication & Identity Logins */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                        Connected Authentication Methods
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                        Every credential linked here is permanently tied to your Docdril account.
                      </p>
                    </div>
                  </div>

                  {providerSuccess && (
                    <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-sans flex items-center gap-2 animate-fadeIn">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{providerSuccess}</span>
                    </div>
                  )}

                  {providerError && (
                    <div className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs font-sans flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{providerError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {/* Unified Account Identity & Access Card */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-5">
                      {/* Top Row: Primary Email Identity */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-sm">
                            <Mail className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans">
                                Registered Account Email
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Verified
                              </span>
                            </div>
                            <p className="text-base font-bold font-mono text-neutral-950 dark:text-white truncate mt-0.5">
                              {user?.email || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-xs sm:text-right">
                          Primary identity anchor. All creative apps, subscriptions, and security alerts are routed here.
                        </p>
                      </div>

                      {/* Bottom Section: Active Sign-in Methods */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans">
                          Available Sign-In Methods
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Method 1: Google SSO */}
                          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/90 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                                  Google Single Sign-On
                                </p>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans truncate">
                                  {isGoogleUser ? '1-tap sign-in active' : 'Connect for 1-tap Google login'}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              {isGoogleUser ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Connected</span>
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleLinkGoogle}
                                  isLoading={providerActionLoading === 'google.com'}
                                  className="text-[11px] h-7 px-2.5"
                                >
                                  Connect
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Method 2: Password Authentication */}
                          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/90 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
                                <KeyRound className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                                  Account Password
                                </p>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans truncate">
                                  {hasPasswordProvider ? 'Active (Change password below)' : 'Managed via Google SSO'}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{hasPasswordProvider ? 'Active' : 'Managed'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optional: Phone Number (Only displayed if already linked to account) */}
                    {hasPhoneProvider && (
                      <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                              <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                                  Phone Number (SMS OTP)
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                  Linked
                                </span>
                              </div>
                              <p className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                {user?.phoneNumber || profile?.phoneNumber}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                            Sign in directly via 6-digit SMS OTP.
                          </p>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {linkedProvidersCount > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnlinkProvider('phone')}
                                isLoading={providerActionLoading === 'phone'}
                                className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 text-[11px] h-8 px-2"
                                title="Unlink Phone"
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Optional: Apple ID (Only displayed if already linked to account) */}
                    {hasAppleProvider && (
                      <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5 fill-current text-neutral-900 dark:text-white" viewBox="0 0 24 24">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.38-.56.65-1.06 1.71-.93 2.74 1.04.08 2.06-.5 2.67-1.25z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                                  Apple ID
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                  Linked
                                </span>
                              </div>
                              <p className="text-xs font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">
                                Connected via Apple
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                            Face ID / Touch ID active.
                          </p>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {linkedProvidersCount > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnlinkProvider('apple.com')}
                                isLoading={providerActionLoading === 'apple.com'}
                                className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 text-[11px] h-8 px-2"
                                title="Unlink Apple"
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: In-App Password Change */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-neutral-900 dark:text-white" />
                      <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                        Change Password
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Verify your current password and choose a strong new password for your DocStudio account.
                    </p>
                  </div>

                  {passwordSuccess && (
                    <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-sans flex items-center gap-2 animate-fadeIn">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Password changed successfully. Your account is secured.</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs font-sans flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {hasPasswordProvider ? (
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 font-sans mb-1.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPass ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          >
                            {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 font-sans mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          >
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 font-sans mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          >
                            {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button type="submit" variant="primary" size="md" isLoading={passwordUpdating}>
                          Update Password
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-sans space-y-2">
                      <p>
                        You are currently signed in using <strong>Google SSO</strong>. To establish an independent password for direct email sign-in, you can trigger a password setup email below.
                      </p>
                    </div>
                  )}

                  {/* Password Reset Email Alternative */}
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-900 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                          Forgot your password or want an email reset link?
                        </p>
                        <p className="text-[11px] text-neutral-500 font-sans">
                          We will dispatch a secure single-use recovery link to {user?.email}.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handlePasswordReset}
                        disabled={resetSent}
                      >
                        {resetSent ? 'Email Sent!' : 'Send Reset Link'}
                      </Button>
                    </div>

                    {resetSent && (
                      <span className="font-sans text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Reset email dispatched to {user?.email}. Please check your inbox and spam folder.
                      </span>
                    )}
                  </div>
                </div>

                {/* Section 3: Active Device Session */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                        Active Device Session
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                        Your authenticated DocStudio token on this browser.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={signOut}
                      className="gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Here</span>
                    </Button>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white">This Device (Current Session)</p>
                        <p className="text-neutral-500 text-[11px]">Next.js Workspace • Firebase JWT Token Active</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">ONLINE</span>
                  </div>
                </div>

                {/* Section 4: Account Deletion */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                        Delete Account
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-xl leading-relaxed">
                        Permanently delete your profile, credentials, and active software subscriptions across the Docdril ecosystem.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="shrink-0"
                    >
                      Delete Account
                    </Button>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-xs font-sans text-neutral-600 dark:text-neutral-400 space-y-1.5">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Data Governance & Permanent Erasure
                    </p>
                    <p className="leading-relaxed">
                      Once initiated, all account data, avatars, and generation credit pools are permanently expunged under GDPR Right to Erasure. This action cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Preferences */}
            {activeTab === 'settings' && (
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header Row */}
                <div className="pb-6 border-b border-neutral-200 dark:border-neutral-900">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                    Preferences & Interface
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                    Customize your visual theme, alert notifications, and regional settings.
                  </p>
                </div>

                {/* Section 1: Appearance & Theme */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Appearance & Theme
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Select how DocStudio artboards, dashboards, and toolbars render on your display.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dark Mode Option */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 ${
                        theme === 'dark'
                          ? 'border-neutral-950 dark:border-white bg-neutral-900 text-white shadow-md ring-2 ring-neutral-950/20 dark:ring-white/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-neutral-800 text-white shrink-0">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-sans">Dark Mode</span>
                          {theme === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                          High-contrast obsidian theme engineered for creative focus and low eye strain.
                        </p>
                      </div>
                    </button>

                    {/* Light Mode Option */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 ${
                        theme === 'light'
                          ? 'border-neutral-950 dark:border-white bg-white text-neutral-950 shadow-md ring-2 ring-neutral-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-neutral-200 text-neutral-900 shrink-0">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-sans text-neutral-950">Light Mode</span>
                          {theme === 'light' && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                          Clean gallery white interface with crisp charcoal lines and bright viewports.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Notifications & Alerts */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Notifications & Alerts
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Choose what alerts are sent to your registered email {user?.email}.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 cursor-pointer">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                          Low Credits Threshold Warning
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                          Send an alert when generation balance drops below 20 credits.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={lowCreditAlerts}
                        onChange={(e) => {
                          setLowCreditAlerts(e.target.checked);
                          setSettingsSaved(true);
                          setTimeout(() => setSettingsSaved(false), 2000);
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 cursor-pointer">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                          Product Releases & Architecture Updates
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                          Get notified when Docdril Motion and new pipelines enter general availability.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={productAnnouncements}
                        onChange={(e) => {
                          setProductAnnouncements(e.target.checked);
                          setSettingsSaved(true);
                          setTimeout(() => setSettingsSaved(false), 2000);
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 cursor-pointer"
                      />
                    </label>
                  </div>

                  {settingsSaved && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1.5 animate-fadeIn">
                      <Check className="w-3.5 h-3.5" />
                      <span>Preferences saved automatically.</span>
                    </div>
                  )}
                </div>

                {/* Section 3: Localization & Currency */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Localization & Currencies
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                    DocStudio supports dual currency transparent pricing:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">Indian Rupee (INR ₹)</p>
                      <p className="text-[11px] text-neutral-500 font-sans mt-0.5">Primary domestic pricing (₹499 Pro / ₹999 Ultra)</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">US Dollar (USD $)</p>
                      <p className="text-[11px] text-neutral-500 font-sans mt-0.5">International side-by-side ($6 Pro / $12 Ultra)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Terms */}
            {activeTab === 'legal' && (
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header Row */}
                <div className="pb-6 border-b border-neutral-200 dark:border-neutral-900">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                    Terms & Governance
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                    Clear, creator-friendly governance, commercial licensing, and data protection standards.
                  </p>
                </div>

                {/* Section 1: Terms of Service */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                    Terms of Service & Licensing
                  </h3>

                  <div className="space-y-3 text-xs font-sans text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">1. 100% Creator Ownership</h4>
                      <p>
                        You retain 100% intellectual property ownership of all artwork, motion sequences, artboards, vectors, and documents generated on DocStudio. We claim zero rights or ownership over your creative output.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">2. Acceptable Use & Fair Access</h4>
                      <p>
                        You agree to use DocStudio tools in compliance with all relevant laws. Automated scraping, reverse-engineering of cloud rendering engines, or attempting to exploit credit quotas violates our service terms.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">3. Commercial Rights</h4>
                      <p>
                        Assets rendered under DocStudio Pro and Ultra subscriptions are eligible for commercial use, client distribution, video production, and commercial publishing without royalty obligations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Privacy Policy & GDPR */}
                <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-900">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                    Privacy Policy & GDPR Compliance
                  </h3>

                  <div className="space-y-3 text-xs font-sans text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">Zero Third-Party Data Selling</h4>
                      <p>
                        DocStudio never sells, brokers, or monetizes personal data. Your email, phone, and project parameters remain confidential and encrypted in transit (TLS 1.3) and at rest (AES-256).
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">Right to Erasure & Anti-Abuse Safeguards</h4>
                      <p>
                        Under GDPR Right to Erasure, deleting your account wipes all profile records, subscription histories, and cloud projects. To protect system infrastructure from recreate-and-exploit attacks, an irreversible cryptographic SHA-256 hash is retained solely to prevent automated re-claiming of initial free credits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Avatar Selection Modal */}
        <AvatarEditModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentIcon={avatarIcon}
          user={user}
          profile={profile}
          onSave={handleSaveAvatar}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          userEmail={user?.email || ''}
          onConfirmDelete={handleConfirmDelete}
        />

        {/* Credit Top-Up Modal */}
        <CreditTopUpModal
          pack={selectedPack}
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          onSuccess={async (addedCredits) => {
            await handleTopUpSuccess(addedCredits);
            await loadOrders();
          }}
        />

        {/* Invoice Receipt Modal */}
        <InvoiceReceiptModal
          order={selectedOrder}
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />

        {/* Link Phone Modal */}
        <LinkPhoneModal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          onSuccess={(newPhone) => {
            setPhoneNumber(newPhone);
            setProviderSuccess(`Phone number ${newPhone} successfully linked to your unified account!`);
            setTimeout(() => setProviderSuccess(null), 4000);
          }}
        />

      </div>
    </ProtectedRoute>
  );
}
