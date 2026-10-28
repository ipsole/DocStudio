'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AvatarEditModal } from '@/components/ui/AvatarEditModal';
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  KeyRound,
  Shield,
  LogOut,
  CheckCircle,
  AlertCircle,
  Camera,
  Pencil,
  Lock,
  Mail,
  Phone,
  User as UserIconLucide,
  Briefcase,
  Trash2,
  X,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    profile,
    updateProfileDetails,
    resetPassword,
    signOut,
    deleteAccount,
    isAdmin,
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<string | null>('User');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSaveAvatar = async (newIcon: string) => {
    setAvatarIcon(newIcon);
    await updateProfileDetails({ avatarIcon: newIcon });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || user?.displayName || '');
    setPhoneNumber(profile?.phoneNumber || '');
    setBio(profile?.bio || '');
    setIsEditing(false);
    setError(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    await deleteAccount();
    router.push('/');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setError(null);
    try {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-neutral-900 dark:text-white transition-colors duration-200">
        {/* Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-900 pb-6">
          <div className="font-sans text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
            DocStudio Identity
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-sans">
            Account Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Manage your personal profile, credentials, and account lifecycle.
          </p>
        </div>

        {error && (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs font-sans flex items-center gap-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-sans flex items-center gap-2 rounded-lg animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Profile details updated successfully.</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-2xl backdrop-blur-xl shadow-sm dark:shadow-none">
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
                  <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
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
                  <span className="uppercase text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">UID:</span>
                  <span className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 border border-neutral-200 dark:border-neutral-800 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 select-all rounded">
                    {user?.uid}
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

            <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans font-semibold">
              STATUS: <span className="text-emerald-600 dark:text-emerald-400 font-bold">VERIFIED</span>
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
                    Your account identity and contact profile.
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
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                    <UserIconLucide className="w-3.5 h-3.5" />
                    <span>Full Name</span>
                  </div>
                  <p className="text-sm font-bold text-neutral-950 dark:text-white font-sans">
                    {displayName || 'DocStudio User'}
                  </p>
                </div>

                {/* Email Address (Immutable) */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Address</span>
                    </div>
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
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
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
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
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
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
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans flex items-center gap-1">
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

        {/* Security & Password */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-4 rounded-2xl backdrop-blur-xl shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 text-neutral-950 dark:text-white">
            <KeyRound className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            <h3 className="font-sans text-xs uppercase tracking-wider font-bold">
              Security & Credentials
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
            Send a secure password reset link to your registered email address to change your password.
          </p>
          <div className="pt-2 flex items-center gap-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePasswordReset}
              disabled={resetSent}
            >
              Send Password Reset Link
            </Button>
            {resetSent && (
              <span className="font-sans text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Reset link sent to {user?.email}
              </span>
            )}
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="border border-red-200 dark:border-red-950/80 bg-red-50/30 dark:bg-red-950/20 p-6 sm:p-8 space-y-4 rounded-2xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-sans text-xs uppercase tracking-wider font-bold">
              Danger Zone • Complete Account Deletion
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
            Permanently delete your DocStudio account, terminate all creative software subscriptions, and wipe stored personal records. Anti-abuse cryptographic hashing prevents reclaiming new free welcome credits upon re-registration.
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account & Wipe Data</span>
            </Button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-neutral-500 font-sans">
            Sign out of your DocStudio session on this device.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
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
      </div>
    </ProtectedRoute>
  );
}
