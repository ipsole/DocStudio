'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { LoginWelcomeWriter } from '@/components/ui/LoginWelcomeWriter';
import { GuidedTour } from '@/components/ui/GuidedTour';
import {
  getPublicApps,
  getUserEntitlements,
  getUserSubscriptions,
  ensureDefaultUserSubscriptions,
} from '@/lib/firebase/db';
import { DocApp, Entitlement, AppSubscription } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import {
  Settings,
  ArrowRight,
  Zap,
  Sparkles,
  Globe,
  ShieldCheck,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Shield,
  Layers,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showTour, setShowTour] = useState(false);

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

  // Compute total credits across active subscriptions
  const totalCreditsRemaining = subscriptions.reduce(
    (acc, sub) => acc + (sub.creditsRemaining || 0),
    0
  );
  const totalCreditsMax = subscriptions.reduce(
    (acc, sub) => acc + (sub.creditsTotal || 0),
    0
  );

  const filteredApps = apps.filter((app) => {
    if (selectedCategory === 'all') return true;
    return app.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const userName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Creator';

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
      {/* First-Time Account Creation Onboarding Sequence */}
      <LoginWelcomeWriter
        onComplete={() => {
          try {
            const tourSeen = localStorage.getItem('docstudio_tour_completed');
            if (!tourSeen) {
              setShowTour(true);
            }
          } catch {
            // ignore
          }
        }}
      />

      {/* Skippable Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* 1. Cinematic Hero Header with Clean Logo & Luxury Typography */}
        <div className="animate-fade-in-up flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200/80 dark:border-neutral-900">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Pure, clean vector logo mark */}
            <div className="relative shrink-0 pt-0.5">
              <DocdrilLogo size={42} className="text-neutral-950 dark:text-white transition-transform hover:scale-105" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-[0.01em] text-neutral-950 dark:text-white leading-tight">
                Welcome, <span className="italic">{userName}</span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans max-w-xl">
                Your single-sign-on identity is active across the Docdril software suite. Monitor generation credits, launch creative tools, and manage subscription quotas.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Pills */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all shadow-sm active:scale-[0.98]"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500" />
              <span>Settings & Avatar</span>
            </Link>

            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-xs font-semibold transition-all shadow-md active:scale-[0.98]"
            >
              <span>Software Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-900 dark:text-white hover:opacity-90 transition-opacity"
              >
                <Shield className="w-3.5 h-3.5 text-neutral-500" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>

        {/* 2. Metrics & Access Ribbon (3 Sleek Floating Cards) */}
        <div id="tour-quota-card" className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 animate-fade-in-up animation-delay-100">
          {/* Card 1: Available Generation Credits */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Generation Quota
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-neutral-950 dark:text-white">
                  {subscriptions.length > 0 ? totalCreditsRemaining : '100'}
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  / {subscriptions.length > 0 ? totalCreditsMax : '100'} Monthly Credits
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Shared automatically with Canvas, Motion, and Document Pipelines.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Quota Healthy
              </span>
              <Link
                href="/pricing"
                className="text-neutral-900 dark:text-white font-medium hover:underline text-[11px]"
              >
                Upgrade Plan →
              </Link>
            </div>
          </div>

          {/* Card 2: Connected Subdomain Mesh */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Subdomain Mesh
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-neutral-950 dark:text-white">
                3 Subdomains
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                canvas • motion • pipeline (.docdril.com)
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Single Sign-On
              </span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                ● Synchronized
              </span>
            </div>
          </div>

          {/* Card 3: Studio Pass Tier */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Studio Identity
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white truncate">
                DocStudio Pro Pass
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate font-mono">
                {user?.email}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs">
              <span className="text-neutral-600 dark:text-neutral-400">Account Status</span>
              <span className="font-bold text-neutral-950 dark:text-white uppercase font-mono text-[10px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded">
                Active Member
              </span>
            </div>
          </div>
        </div>

        {/* 3. Direct Software Launchpad */}
        <section id="tour-launchpad" className="space-y-6 animate-fade-in-up animation-delay-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-neutral-200/80 dark:border-neutral-900">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                CONNECTED ECOSYSTEM
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white">
                Launch Software Suites
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Suites' },
                { id: 'creative', label: 'Creative' },
                { id: 'animation', label: 'Animation' },
                { id: 'productivity', label: 'Productivity' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} showLaunchDirect={true} />
            ))}
          </div>
        </section>

        {/* 4. Active Subscriptions & Quota Controls */}
        <section className="space-y-6 animate-fade-in-up animation-delay-300">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-2 border-b border-neutral-200/80 dark:border-neutral-900 gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                GENERATION ALLOCATIONS
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white">
                Active Subscriptions & Quotas
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Atomic credit consumption synchronized across all tools
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
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/60 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-bold text-base text-neutral-950 dark:text-white">
                  Starter Pass Active
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Your central account is provisioned with starter monthly generation credits. Upgrade to Docdril Pro for unlimited high-priority exports.
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <span>View Pro Subscriptions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* 5. Subdomain Developer Hub & Integration Guide */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl overflow-hidden shadow-sm animate-fade-in-up animation-delay-400">
          <div
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="p-5 sm:p-6 cursor-pointer flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-neutral-950 dark:text-white">
                  Subdomain Single Sign-On & Credit Verification API
                </h3>
                <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  How <code className="text-neutral-900 dark:text-neutral-200">canvas.docdril.com</code>, <code className="text-neutral-900 dark:text-neutral-200">motion.docdril.com</code>, & future apps authenticate & deduct credits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-neutral-500 dark:text-neutral-400">
              <span className="hidden sm:inline">
                {showApiDocs ? 'Hide Integration Guide' : 'View Integration Guide'}
              </span>
              {showApiDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showApiDocs && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 bg-neutral-50/40 dark:bg-neutral-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans text-neutral-700 dark:text-neutral-300">
                <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 rounded-xl space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                    ENDPOINT 1: SESSION & BALANCE CHECK
                  </span>
                  <div className="font-mono font-semibold text-neutral-950 dark:text-white">
                    POST /api/v1/auth/verify
                  </div>
                  <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Subdomain apps send the user Bearer ID Token to verify access. Returns user identity, plan status, and remaining generation credits.
                  </p>
                </div>

                <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 rounded-xl space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-400">
                    ENDPOINT 2: ATOMIC CREDIT CONSUMPTION
                  </span>
                  <div className="font-mono font-semibold text-neutral-950 dark:text-white">
                    POST /api/v1/credits/consume
                  </div>
                  <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Whenever a user generates content in a subdomain tool, calls this endpoint to decrement credits atomically. Returns 402 if quota exhausted.
                  </p>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative border border-neutral-300 dark:border-neutral-800 bg-neutral-900 dark:bg-black text-neutral-100 dark:text-neutral-200 p-5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                <button
                  type="button"
                  onClick={() => copyCode(exampleVerifyCode)}
                  className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-lg"
                >
                  {copiedSnippet ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
                </button>
                <pre>{exampleVerifyCode}</pre>
              </div>
            </div>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
