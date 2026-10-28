'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Boxes, AlertCircle, Loader2 } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      router.push(redirectPath);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (
        fbErr.code === 'auth/invalid-credential' ||
        fbErr.code === 'auth/wrong-password' ||
        fbErr.code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (fbErr.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again in a few minutes.');
      } else {
        setError(fbErr.message || 'An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
      {!isConfigured && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs leading-relaxed">
          <strong>Notice:</strong> Firebase configuration is pending in <code className="font-mono">.env.local</code>. Please populate the credentials from the <code className="font-mono">software-business</code> Firebase project.
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={loading}
          disabled={loading || !isConfigured}
        >
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        Don&apos;t have an account yet?{' '}
        <Link href="/sign-up" className="font-semibold text-blue-600 hover:text-blue-700">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">DocStore</span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access your unified Docdril software dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white py-12 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">Loading sign in...</p>
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
