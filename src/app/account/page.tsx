'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AvatarEditModal } from '@/components/ui/AvatarEditModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  KeyRound,
  Shield,
  LogOut,
  CheckCircle,
  AlertCircle,
  Camera,
  Pencil,
} from 'lucide-react';

export default function AccountPage() {
  const { user, profile, updateProfileDetails, resetPassword, signOut, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<string | null>('User');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
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
            Manage your personal profile, contact information, and avatar identity.
          </p>
        </div>

        {error && (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs font-sans flex items-center gap-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-8 rounded-xl backdrop-blur-xl shadow-sm dark:shadow-none">
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

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Piyush Chaudhary"
                required
              />

              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Primary email tied to your central account"
              />
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

            <div className="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-900">
              <Button type="submit" variant="primary" size="md" isLoading={profileSaving}>
                Save Profile Details
              </Button>
              {profileSuccess && (
                <span className="font-sans text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Profile updated successfully
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security & Password */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-8 space-y-4 rounded-xl backdrop-blur-xl shadow-sm dark:shadow-none">
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

        {/* Sign Out */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-neutral-500 font-sans">
            Sign out of your DocStudio session on this device.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>

        {/* Avatar Selection Modal (Shown ONLY when user clicks to edit/change avatar) */}
        <AvatarEditModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentIcon={avatarIcon}
          user={user}
          profile={profile}
          onSave={handleSaveAvatar}
        />
      </div>
    </ProtectedRoute>
  );
}
