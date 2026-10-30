'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getClientDeviceInfo } from '@/lib/device/deviceInfo';
import { syncDeviceSession } from '@/lib/firebase/db';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight, Smartphone, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function QuickLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const username = searchParams.get('u');

  const [status, setStatus] = useState<'idle' | 'authorizing' | 'success' | 'error'>('authorizing');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing login token. Please scan the QR code again.');
      return;
    }

    let isMounted = true;

    async function authorize() {
      try {
        const deviceInfo = getClientDeviceInfo();

        // 1. Fetch geo location
        let location = 'Online Session';
        try {
          const geoRes = await fetch('/api/auth/geo');
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.location) location = geoData.location;
          }
        } catch {
          // non-critical
        }

        // 2. Redeem token
        const res = await fetch('/api/auth/qr/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            device: {
              ...deviceInfo,
              location,
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to authenticate QR session.');
        }

        if (!isMounted) return;

        setUserEmail(data.email || '');

        // 3. Client sign-in with Firebase Custom Token
        if (auth && data.customToken) {
          const userCredential = await signInWithCustomToken(auth, data.customToken);
          const user = userCredential.user;

          // 4. Register this new device session in Firestore
          await syncDeviceSession(user.uid, {
            id: deviceInfo.sessionId,
            deviceName: deviceInfo.deviceName,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            location,
          });
        }

        setStatus('success');

        // Redirect after brief celebration
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Authorization failed. Please try again.');
      }
    }

    authorize();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center font-sans space-y-6">
      {/* Brand Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-wide">
          DocStudio
        </h1>
        <p className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-sans">
          by Docdril™ • Instant QR Login
        </p>
      </div>

      {/* State Rendering */}
      {status === 'authorizing' && (
        <div className="space-y-4 py-6">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-white animate-spin" />
            <Smartphone className="w-6 h-6 text-neutral-500 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              Authorizing your session...
            </p>
            {username && (
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Connecting as @{username}
              </p>
            )}
            <p className="text-[11px] text-neutral-400 mt-2">
              Validating one-time security handshake on docstudio.docdril.com
            </p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Login Approved!
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Welcome back {username ? `@${username}` : userEmail}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              Redirecting to your DocStudio dashboard...
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 py-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Unable to Complete QR Login
            </h2>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 px-4">
              {errorMessage}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="button"
              variant="primary"
              className="w-full gap-1.5"
              onClick={() => router.push('/sign-in')}
            >
              <span>Sign In Manually</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
        <span>docstudio.docdril.com</span>
        <span>TLS 1.3 Encrypted</span>
      </div>
    </div>
  );
}

export default function QuickLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black px-4 py-12 transition-colors">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            <p className="text-xs text-neutral-500 font-sans">Connecting to DocStudio...</p>
          </div>
        }
      >
        <QuickLoginContent />
      </Suspense>
    </div>
  );
}
