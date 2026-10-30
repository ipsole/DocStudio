'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
import { UserAvatar } from '@/components/ui/UserAvatar';
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

  // Synchronously hydrate cached subscriptions to prevent numbers jumping on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      try {
        const cached = localStorage.getItem(`docstudio_subscriptions_${user.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSubscriptions(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [user?.uid]);

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
        if (typeof window !== 'undefined' && user?.uid) {
          try {
            localStorage.setItem(`docstudio_subscriptions_${user.uid}`, JSON.stringify(userSubs));
          } catch {
            // ignore
          }
        }
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

  // Determine active plan name based on user subscriptions
  const activePlanName = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return 'Starter';
    if (subscriptions.some((s) => s.plan === 'enterprise')) return 'Ultra';
    if (subscriptions.some((s) => s.plan === 'pro')) return 'Pro';
    return 'Starter';
  }, [subscriptions]);

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

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* 1. Cinematic Hero Header */}
        <div className="animate-fade-in-up flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200/80 dark:border-neutral-900">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/account"
              title="Manage Profile & Avatar"
              className="relative group shrink-0 rounded-full focus:outline-none"
            >
              <UserAvatar
                user={user}
                profile={profile}
                size="2xl"
                className="group-hover:scale-105 transition-transform shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="w-3 h-3 text-neutral-600 dark:text-neutral-300" />
              </span>
            </Link>

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
              <span>Settings</span>
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

        {/* 2. Enterprise Plan, Quota & Access Ribbon */}
        <div id="tour-quota-card" className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 animate-fade-in-up animation-delay-100">
          {/* Card 1: Your Current Plan & Upgrade Action */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:shadow-none transition-shadow flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Current Plan
              </span>
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-bold font-sans text-neutral-950 dark:text-white leading-tight">
                {isAdmin
                  ? 'Enterprise Admin'
                  : activePlanName === 'Ultra'
                  ? 'DocStudio Ultra'
                  : activePlanName === 'Pro'
                  ? 'DocStudio Pro'
                  : 'DocStudio Starter'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate font-sans">
                {user?.email} • {activePlanName === 'Starter' ? 'Free Starter Tier' : 'All tools unlocked'}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                {activePlanName === 'Starter' ? 'Active Starter Tier' : 'Active Subscription'}
              </span>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Generation Quota with Visual Usage Meter & Get More Credits Button */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:shadow-none transition-shadow flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Generation Quota
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-sans text-neutral-950 dark:text-white">
                    {subscriptions.length > 0 ? totalCreditsRemaining : 175}
                  </span>
                  <span className="text-xs font-sans text-neutral-500">
                    / {subscriptions.length > 0 ? totalCreditsMax : 175} Monthly
                  </span>
                </div>
                <span className="text-xs font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                  {Math.round(((subscriptions.length > 0 ? totalCreditsRemaining : 175) / (subscriptions.length > 0 ? totalCreditsMax : 175)) * 100)}% Available
                </span>
              </div>

              {/* Visual Enterprise Usage Bar */}
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden mt-3 mb-1">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((subscriptions.length > 0 ? totalCreditsRemaining : 175) / (subscriptions.length > 0 ? totalCreditsMax : 175)) * 100))}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Shared across Canvas, Motion, and Document Pipelines.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Quota Healthy
              </span>
              <Link
                href="/pricing#credits"
                className="text-neutral-900 dark:text-white font-semibold hover:underline text-xs flex items-center gap-1"
              >
                <span>Get More Credits +</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Connected Subdomain Mesh */}
          <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:shadow-none transition-shadow flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Connected Suites
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-sans text-neutral-950 dark:text-white">
                3 Active Suites
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
                canvas • motion • pipeline (.docdril.com)
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SSO Synced
              </span>
              <a
                href="#tour-launchpad"
                className="text-neutral-900 dark:text-white font-semibold hover:underline text-xs flex items-center gap-1"
              >
                <span>Launch Apps ↓</span>
              </a>
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

        {/* 4. Subdomain Developer Hub & Integration Guide (Admin Only) */}
        {isAdmin && (
          <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl overflow-hidden shadow-sm animate-fade-in-up animation-delay-300">
            <div
              onClick={() => setShowApiDocs(!showApiDocs)}
              className="p-5 sm:p-6 cursor-pointer flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50 transition-colors select-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-sm font-bold text-neutral-950 dark:text-white">
                      Subdomain Single Sign-On & Credit Verification API
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-medium">
                      Admin Guide
                    </span>
                  </div>
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    How <code className="font-mono text-neutral-900 dark:text-neutral-200">canvas.docdril.com</code>, <code className="font-mono text-neutral-900 dark:text-neutral-200">motion.docdril.com</code>, & future apps authenticate & deduct credits
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-sans font-medium text-neutral-500 dark:text-neutral-400">
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
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Endpoint 1: Session & Balance Check
                    </span>
                    <div className="font-mono font-semibold text-neutral-950 dark:text-white">
                      POST /api/v1/auth/verify
                    </div>
                    <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                      Subdomain apps send the user Bearer ID Token to verify access. Returns user identity, plan status, and remaining generation credits.
                    </p>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 rounded-xl space-y-2">
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Endpoint 2: Atomic Credit Consumption
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
        )}
      </div>
    </ProtectedRoute>
  );
}
