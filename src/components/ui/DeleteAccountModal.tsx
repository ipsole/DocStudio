'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed =
    confirmationText.trim().toLowerCase() === userEmail.trim().toLowerCase() ||
    confirmationText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirmDelete();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('requires-recent-login')) {
        setError(
          'For security, deleting your account requires a recent sign-in. Please sign out and sign in again, then retry.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
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
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-neutral-950 border border-red-200 dark:border-red-950/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-neutral-900 dark:text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-sans tracking-tight text-neutral-950 dark:text-white">
                Delete Account & Wipe Data
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                Permanent and irreversible action
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

        {/* Warning Callout */}
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2 text-xs font-sans text-red-900 dark:text-red-300">
          <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This action cannot be undone.</span>
          </div>
          <p className="leading-relaxed">
            All your profile details, subscriptions across Canvas, Motion & Flow, and generation credit balances will be permanently deleted.
          </p>
          <div className="pt-1 flex items-start gap-1.5 text-[11px] text-red-800 dark:text-red-400/90">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Anti-Abuse Safeguard:</strong> A cryptographic identity hash will be retained to prevent re-claiming free welcome credits if an account is registered again with this email or Google identity.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-sans leading-relaxed">
            {error}
          </div>
        )}

        {/* Confirmation Input */}
        <div className="space-y-2 font-sans">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            To confirm deletion, please type <span className="font-mono font-bold text-neutral-950 dark:text-white select-all">{userEmail}</span> or <span className="font-mono font-bold text-neutral-950 dark:text-white">DELETE</span>:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={loading}
            placeholder={userEmail}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          />
        </div>

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
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Wiping Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
