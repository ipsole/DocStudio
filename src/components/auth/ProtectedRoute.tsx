'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && isConfigured) {
      router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname, isConfigured]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <p className="text-sm text-slate-500 font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span>⚠️</span> Firebase Configuration Needed
        </h3>
        <p className="mt-2 text-sm text-amber-800">
          Firebase credentials are not yet configured in <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>.
          Please configure your Firebase credentials from the <code className="font-mono">software-business</code> Firebase Console to enable authentication.
        </p>
        <div className="mt-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-slate-600 font-medium">Please sign in to access this page.</p>
        <Link href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}>
          <Button variant="primary">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          This area is restricted to DocStore platform administrators. Your account (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">{user.email}</code>) does not currently have administrative privileges.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
