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
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
          Verifying identity session...
        </p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 border border-neutral-800 bg-neutral-950/80 rounded-xl space-y-4 text-white">
        <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-white">
          Firebase Configuration Notice
        </h3>
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          Firebase credentials are not fully populated in <code className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 font-mono rounded">.env.local</code>.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="secondary" size="sm">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
          Authentication required to access this resource
        </p>
        <Link href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}>
          <Button variant="primary">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 text-center bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-4 text-white shadow-2xl">
        <div className="w-12 h-12 border border-neutral-700 bg-neutral-900 text-amber-400 rounded-full mx-auto flex items-center justify-center mb-2">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-mono text-sm uppercase tracking-wider font-bold text-white">
          Access Restricted
        </h2>
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          This portal is reserved for DocStore platform administrators. Your account (<code className="font-mono text-[11px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">{user.email}</code>) does not hold administrative authorization.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="primary" size="sm">
              User Dashboard
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
