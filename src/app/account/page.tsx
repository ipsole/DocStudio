'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  User,
  Mail,
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal profile and Docdril central identity settings.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              {profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {profile?.displayName || 'Docdril User'}
                </h2>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    <Shield className="w-3 h-3" />
                    Administrator
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {user?.uid}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
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
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={nameSaving}>
                Save Changes
              </Button>
              {nameSuccess && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved successfully
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security & Password */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Security & Credentials</h3>
          </div>
          <p className="text-xs text-slate-500">
            Send a secure password reset link to your registered email address to change your password.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={resetSent}
            >
              Send Password Reset Email
            </Button>
            {resetSent && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Reset link sent to {user?.email}
              </span>
            )}
          </div>
        </div>

        {/* Billing & Subscriptions Preparation */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Billing & Invoices</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Centralized billing and software subscriptions will be accessible here once the payment
            and checkout system is established. No active payment methods or recurring charges exist
            on your account.
          </p>
        </div>

        {/* Sign Out */}
        <div className="pt-4 flex justify-between items-center border-t border-slate-200">
          <p className="text-xs text-slate-400">Sign out of DocStore on this device.</p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
