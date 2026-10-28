'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(fbErr.message || 'Failed to send reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          Reset Password
        </h2>
        <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
          Enter your registered email to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 p-8 sm:p-10 space-y-6 rounded-xl shadow-xl dark:shadow-2xl backdrop-blur-xl text-neutral-900 dark:text-white">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-950 dark:text-white font-sans uppercase tracking-tight">
                Reset Link Sent
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                If an account exists for <span className="font-semibold text-neutral-950 dark:text-white">{email}</span>,
                you will receive password reset instructions shortly.
              </p>
              <div className="pt-4">
                <Link href="/sign-in">
                  <Button variant="primary" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 font-sans text-xs flex items-center gap-2 rounded">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <Input
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@docdril.com"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={loading}
                disabled={loading || !isConfigured}
              >
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/sign-in"
                  className="font-sans text-xs text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
