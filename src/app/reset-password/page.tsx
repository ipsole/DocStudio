'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { auth } from '@/lib/firebase/client';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { AlertCircle, CheckCircle, Lock, ArrowLeft, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [verifying, setVerifying] = useState(true);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      setVerificationError('No reset authorization code found. Please request a new password reset link.');
      return;
    }

    if (!auth) {
      setVerifying(false);
      setVerificationError('Authentication client is not initialized.');
      return;
    }

    let isMounted = true;
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        if (isMounted) {
          setTargetEmail(email);
          setVerifying(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setVerifying(false);
          const fbErr = err as { code?: string; message?: string };
          if (fbErr.code === 'auth/expired-action-code') {
            setVerificationError('This password reset link has expired. Please request a new one.');
          } else if (fbErr.code === 'auth/invalid-action-code') {
            setVerificationError('This password reset link is invalid or has already been used.');
          } else {
            setVerificationError(fbErr.message || 'Failed to verify reset link.');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }

    if (!oobCode || !auth) {
      setSubmitError('Invalid session. Please request a new reset link.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/weak-password') {
        setSubmitError('Password is too weak. Please choose a stronger password.');
      } else {
        setSubmitError(fbErr.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 p-8 sm:p-10 space-y-6 rounded-xl shadow-xl dark:shadow-2xl backdrop-blur-xl text-neutral-900 dark:text-white">
      {verifying && (
        <div className="py-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-900 dark:text-white" />
          <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
            Verifying security token...
          </p>
        </div>
      )}

      {!verifying && verificationError && (
        <div className="space-y-6 text-center">
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 font-sans text-xs flex items-center justify-center gap-2 rounded">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verificationError}</span>
          </div>
          <div className="pt-2">
            <Link href="/forgot-password">
              <Button variant="primary" className="w-full">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!verifying && !verificationError && success && (
        <div className="text-center space-y-5">
          <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-950 dark:text-white font-sans uppercase tracking-tight">
              Password Changed Successfully
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
              Your credentials have been updated. You can now sign in with your new password.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/sign-in">
              <Button variant="primary" className="w-full">
                Sign In to DocStudio
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!verifying && !verificationError && !success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {targetEmail && (
            <div className="p-3 bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs font-sans text-neutral-600 dark:text-neutral-400 rounded">
              Resetting password for <span className="font-semibold text-neutral-950 dark:text-white">{targetEmail}</span>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 font-sans text-xs flex items-center gap-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="New Password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-4"
            isLoading={submitting}
          >
            Update Password
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/sign-in"
              className="font-sans text-xs text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel & Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-16 sm:px-6 lg:px-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <DocdrilLogo size={32} className="text-neutral-950 dark:text-white" />
          <span className="font-bold text-2xl tracking-tight text-neutral-950 dark:text-white font-sans">
            DocStudio
          </span>
        </Link>
        <h2 className="text-3xl font-light tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans">
          Set New Password
        </h2>
        <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
          Enter a secure password for your DocStudio account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-12 text-center rounded-xl shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-900 dark:text-white" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
