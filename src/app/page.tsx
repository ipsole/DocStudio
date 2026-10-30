'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp, AppSubscription, SubscriptionPlan } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { IntroSplash } from '@/components/ui/IntroSplash';
import { PRICING_PLANS, YEARLY_PRICING_PLANS, CREDIT_PACKS, CreditPack, PricingPlan } from '@/lib/pricingData';
import { CreditTopUpModal } from '@/components/pricing/CreditTopUpModal';
import { CheckoutDetailsModal } from '@/components/pricing/CheckoutDetailsModal';
import { getUserSubscriptions } from '@/lib/firebase/db';
import {
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
  BookOpen,
  PlayCircle,
  Layers,
  LayoutDashboard,
  Zap,
  Plus,
} from 'lucide-react';

const TUTORIAL_GUIDES = [
  {
    title: 'Getting Started with DocStudio',
    category: 'Overview',
    duration: '3 min read',
    description: 'Learn how single sign-on works across all Docdril apps and how to access your active workspace.',
    icon: BookOpen,
  },
  {
    title: 'Creative Artboards & Vector Exports',
    category: 'Creative Suite',
    duration: '5 min watch',
    description: 'Master canvas controls, anchor points, SVG precision paths, and high-fidelity rendering pipelines.',
    icon: PlayCircle,
  },
  {
    title: 'Motion Sequencer & 60 FPS Keyframes',
    category: 'Animation',
    duration: '7 min watch',
    description: 'Animate kinetic typography and layered scenes with precision easing and instant timeline scrubbing.',
    icon: Sparkles,
  },
  {
    title: 'Automated Document Pipelines',
    category: 'Utilities',
    duration: '4 min read',
    description: 'Configure automated file conversion, batch processing, and continuous export triggers.',
    icon: Layers,
  },
];

type HomeTab = 'softwares' | 'pricings' | 'tutorials';

