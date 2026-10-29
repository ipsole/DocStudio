'use client';

import React, { useState, useEffect } from 'react';
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
import { CREDIT_PACKS, CreditPack } from '@/lib/pricingData';
import { ensureDefaultUserSubscriptions, getUserSubscriptions } from '@/lib/firebase/db';
import { AppSubscription } from '@/types';
import {
  User as UserIconLucide,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Shield,
  KeyRound,
  Layers,
  CreditCard,
  FileText,
  Sliders,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
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
  Bell,
  ChevronRight,
  Zap,
  ShieldAlert,
  Globe,
  RefreshCw,
} from 'lucide-react';

type TabKey = 'profile' | 'subscriptions' | 'security' | 'settings' | 'legal' | 'danger';

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
  } = useAuth();

  // Active tab state (with hash support)
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Profile fields state
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<string | null>('User');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [creditTopUpSuccess, setCreditTopUpSuccess] = useState<string | null>(null);

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

  // Load URL hash on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as TabKey;
      if (['profile', 'subscriptions', 'security', 'settings', 'legal', 'danger'].includes(hash)) {
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
      setPhoneNumber(profile?.phoneNumber || '');
      setBio(profile?.bio || '');
      const hasGooglePhoto = Boolean(user?.photoURL || profile?.photoURL);
      const initialIcon = profile?.avatarIcon || (hasGooglePhoto ? 'google' : 'User');
      setAvatarIcon(initialIcon);
    }
  }, [profile, user]);

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

  useEffect(() => {
    loadSubscriptions();
  }, [user]);

  // Copy UID helper
  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
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
    try {
      const hasGooglePhoto = Boolean(user?.photoURL || profile?.photoURL);
      await updateProfileDetails({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        avatarIcon: avatarIcon || (hasGooglePhoto ? 'google' : 'User'),
      });
      setProfileSuccess(true);
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to update profile');
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

  // Sidebar navigation items
  const navItems: { key: TabKey; label: string; icon: React.ElementType; badge?: string; danger?: boolean }[] = [
    { key: 'profile', label: 'Profile & Identity', icon: UserIconLucide },
    { key: 'subscriptions', label: 'Subscriptions & Quota', icon: Layers, badge: `${totalCreditsRemaining} pts` },
    { key: 'security', label: 'Security & Password', icon: KeyRound },
    { key: 'settings', label: 'Preferences & Theme', icon: Sliders },
    { key: 'legal', label: 'Terms & Policies', icon: FileText },
    { key: 'danger', label: 'Danger Zone', icon: Trash2, danger: true },
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
        
        {/* Top Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-900 pb-5 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
            Settings
          </h1>
        </div>

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

        {/* Mobile Horizontal Tabs Pill Bar */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4 flex items-center gap-2 scrollbar-none">
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
                    ? item.danger
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                    : item.danger
                    ? 'text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-neutral-100/80 dark:bg-neutral-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Desktop Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6 sticky top-24">
            <nav className="p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl space-y-1 shadow-sm">
              <div className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Navigation
              </div>

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
                        ? item.danger
                          ? 'bg-red-600 text-white shadow-sm font-semibold'
                          : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm font-semibold'
                        : item.danger
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'opacity-100'
                            : item.danger
                            ? 'text-red-500'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && !item.danger && (
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

            {/* Quick Session Card in Sidebar */}
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} profile={profile} avatarIcon={avatarIcon} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white truncate font-sans">
                    {displayName || 'DocStudio User'}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
                    {user?.email}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-900 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 uppercase font-sans">Session Active</span>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-[11px] font-sans text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Main Content Pane */}
          <main className="flex-1 min-w-0 w-full space-y-6">

            {/* TAB 1: Profile & Identity */}
            {activeTab === 'profile' && (
              <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none animate-fadeIn">
                
                {/* Header row: Live Avatar Hero + Identity */}
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
                        <span className="uppercase text-[10px] font-bold text-neutral-400 dark:text-neutral-500">UID:</span>
                        <span className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 border border-neutral-200 dark:border-neutral-800 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 rounded flex items-center gap-1.5">
                          <span>{user?.uid}</span>
                          <button
                            type="button"
                            onClick={handleCopyUid}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            title="Copy UID"
                          >
                            {copiedUid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
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
                  /* 1. VIEW MODE (Default Clean Preview) */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-neutral-900 dark:text-white">
                          Personal Information
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          Your public profile information and contact anchors.
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

                      {/* Bio / Role */}
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Role / About</span>
                        </div>
                        <p
                          className={`text-sm font-sans ${
                            bio
                              ? 'font-bold text-neutral-950 dark:text-white'
                              : 'text-neutral-400 italic'
                          }`}
                        >
                          {bio || 'Not specified'}
                        </p>
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
                          Update your personal information below.
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

                    {/* Form Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Full Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Docdril User"
                        required
                      />

                      {/* Email Address is STRICTLY READ-ONLY and NON-EDITABLE */}
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        helperText="Optional for notifications and security recovery"
                      />

                      <div>
                        <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                          About You / Role
                        </label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Founder, Creative Director, Developer..."
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-neutral-950 dark:focus:border-white bg-white dark:bg-neutral-900/90 px-3.5 py-2.5 text-sm font-sans text-neutral-900 dark:text-white focus:outline-none transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-900">
                      <Button type="submit" variant="primary" size="md" isLoading={profileSaving}>
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

            {/* TAB 2: Subscriptions & Quota */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Credit Summary Card */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                          Generation Credits Vault
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                        Shared balance across all Docdril creative pipelines and document engines.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedPack(CREDIT_PACKS[1]); // Default to popular 500 pack
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

                  {/* Big Number & Progress */}
                  <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 space-y-3">
                    <div className="flex items-baseline justify-between">
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

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${totalCreditsPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Software Suites Status List */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Active Software Subscriptions
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Your entitlement tiers and feature allowances across each Docdril product.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Canvas */}
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4">
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
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4">
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
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4">
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

                {/* Credit Packs Quick Buy */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Top-Up Extra Credits On Demand
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Need more credits right now? Extra credits never expire and roll over indefinitely.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CREDIT_PACKS.map((pack) => (
                      <div
                        key={pack.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
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

            {/* TAB 3: Security & Password */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Authentication Provider Card */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                        Authentication Provider
                      </h3>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {isGoogleUser ? 'Google SSO' : 'Email & Password'}
                    </span>
                  </div>

                  {isGoogleUser ? (
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                            Signed in via Google Single Sign-On
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                            Your password and 2-step verification are encrypted and managed directly by Google.
                          </p>
                        </div>
                      </div>

                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors shrink-0"
                      >
                        <span>Manage Google Security</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">
                          Standard Email & Password
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                          Primary credentials anchored to {user?.email} with custom password encryption.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* In-App Password Change (For Password Users) */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
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
                      {/* Current Password */}
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

                      {/* New Password */}
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

                      {/* Confirm New Password */}
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
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-sans space-y-2">
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

                {/* Session Security */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-4">
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

                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-sans">
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
              </div>
            )}

            {/* TAB 4: Preferences & Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Theme Selector Card */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
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

                {/* Notifications & Alert Settings */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
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

                {/* Regional & Currency Info */}
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Localization & Currencies
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                    DocStudio supports dual currency transparent pricing:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">Indian Rupee (INR ₹)</p>
                      <p className="text-[11px] text-neutral-500 font-sans mt-0.5">Primary domestic pricing (₹499 Pro / ₹999 Ultra)</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-950 dark:text-white font-sans">US Dollar (USD $)</p>
                      <p className="text-[11px] text-neutral-500 font-sans mt-0.5">International side-by-side ($6 Pro / $12 Ultra)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Terms & Policies */}
            {activeTab === 'legal' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Terms of Service & Licensing
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Clear, creator-friendly governance and intellectual property ownership rules.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-sans text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">1. 100% Creator Ownership</h4>
                      <p>
                        You retain 100% intellectual property ownership of all artwork, motion sequences, artboards, vectors, and documents generated on DocStudio. We claim zero rights or ownership over your creative output.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">2. Acceptable Use & Fair Access</h4>
                      <p>
                        You agree to use DocStudio tools in compliance with all relevant laws. Automated scraping, reverse-engineering of cloud rendering engines, or attempting to exploit credit quotas violates our service terms.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">3. Commercial Rights</h4>
                      <p>
                        Assets rendered under DocStudio Pro and Ultra subscriptions are eligible for commercial use, client distribution, video production, and commercial publishing without royalty obligations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm dark:shadow-none space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-neutral-950 dark:text-white">
                      Privacy Policy & GDPR Compliance
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                      Strict data protection protocols and cryptographic anti-abuse architecture.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-sans text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">Zero Third-Party Data Selling</h4>
                      <p>
                        DocStudio never sells, brokers, or monetizes personal data. Your email, phone, and project parameters remain confidential and encrypted in transit (TLS 1.3) and at rest (AES-256).
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <h4 className="font-bold text-neutral-950 dark:text-white">Right to Erasure & Anti-Abuse Tombstones</h4>
                      <p>
                        Under GDPR Right to Erasure, deleting your account wipes all profile records, subscription histories, and cloud projects. To protect system infrastructure from spam recreate-and-exploit attacks, an irreversible cryptographic SHA-256 hash of your identity is recorded. This prevents re-claiming initial free welcome credits while keeping zero personal data on disk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 sm:p-8 rounded-3xl border border-red-300 dark:border-red-950/80 bg-red-50/40 dark:bg-red-950/20 backdrop-blur-xl space-y-6">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wider font-sans">
                        Danger Zone • Complete Account Deletion
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans mt-0.5">
                        Permanent, irreversible deletion of your DocStudio user records and assets.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/70 border border-red-200 dark:border-red-900/50 space-y-3 text-xs font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    <p className="font-bold text-red-600 dark:text-red-400 uppercase tracking-wider text-[11px]">
                      Please read carefully before proceeding:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
                      <li>Your user profile, name, phone, bio, and avatar preferences will be purged immediately.</li>
                      <li>Active subscriptions for Docdril Canvas, Motion, and Flow will be terminated.</li>
                      <li>Any remaining balance of generation credits will be forfeited immediately.</li>
                      <li>
                        A GDPR-compliant irreversible SHA-256 fingerprint is recorded in the anti-abuse tombstone registry. If you re-register with this email later, initial free welcome credits cannot be re-claimed.
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account & Wipe All Data</span>
                    </Button>
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
          onSuccess={handleTopUpSuccess}
        />

      </div>
    </ProtectedRoute>
  );
}
