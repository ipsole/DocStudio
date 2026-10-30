'use client';

import React, { useState } from 'react';
import { PauseCircle, X, Loader2, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  hasPassword?: boolean;
  onConfirmDeactivate: (password?: string) => Promise<void>;
}

export function DeactivateAccountModal({
  isOpen,
  onClose,
  userEmail,
  hasPassword = true,
  onConfirmDeactivate,
}: DeactivateAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTextConfirmed =
    confirmationText.trim().toUpperCase() === 'DEACTIVATE' ||
    confirmationText.trim().toLowerCase() === userEmail.trim().toLowerCase();

  const isPasswordReady = !hasPassword || password.trim().length > 0;
  const canSubmit = isTextConfirmed && isPasswordReady;

  const handleDeactivate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirmDeactivate(hasPassword ? password : undefined);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('requires-recent-login')) {
        setError(
          'For security, deactivating your account requires a recent sign-in. Please sign out and sign in again, then retry.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Failed to deactivate account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-neutral-950 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-neutral-900 dark:text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-sans tracking-tight text-neutral-950 dark:text-white">
                Deactivate Account
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                Temporary pause • Reactivate anytime
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs font-sans text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Your data and active subscriptions are preserved safely.</span>
          </div>
          <p className="leading-relaxed">
            Deactivating will immediately sign you out and hide your public profile across the Docdril ecosystem. Your projects, generation credit balances, and active subscriptions remain safe and will be instantly restored when you log back in.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-sans leading-relaxed">
            {error}
          </div>
        )}

        {/* Confirmation Text Input */}
        <div className="space-y-2 font-sans">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            To confirm deactivation, please type <span className="font-mono font-bold text-neutral-950 dark:text-white">DEACTIVATE</span>:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={loading}
            placeholder="DEACTIVATE"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Password Verification (Required when user has a password) */}
        {hasPassword ? (
          <div className="space-y-2 font-sans">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Enter your account password to authorize:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Account password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-sans flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
            <span>Authenticated via Google Single Sign-On ({userEmail}).</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDeactivate}
            disabled={!canSubmit || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deactivating...</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Deactivate Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