export default function HomePage() {
  const { user, profile, signInWithGoogle, isConfigured, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<HomeTab>('softwares');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [replayIntro, setReplayIntro] = useState(false);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Active user subscription detection
  const [userSubs, setUserSubs] = useState<AppSubscription[]>([]);
  const [checkoutItem, setCheckoutItem] = useState<PricingPlan | CreditPack | null>(null);
  const [checkoutType, setCheckoutType] = useState<'subscription' | 'credit_pack'>('subscription');
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({
    'pack-mini': 1,
    'pack-studio': 1,
    'pack-power': 1,
  });

  // Sliding pill indicators for Ecosystem Tabs and Billing Switcher
  const ecosystemTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [ecosystemIndicator, setEcosystemIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const billingTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [billingIndicator, setBillingIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const updateEcosystem = () => {
      const activeEl = ecosystemTabRefs.current[activeTab];
      if (activeEl) {
        setEcosystemIndicator({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          ready: true,
        });
      }
    };
    updateEcosystem();
    const raf = requestAnimationFrame(updateEcosystem);
    window.addEventListener('resize', updateEcosystem);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateEcosystem);
    };
  }, [activeTab, apps.length]);

  useEffect(() => {
    const updateBilling = () => {
      const activeEl = billingTabRefs.current[billingCycle];
      if (activeEl) {
        setBillingIndicator({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          ready: true,
        });
      }
    };
    updateBilling();
    const raf = requestAnimationFrame(updateBilling);
    window.addEventListener('resize', updateBilling);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateBilling);
    };
  }, [billingCycle, activeTab]);

  useEffect(() => {
    if (!user) {
      setUserSubs([]);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`docstudio_subscriptions_${user.uid}`);
        if (cached) setUserSubs(JSON.parse(cached));
      } catch {}
    }

    getUserSubscriptions(user.uid).then((subs) => {
      if (subs && subs.length > 0) setUserSubs(subs);
    });
  }, [user]);

  const activePlanId: SubscriptionPlan = React.useMemo(() => {
    if (!userSubs || userSubs.length === 0) return 'free';
    const hasEnterprise = userSubs.some((s) => s.plan === 'enterprise');
    if (hasEnterprise) return 'enterprise';
    const hasPro = userSubs.some((s) => s.plan === 'pro');
    if (hasPro) return 'pro';
    return 'free';
  }, [userSubs]);

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.rawPriceInr === 0) {
      if (!user) {
        window.location.href = '/sign-up';
      } else {
        window.location.href = '/dashboard';
      }
      return;
    }

    if (!user) {
      window.location.href = '/sign-in?redirect=/';
      return;
    }

    if (plan.id === activePlanId) {
      window.location.href = '/account#billing';
      return;
    }

    setCheckoutItem(plan);
    setCheckoutType('subscription');
    setCheckoutQuantity(1);
    setCheckoutModalOpen(true);
  };

  const handleOpenPackCheckout = (pack: CreditPack) => {
    if (!user) {
      window.location.href = '/sign-in?redirect=/';
      return;
    }
    const qty = packQuantities[pack.id] || 1;
    setCheckoutItem(pack);
    setCheckoutType('credit_pack');
    setCheckoutQuantity(qty);
    setCheckoutModalOpen(true);
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        const fetched = await getPublicApps();
        setApps(fetched);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Sync active tab with URL hash if clicked in navbar or direct link
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('pricing')) setActiveTab('pricings');
      else if (hash.includes('tutorial')) setActiveTab('tutorials');
      else if (hash.includes('software') || hash.includes('app')) setActiveTab('softwares');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        } catch {
          // ignore
        }
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            signInWithGoogle().catch((err) => {
              setGoogleError(err.message || 'Google sign in failed');
              setGoogleLoading(false);
            });
          } else {
            setGoogleLoading(false);
          }
        });
        return;
      }
      await signInWithGoogle();
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setGoogleError(fbErr.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const filteredApps = apps.filter((app) => {
    if (selectedCategory === 'all') return true;
    return app.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <>
      {/* Cinematic First-Time Intro Splash (Active when logged out or replayed on demand) */}
      {!authLoading && !user && (
        <IntroSplash
          forcePlay={replayIntro}
          onComplete={() => setReplayIntro(false)}
        />
      )}

      <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center bg-white text-neutral-900 dark:bg-black dark:text-white px-4 sm:px-6 md:px-8 pt-0 sm:pt-1 pb-16 sm:pb-24 overflow-hidden transition-colors duration-200">
        {/* Luxury Serif Typography - Natural Wide Proportions, Uncompressed */}
        <div className="relative z-10 text-center select-none pt-0 pb-4 sm:pb-6">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-serif font-normal tracking-[0.01em] text-neutral-950 dark:text-white leading-tight select-none">
            DocStudio
          </h1>
        </div>

      {/* Tabs Selector Directly Below Login Screen */}
      <div id="ecosystem" className="relative z-10 w-full max-w-[1400px] mx-auto pt-2 space-y-6">
        {/* Master View Switcher (Softwares, Pricings, Tutorials) */}
        <div className="flex items-center justify-center pt-2 pb-6">
          <div className="relative inline-flex p-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-md">
            {/* Sliding Pill Indicator */}
            {ecosystemIndicator.ready && (
              <div
                className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-neutral-950 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                style={{
                  left: `${ecosystemIndicator.left}px`,
                  width: `${ecosystemIndicator.width}px`,
                }}
              />
            )}

            <button
              ref={(el) => { ecosystemTabRefs.current['softwares'] = el; }}
              type="button"
              onClick={() => handleTabChange('softwares')}
              className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === 'softwares'
                  ? 'text-neutral-950 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Softwares {apps.length > 0 && `(${apps.length})`}
            </button>
            <button
              ref={(el) => { ecosystemTabRefs.current['pricings'] = el; }}
              type="button"
              onClick={() => handleTabChange('pricings')}
              className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === 'pricings'
                  ? 'text-neutral-950 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Pricings
            </button>
            <button
              ref={(el) => { ecosystemTabRefs.current['tutorials'] = el; }}
              type="button"
              onClick={() => handleTabChange('tutorials')}
              className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === 'tutorials'
                  ? 'text-neutral-950 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Tutorials
            </button>
          </div>
        </div>

        {/* Tab 1: Softwares Catalog */}
        {activeTab === 'softwares' && (
          <div id="softwares" className="space-y-6 animate-fadeIn">
            {/* Catalog Toolbar Header: Left-aligned Category Chips + Right-aligned Live Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-900/80">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'All Softwares', count: apps.length },
                  { id: 'creative', label: 'Creative', count: apps.filter(a => a.category?.toLowerCase() === 'creative').length },
                  { id: 'animation', label: 'Animation', count: apps.filter(a => a.category?.toLowerCase() === 'animation').length },
                  { id: 'productivity', label: 'Productivity', count: apps.filter(a => a.category?.toLowerCase() === 'productivity').length },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-950 dark:text-white border border-neutral-200/90 dark:border-neutral-800 shadow-sm font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-900/60 border border-transparent font-medium'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.count > 0 && (
                      <span
                        className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${
                          selectedCategory === cat.id
                            ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                            : 'bg-neutral-100 dark:bg-neutral-900/60 text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-sans hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{filteredApps.length} {filteredApps.length === 1 ? 'Suite' : 'Suites'} Ready</span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 font-mono text-xs">
                No software found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {filteredApps.map((app) => (
                  <AppCard key={app.id} app={app} showLaunchDirect={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pricings in INR */}
        {activeTab === 'pricings' && (
          <div id="pricings" className="space-y-10 animate-fadeIn pt-2">
            <div className="text-center max-w-xl mx-auto space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-sans text-neutral-950 dark:text-white tracking-tight">
                  Transparent Pricing for Creative Scale
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                  One unified membership unlocks creative artboards, motion engines, and document pipelines across all Docdril products.
                </p>
              </div>

              {/* Monthly / Yearly Billing Toggle */}
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="relative inline-flex items-center p-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                {/* Sliding Billing Cycle Pill Indicator */}
                {billingIndicator.ready && (
                  <div
                    className={`absolute top-1 bottom-1 rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
                      billingCycle === 'yearly'
                        ? 'bg-emerald-600'
                        : 'bg-neutral-950 dark:bg-white'
                    }`}
                    style={{
                      left: `${billingIndicator.left}px`,
                      width: `${billingIndicator.width}px`,
                    }}
                  />
                )}

                <button
                  ref={(el) => { billingTabRefs.current['monthly'] = el; }}
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'text-white dark:text-black'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  ref={(el) => { billingTabRefs.current['yearly'] = el; }}
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    billingCycle === 'yearly'
                      ? 'text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span>Yearly Billing</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                      billingCycle === 'yearly'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    Save 20%
                  </span>
                </button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                {billingCycle === 'yearly'
                  ? '✨ Annual plans include 2 months free + guaranteed yearly generation credits!'
                  : 'Flexible monthly billing • cancel or switch tiers anytime.'}
              </p>
            </div>
          </div>

          {/* Subscription Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
              {(billingCycle === 'yearly' ? YEARLY_PRICING_PLANS : PRICING_PLANS).map((plan) => {
                const isCurrentPlan =
                  activePlanId === plan.id ||
                  (activePlanId === 'free' && (plan.id === 'starter' || plan.id === 'free')) ||
                  (activePlanId === 'pro' && (plan.id === 'pro' || plan.id === 'pro-yearly')) ||
                  (activePlanId === 'enterprise' && (plan.id === 'ultra' || plan.id === 'ultra-yearly'));
                const isIncluded = (activePlanId === 'pro' || activePlanId === 'enterprise') && (plan.id === 'free' || plan.id === 'starter');
                const isDowngrade = activePlanId === 'enterprise' && (plan.id === 'pro' || plan.id === 'pro-yearly');

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 transition-all ${
                      isCurrentPlan
                        ? 'border-blue-500/80 dark:border-blue-500/80 bg-blue-500/[0.04] dark:bg-blue-950/20 shadow-xl ring-2 ring-blue-500/25'
                        : plan.popular
                        ? 'border-neutral-950 dark:border-white bg-neutral-50/80 dark:bg-neutral-950 shadow-lg ring-1 ring-neutral-950/10 dark:ring-white/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 shadow-sm'
                    }`}
                  >
                    {isCurrentPlan ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-blue-600 text-white text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Active Plan</span>
                      </span>
                    ) : plan.badge ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-neutral-950 dark:bg-white text-white dark:text-black text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                        <Sparkles className="w-3 h-3 text-amber-400 dark:text-amber-500 shrink-0" />
                        <span>{plan.badge}</span>
                      </span>
                    ) : null}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-950 dark:text-white font-sans">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-sans leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                            {plan.priceInr}
                          </span>
                          <span className="text-sm sm:text-base font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                            ({plan.priceUsd} USD)
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 font-sans ml-0.5">
                          {plan.period}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs font-sans">
                        <span className="text-neutral-500 dark:text-neutral-400">Includes </span>
                        <span className="font-bold text-neutral-950 dark:text-white font-sans">
                          {plan.creditsAllotment} Monthly Credits
                        </span>
                      </div>

                      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3.5 space-y-2">
                        {plan.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300 font-sans">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      {isCurrentPlan ? (
                        <Link
                          href="/account#subscriptions"
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-all"
                        >
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Current Plan</span>
                        </Link>
                      ) : isIncluded || isDowngrade ? (
                        <div className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 cursor-default">
                          <span>Included in your tier</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            plan.popular
                              ? 'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-md'
                              : 'border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white text-neutral-900 dark:text-white'
                          }`}
                        >
                          <span>{plan.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional On-Demand Credit Top-Ups */}
            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-sans font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Zap className="w-3 h-3" />
                  <span>Permanent Top-Up • Never Expire</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                  Add Extra Credits Anytime
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                  Need extra generation headroom? Top up credits on demand without changing your subscription.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                      pack.popular
                        ? 'border-emerald-600/80 dark:border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40'
                    }`}
                  >
                    {pack.savingsBadge && (
                      <span className={`absolute -top-2.5 right-4 px-2.5 py-0.5 text-[10px] font-sans font-bold uppercase rounded-full ${
                        pack.popular
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
                      }`}>
                        {pack.savingsBadge}
                      </span>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-neutral-950 dark:text-white font-sans">
                          {pack.name}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
                          +{pack.credits} Credits
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 pt-0.5 flex-wrap">
                        <span className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                          {pack.priceInr}
                        </span>
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                          ({pack.priceUsd} USD)
                        </span>
                        <span className="text-[11px] text-neutral-400 font-sans">
                          • {pack.costPerCredit}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed pt-1">
                        {pack.description}
                      </p>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      {/* Quantity Stepper (1 to 7 Limit) */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 font-sans">
                          Quantity (Max 7):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPackQuantities((prev) => ({
                                ...prev,
                                [pack.id]: Math.max(1, (prev[pack.id] || 1) - 1),
                              }))
                            }
                            disabled={(packQuantities[pack.id] || 1) <= 1}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-4 text-center font-mono font-bold text-xs text-neutral-900 dark:text-white">
                            {packQuantities[pack.id] || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPackQuantities((prev) => ({
                                ...prev,
                                [pack.id]: Math.min(7, (prev[pack.id] || 1) + 1),
                              }))
                            }
                            disabled={(packQuantities[pack.id] || 1) >= 7}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPackCheckout(pack)}
                        className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          Purchase ₹{pack.rawPriceInr * (packQuantities[pack.id] || 1)}
                          {(packQuantities[pack.id] || 1) > 1
                            ? ` (+${pack.credits * (packQuantities[pack.id] || 1)} cr)`
                            : ` (${pack.priceUsd})`}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tutorials */}
        {activeTab === 'tutorials' && (
          <div id="tutorials" className="space-y-8 animate-fadeIn pt-2">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white">
                Tutorials & Video Walkthroughs
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Step-by-step documentation and project guides for all creative software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TUTORIAL_GUIDES.map((guide) => {
                const Icon = guide.icon;
                return (
                  <div
                    key={guide.title}
                    className="group p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                        <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                          <Icon className="w-3.5 h-3.5 text-neutral-500" />
                          {guide.category}
                        </span>
                        <span>{guide.duration}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white font-sans group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {guide.title}
                      </h3>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {guide.description}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                      <span>Explore guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Credit Purchase Modal */}
    <CreditTopUpModal
      pack={selectedPack}
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      onSuccess={() => {
        // Refresh local subscriptions
        if (user) {
          getUserSubscriptions(user.uid).then((subs) => {
            if (subs && subs.length > 0) setUserSubs(subs);
          });
        }
      }}
    />

    {/* Pre-Checkout Billing & GST Details Modal */}
    <CheckoutDetailsModal
      isOpen={checkoutModalOpen}
      onClose={() => setCheckoutModalOpen(false)}
      item={checkoutItem}
      itemType={checkoutType}
      initialQuantity={checkoutQuantity}
      userId={user?.uid || ''}
      userEmail={user?.email || ''}
      userName={user?.displayName || undefined}
      onSuccess={(order) => {
        if (checkoutItem && checkoutType === 'subscription') {
          const target = checkoutItem.id as SubscriptionPlan;
          setUserSubs((prev) =>
            prev.map((s) => ({
              ...s,
              plan: target,
              creditsRemaining: (s.creditsRemaining || 0) + (('creditsAllotment' in checkoutItem ? checkoutItem.creditsAllotment : 0) || 0),
            }))
          );
        } else if (order.creditsAdded) {
          setUserSubs((prev) =>
            prev.map((s, idx) => (idx === 0 ? { ...s, creditsRemaining: (s.creditsRemaining || 0) + (order.creditsAdded || 0) } : s))
          );
        }
        setTimeout(() => {
          setCheckoutModalOpen(false);
          window.location.href = '/account#billing';
        }, 1800);
      }}
    />
    </>
  );
}
