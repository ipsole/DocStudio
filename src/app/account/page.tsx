'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  KeyRound,
  Shield,
  CreditCard,
  LogOut,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function AccountPage() {
  const { user, profile, updateName, resetPassword, signOut, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setNameSaving(true);
    setError(null);
    try {
      await updateName(displayName.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setNameSaving(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Header */}
        <div className="border-b border-neutral-950 pb-6">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
            CENTRAL IDENTITY MANAGEMENT
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
            Account Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-sans">
            Manage your personal profile and Docdril central identity settings.
          </p>
        </div>

        {error && (
          <div className="p-4 border border-red-500 bg-red-50 text-red-700 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Details Card */}
        <div className="border border-neutral-950 bg-white p-6 sm:p-8 space-y-8 rounded-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-neutral-200">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-neutral-950 text-white flex items-center justify-center text-xl font-sans font-bold select-none">
                {profile?.displayName?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  'U'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold tracking-[-0.02em] text-neutral-950 font-sans">
                    {profile?.displayName || 'Docdril User'}
                  </h2>
                  {isAdmin && (
                    <Badge variant="info">
                      <Shield className="w-3 h-3" />
                      ADMIN
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-2 font-sans">
                  <span className="uppercase text-[11px] font-semibold text-neutral-400">UID:</span>
                  <span className="bg-neutral-100 px-2 py-0.5 border border-neutral-200 font-mono text-[11px] select-all">
                    {user?.uid}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-sans font-semibold">
              STATUS: <span className="text-emerald-700 font-bold">VERIFIED</span>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-5 max-w-xl">
            <div>
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Primary email linked to your Docdril central account"
              />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Button type="submit" variant="primary" size="md" isLoading={nameSaving}>
                Save Changes
              </Button>
              {nameSuccess && (
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved successfully
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security & Password */}
        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-4 rounded-none">
          <div className="flex items-center gap-2 text-neutral-950">
            <KeyRound className="w-4 h-4" />
            <h3 className="font-sans text-xs uppercase tracking-wider font-bold">
              Security & Credentials
            </h3>
          </div>
          <p className="text-xs text-neutral-600 font-sans leading-relaxed">
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
              <span className="font-sans text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Reset link sent to {user?.email}
              </span>
            )}
          </div>
        </div>

        {/* Billing & Subscriptions Preparation */}
        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-3 rounded-none">
          <div className="flex items-center gap-2 text-neutral-950">
            <CreditCard className="w-4 h-4" />
            <h3 className="font-sans text-xs uppercase tracking-wider font-bold">
              Billing & Subscriptions
            </h3>
          </div>
          <p className="text-xs text-neutral-600 font-sans leading-relaxed">
            Centralized billing and software subscriptions will be managed here once the payment
            and checkout system is established. No active payment methods or recurring charges currently
            exist on your account.
          </p>
        </div>

        {/* Sign Out */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs uppercase tracking-wider text-neutral-400 font-sans">
            Sign out of your DocStore session on this device.
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
      </div>
    </ProtectedRoute>
  );
}
