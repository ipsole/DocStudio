'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  getPublicApps,
  getUserEntitlements,
  getUserSubscriptions,
  ensureDefaultUserSubscriptions,
} from '@/lib/firebase/db';
import { DocApp, Entitlement, AppSubscription } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  ArrowRight,
  Info,
  Clock,
  Zap,
  Code,
  Globe,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [catalogApps, userEnts, userSubs] = await Promise.all([
          getPublicApps(),
          getUserEntitlements(user.uid),
          ensureDefaultUserSubscriptions(user.uid, user.email || ''),
        ]);
        setApps(catalogApps);
        setEntitlements(userEnts);
        setSubscriptions(userSubs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleCreditsUpdated = (appId: string, newRemaining: number) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.appId === appId ? { ...s, creditsRemaining: newRemaining } : s))
    );
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const exampleVerifyCode = `// In your Subdomain App (e.g., canvas.docdril.com or motion.docdril.com)
// 1. Verify User Session & Check Credits:
const res = await fetch('https://studio.docdril.com/api/v1/auth/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${userFirebaseIdToken}\`
  },
  body: JSON.stringify({
    appId: 'demo-canvas' // your product identifier
  })
});
const { hasAccess, subscription } = await res.json();
console.log("Remaining Generations:", subscription.creditsRemaining);

// 2. Consume Credits when user generates content:
const consume = await fetch('https://studio.docdril.com/api/v1/credits/consume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.uid,
    appId: 'demo-canvas',
    amount: 1, // number of credits
    action: 'ai_artboard_generation'
  })
});
const result = await consume.json();
if (!result.success && result.error === 'INSUFFICIENT_CREDITS') {
  alert("Out of credits! Redirecting to upgrade...");
  window.location.href = result.upgradeUrl;
}`;

  return (
    <ProtectedRoute>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-12">
        {/* Welcome Header */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-xl shadow-sm dark:shadow-xl transition-colors">
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              CENTRAL ACCOUNT ACTIVE
            </div>
            <h1 className="text-2xl sm:text-4xl font-light tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans leading-none">
              Welcome back,{' '}
              <span className="font-bold text-neutral-950 dark:text-white">
                {profile?.displayName || user?.displayName || user?.email?.split('@')[0]}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
              Manage your connected software subscriptions, monitor generation credits, and launch apps across subdomains.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/account">
              <Button variant="secondary" size="sm" className="gap-2">
                <Settings className="w-3.5 h-3.5" />
                Account Settings
              </Button>
            </Link>
            <Link href="/apps">
              <Button variant="primary" size="sm" className="gap-2">
                Catalog & Products
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: Active Product Subscriptions & Live Credit Quotas */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                MULTI-PRODUCT USAGE
              </div>
              <h2 className="text-2xl font-light tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans">
                Product Subscriptions & Generation Quotas
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Centralized balance shared with subdomain applications
            </p>
          </div>

          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((sub) => {
                const app = apps.find((a) => a.id === sub.appId);
                return (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    app={app}
                    onCreditsUpdated={handleCreditsUpdated}
                  />
                );
              })}
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-8 text-center space-y-3 rounded-xl shadow-sm">
              <Zap className="w-8 h-8 mx-auto text-neutral-400 dark:text-neutral-500" />
              <h3 className="font-bold uppercase tracking-tight text-neutral-950 dark:text-white text-sm">
                No active subscriptions yet
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                Explore our catalog to subscribe to Docdril tools and unlock monthly generation allowances.
              </p>
              <Link href="/apps">
                <Button variant="primary" size="sm" className="mt-2">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Section 2: Developer Subdomain API Hub */}
        <section className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
          <div
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="p-6 cursor-pointer flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
                  Subdomain Single Sign-On & Central Verification API
                </h3>
                <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  How <code className="text-neutral-900 dark:text-neutral-200">canvas.docdril.com</code>, <code className="text-neutral-900 dark:text-neutral-200">motion.docdril.com</code>, & future subdomains authenticate & deduct credits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-neutral-500 dark:text-neutral-400">
              <span>{showApiDocs ? 'Hide Integration Guide' : 'View Integration Guide'}</span>
              {showApiDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showApiDocs && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 bg-neutral-50/50 dark:bg-neutral-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans text-neutral-700 dark:text-neutral-300">
                <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 rounded-lg space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                    ENDPOINT 1: SESSION & BALANCE CHECK
                  </span>
                  <div className="font-mono font-semibold text-neutral-950 dark:text-white">
                    POST /api/v1/auth/verify
                  </div>
                  <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Subdomain apps send the user ID or Bearer ID Token to verify access. Returns user identity, plan status, and remaining generation credits.
                  </p>
                </div>

                <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 rounded-lg space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                    ENDPOINT 2: ATOMIC CREDIT CONSUMPTION
                  </span>
                  <div className="font-mono font-semibold text-neutral-950 dark:text-white">
                    POST /api/v1/credits/consume
                  </div>
                  <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Whenever a user generates in a subdomain tool, calls this to decrement credits atomically. Returns 402 Insufficient Credits if quota exhausted.
                  </p>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative border border-neutral-300 dark:border-neutral-800 bg-neutral-900 dark:bg-black text-neutral-100 dark:text-neutral-200 p-5 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                <button
                  type="button"
                  onClick={() => copyCode(exampleVerifyCode)}
                  className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded"
                >
                  {copiedSnippet ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
                </button>
                <pre>{exampleVerifyCode}</pre>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: All Software Tools in Catalog */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                DOCDRIL PLATFORM
              </div>
              <h2 className="text-2xl font-light tracking-[-0.03em] uppercase text-neutral-950 dark:text-white font-sans">
                Software Ecosystem
              </h2>
            </div>
            <Link
              href="/apps"
              className="text-xs font-semibold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white font-sans uppercase tracking-wider inline-flex items-center gap-1 transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
