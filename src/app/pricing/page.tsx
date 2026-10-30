'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PRICING_PLANS, YEARLY_PRICING_PLANS, CREDIT_PACKS, ELITE_MEMBERSHIP, PRICING_FAQS, CreditPack, PricingPlan } from '@/lib/pricingData';
import { CreditTopUpModal } from '@/components/pricing/CreditTopUpModal';
import { getUserSubscriptions, getUserOrders } from '@/lib/firebase/db';
import { AppSubscription, SubscriptionPlan, OrderRecord } from '@/types';
import { Check, Sparkles, ArrowRight, Zap, HelpCircle, ShieldCheck, Plus, Loader2, Crown } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // User subscriptions and paid orders to detect current active plan and billing cycle
  const [userSubs, setUserSubs] = useState<AppSubscription[]>([]);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({
    'pack-mini': 1,
    'pack-studio': 1,
    'pack-power': 1,
  });

  // Sliding pill indicator for Billing Switcher
  const billingTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [billingIndicator, setBillingIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

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
  }, [billingCycle]);

  useEffect(() => {
    if (!user) {
      setUserSubs([]);
      setUserOrders([]);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const cachedSubs = localStorage.getItem(`docstudio_subscriptions_${user.uid}`);
        if (cachedSubs) setUserSubs(JSON.parse(cachedSubs));
        const cachedOrders = localStorage.getItem(`docstudio_orders_${user.uid}`);
        if (cachedOrders) setUserOrders(JSON.parse(cachedOrders));
      } catch {}
    }

    getUserSubscriptions(user.uid).then((subs) => {
      if (subs && subs.length > 0) setUserSubs(subs);
    });

    getUserOrders(user.uid, user.email || '').then((ords) => {
      if (ords && ords.length > 0) setUserOrders(ords);
    });
  }, [user]);

  // Determine current active plan tier (free, pro, enterprise)
  const activePlanId: SubscriptionPlan = useMemo(() => {
    if (!userSubs || userSubs.length === 0) return 'free';
    const hasEnterprise = userSubs.some((s) => s.plan === 'enterprise');
    if (hasEnterprise) return 'enterprise';
    const hasPro = userSubs.some((s) => s.plan === 'pro');
    if (hasPro) return 'pro';
    return 'free';
  }, [userSubs]);

  // Check if the user specifically purchased an annual/yearly subscription
  const isYearlyUser = useMemo(() => {
    const hasYearlyOrder = userOrders.some(
      (o) =>
        o.itemType === 'subscription' &&
        o.status === 'paid' &&
        (o.itemId?.includes('yearly') ||
          o.itemName?.toLowerCase().includes('annual') ||
          o.amount > 3000)
    );
    if (hasYearlyOrder) return true;

    // Check duration in Firestore (validUntil > 60 days means annual since monthly is 30 days)
    const now = Date.now();
    const hasAnnualDuration = userSubs.some((s) => {
      const validUntil = typeof s.validUntil === 'number' ? s.validUntil : 0;
      return validUntil - now > 60 * 24 * 60 * 60 * 1000;
    });
    return hasAnnualDuration;
  }, [userOrders, userSubs]);

  // Check if current user is an active Elite Member
  const isEliteMember = useMemo(() => {
    return Boolean(
      profile?.isEliteMember &&
      (profile?.eliteExpiresAt ? Number(profile.eliteExpiresAt) > Date.now() : true)
    );
  }, [profile]);

  const handleOpenTopUp = (pack: CreditPack) => {
    setSelectedPack(pack);
    setModalOpen(true);
  };

  const handleOpenPackCheckout = (pack: CreditPack) => {
    const qty = packQuantities[pack.id] || 1;
    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/checkout?pack=${pack.id}&qty=${qty}`)}`);
      return;
    }
    router.push(`/checkout?pack=${pack.id}&qty=${qty}`);
  };

  const handleTopUpSuccess = (added: number) => {
    setSuccessToast(`+${added} Credits added successfully to your DocStudio vault!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.rawPriceInr === 0) {
      if (!user) {
        router.push('/sign-up');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    // Direct to billing only if clicking on their exact current plan (matching billing cycle)
    const isExactCurrentPlan =
      (activePlanId === 'pro' && !isYearlyUser && plan.id === 'pro') ||
      (activePlanId === 'pro' && isYearlyUser && plan.id === 'pro-yearly') ||
      (activePlanId === 'enterprise' && !isYearlyUser && plan.id === 'ultra') ||
      (activePlanId === 'enterprise' && isYearlyUser && plan.id === 'ultra-yearly');

    if (isExactCurrentPlan) {
      router.push('/account#billing');
      return;
    }

    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);
      return;
    }

    router.push(`/checkout?plan=${plan.id}`);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 space-y-16 sm:space-y-20 text-neutral-900 dark:text-white">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-sans text-xs font-semibold flex items-center gap-2 animate-fade-in-up">
          <ShieldCheck className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Subscription Plans Section (Hero Header, Billing Switcher & Cards Grid) */}
      <div className="space-y-6 sm:space-y-8">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
              Transparent Pricing
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-sans max-w-2xl mx-auto leading-relaxed">
              One unified account gives you full access across all Docdril creative and document tools. Choose flexible monthly billing or save 20% with annual plans.
            </p>
          </div>

          {/* Monthly / Yearly Billing Switcher */}
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="relative inline-flex items-center p-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              {/* Sliding Billing Cycle Pill Indicator */}
              {billingIndicator.ready && (
                <div
                  className="absolute top-1 bottom-1 rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-neutral-950 dark:bg-white"
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
                    ? 'text-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>Yearly Billing</span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  Save 20%
                </span>
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              {billingCycle === 'yearly'
                ? '✨ Annual plans include 2 months free + massive yearly generation credit allotment!'
                : 'Flexible monthly billing • cancel or switch tiers anytime.'}
            </p>
          </div>
        </div>

        {/* Subscription Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch pt-1 sm:pt-2">
          {(billingCycle === 'yearly' ? YEARLY_PRICING_PLANS : PRICING_PLANS).map((plan) => {
            // Determine if this plan is the user's active plan
            const isCurrentPlan = (() => {
              if (activePlanId === 'free') {
                return plan.id === 'starter' || plan.id === 'free';
              }
              if (activePlanId === 'pro') {
                if (isYearlyUser) {
                  return plan.id === 'pro-yearly' || (billingCycle === 'monthly' && plan.id === 'pro');
                } else {
                  return billingCycle === 'monthly' && plan.id === 'pro';
                }
              }
              if (activePlanId === 'enterprise') {
                if (isYearlyUser) {
                  return plan.id === 'ultra-yearly' || (billingCycle === 'monthly' && plan.id === 'ultra');
                } else {
                  return billingCycle === 'monthly' && plan.id === 'ultra';
                }
              }
              return false;
            })();

            // If user is on a monthly subscription and viewing annual cycle, allow upgrading to annual
            const isUpgradeToAnnual =
              !isYearlyUser &&
              ((activePlanId === 'pro' && plan.id === 'pro-yearly') ||
                (activePlanId === 'enterprise' && plan.id === 'ultra-yearly'));

            const isIncluded =
              !isUpgradeToAnnual &&
              ((activePlanId === 'pro' || activePlanId === 'enterprise') && (plan.id === 'free' || plan.id === 'starter'));

            const isDowngrade =
              !isUpgradeToAnnual &&
              (activePlanId === 'enterprise' && (plan.id === 'pro' || plan.id === 'pro-yearly'));

            const ctaText = isUpgradeToAnnual ? 'Upgrade to Annual' : plan.cta;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-8 transition-all ${
                  isCurrentPlan
                    ? 'border-blue-500/80 dark:border-blue-500/80 bg-blue-500/[0.04] dark:bg-blue-950/20 shadow-xl ring-2 ring-blue-500/25'
                    : plan.popular
                    ? 'border-neutral-950 dark:border-white bg-neutral-50/80 dark:bg-neutral-950 shadow-xl ring-1 ring-neutral-950/10 dark:ring-white/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 shadow-sm hover:shadow-md'
                }`}
              >
                {isCurrentPlan ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-blue-600 text-white text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                    <Check className="w-3 h-3 shrink-0" />
                    <span>Active Plan</span>
                  </span>
                ) : plan.badge ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-neutral-950 dark:bg-white text-white dark:text-black text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-amber-400 dark:text-amber-500 shrink-0" />
                    <span>{plan.badge}</span>
                  </span>
                ) : null}

                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-950 dark:text-white font-sans flex items-center gap-2">
                      <span>{plan.name}</span>
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-sans leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                    {isEliteMember && plan.rawPriceInr > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-amber-600 dark:text-amber-400 font-sans tracking-tight">
                            ₹{(plan.rawPriceInr - Math.round(plan.rawPriceInr * 0.1)).toLocaleString()}
                          </span>
                          <span className="text-base sm:text-lg line-through text-neutral-400 dark:text-neutral-500 font-sans font-medium">
                            {plan.priceInr}
                          </span>
                          <span className="text-xs text-neutral-500 font-sans ml-0.5">
                            {plan.period}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold font-sans">
                          <Crown className="w-3 h-3" />
                          <span>10% Elite Member Price</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                            {plan.priceInr}
                          </span>
                          <span className="text-sm sm:text-base font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                            ({plan.priceUsd} USD)
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 font-sans ml-0.5">
                          {plan.period}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs font-sans">
                    <span className="text-neutral-500 dark:text-neutral-400">Includes </span>
                    <span className="font-bold text-neutral-950 dark:text-white font-sans">
                      {plan.creditsAllotment} Monthly Credits
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400"> (Shared cross-app)</span>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2.5">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-sans">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isCurrentPlan
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'
                        : isIncluded || isDowngrade
                        ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 cursor-default'
                        : plan.popular
                        ? 'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-md'
                        : 'border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white text-neutral-900 dark:text-white bg-white dark:bg-neutral-900'
                    }`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Current Plan</span>
                      </>
                    ) : isIncluded || isDowngrade ? (
                      <span>Included in your tier</span>
                    ) : (
                      <>
                        <span>{ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Elite Members Annual Pass Privilege Section */}
      <div id="elite-members" className="relative rounded-3xl border border-amber-500/30 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-amber-400/[0.03] to-neutral-50/50 dark:from-amber-400/[0.06] dark:via-neutral-950 dark:to-neutral-900/40 p-6 sm:p-10 shadow-lg overflow-hidden">
        {/* Subtle decorative gold glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Elite Members Annual Pass</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                Unlock 10% Off Everything Across DocStudio
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                Become an Elite Member for just ₹199/year. Enjoy a guaranteed 10% discount on every monthly subscription renewal, annual tier upgrade, and credit top-up pack, plus receive 150 bonus credits deposited immediately into your vault.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-sans">
              {ELITE_MEMBERSHIP.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end justify-center gap-4 shrink-0 p-6 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-md shadow-sm">
            <div className="text-left lg:text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white font-sans">
                  {ELITE_MEMBERSHIP.priceInr}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-500 font-sans">
                  ({ELITE_MEMBERSHIP.priceUsd} USD)
                </span>
                <span className="text-xs text-neutral-500 font-sans">
                  {ELITE_MEMBERSHIP.period}
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-sans mt-0.5">
                ✨ +{ELITE_MEMBERSHIP.bonusCredits} Welcome Credits Included
              </p>
            </div>

            {isEliteMember ? (
              <div className="space-y-1.5 text-left lg:text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <Crown className="w-4 h-4" />
                  <span>You Are An Active Elite Member</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  10% universal discount is active on all purchases
                </p>
              </div>
            ) : (
              <Link
                href="/checkout?pass=elite-annual"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Join Elite Members</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Additional Credit Top-Up Packs Section */}
      <div id="credits" className="space-y-8 pt-4 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
            Need Extra Credits? Add On-Demand
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
            Running low on your monthly quota? Purchase extra generation credits anytime without upgrading your plan. Top-up credits never expire and sync across Canvas, Motion, and Document Pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 transition-all ${
                pack.popular
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-lg ring-1 ring-emerald-500/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/70 hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm'
              }`}
            >
              {pack.savingsBadge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-full shadow-sm ${
                  pack.popular
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                }`}>
                  {pack.savingsBadge}
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-950 dark:text-white font-sans">
                    {pack.name}
                  </h3>
                  <span className="text-xs font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                    +{pack.credits} Credits
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                  {pack.description}
                </p>

                <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                  {isEliteMember ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-sans tracking-tight">
                          ₹{pack.rawPriceInr - Math.round(pack.rawPriceInr * 0.1)}
                        </span>
                        <span className="text-sm line-through text-neutral-400 dark:text-neutral-500 font-sans font-medium">
                          {pack.priceInr}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-sans">
                          • {pack.costPerCredit}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold font-sans">
                        <Crown className="w-3 h-3" />
                        <span>10% Elite Off</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                        {pack.priceInr}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                        ({pack.priceUsd} USD)
                      </span>
                      <span className="text-[11px] text-neutral-400 font-sans">
                        • {pack.costPerCredit}
                      </span>
                    </>
                  )}
                </div>

                <div className="border-t border-neutral-200/80 dark:border-neutral-800 pt-3 space-y-2 text-xs font-sans text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Permanent validity (Never expires)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Instant sync across all subdomains</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>High-priority cloud generation pipeline</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                {/* Quantity Stepper (1 to 7 Limit) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 font-sans">
                    Quantity (Max 7):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPackQuantities((prev) => ({
                          ...prev,
                          [pack.id]: Math.max(1, (prev[pack.id] || 1) - 1),
                        }))
                      }
                      disabled={(packQuantities[pack.id] || 1) <= 1}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono font-bold text-xs text-neutral-900 dark:text-white">
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
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPackCheckout(pack)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pack.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-black text-neutral-900 dark:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    Purchase ₹{
                      (isEliteMember
                        ? pack.rawPriceInr - Math.round(pack.rawPriceInr * 0.1)
                        : pack.rawPriceInr) * (packQuantities[pack.id] || 1)
                    }
                    {(packQuantities[pack.id] || 1) > 1
                      ? ` (+${pack.credits * (packQuantities[pack.id] || 1)} cr)`
                      : isEliteMember
                      ? ' (10% Elite Off)'
                      : ` (${pack.priceUsd})`}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Frequently Asked Questions */}
      <div className="border-t border-neutral-200 dark:border-neutral-900 pt-12 space-y-8">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-neutral-500 text-xs font-sans uppercase tracking-wider font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PRICING_FAQS.map((faq) => (
            <div
              key={faq.question}
              className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-2"
            >
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white font-sans">
                {faq.question}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Purchase Modal */}
      <CreditTopUpModal
        pack={selectedPack}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
}
