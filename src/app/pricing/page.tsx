'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PRICING_PLANS, YEARLY_PRICING_PLANS, CREDIT_PACKS, PRICING_FAQS, CreditPack, PricingPlan } from '@/lib/pricingData';
import { CreditTopUpModal } from '@/components/pricing/CreditTopUpModal';
import { CheckoutDetailsModal } from '@/components/pricing/CheckoutDetailsModal';
import { getUserSubscriptions } from '@/lib/firebase/db';
import { AppSubscription, SubscriptionPlan, OrderRecord } from '@/types';
import { Check, Sparkles, ArrowRight, Zap, HelpCircle, ShieldCheck, Plus, Loader2 } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // User subscriptions to detect current active plan
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

  // Determine current active plan
  const activePlanId: SubscriptionPlan = useMemo(() => {
    if (!userSubs || userSubs.length === 0) return 'free';
    const hasEnterprise = userSubs.some((s) => s.plan === 'enterprise');
    if (hasEnterprise) return 'enterprise';
    const hasPro = userSubs.some((s) => s.plan === 'pro');
    if (hasPro) return 'pro';
    return 'free';
  }, [userSubs]);

  const handleOpenTopUp = (pack: CreditPack) => {
    setSelectedPack(pack);
    setModalOpen(true);
  };

  const handleOpenPackCheckout = (pack: CreditPack) => {
    if (!user) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }
    const qty = packQuantities[pack.id] || 1;
    setCheckoutItem(pack);
    setCheckoutType('credit_pack');
    setCheckoutQuantity(qty);
    setCheckoutModalOpen(true);
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

    if (!user) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    if (plan.id === activePlanId) {
      router.push('/account#billing');
      return;
    }

    setCheckoutItem(plan);
    setCheckoutType('subscription');
    setCheckoutQuantity(1);
    setCheckoutModalOpen(true);
  };

  const handlePlanCheckoutSuccess = (order: OrderRecord) => {
    setSuccessToast(`Subscribed to ${order.itemName}! Invoice #${order.receiptNumber}`);
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
      router.push('/account#billing');
    }, 2000);
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
                ? '✨ Annual plans include 2 months free + massive yearly generation credit allotment!'
                : 'Flexible monthly billing • cancel or switch tiers anytime.'}
            </p>
          </div>
        </div>

        {/* Subscription Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch pt-1 sm:pt-2">
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
                        <span>{plan.cta}</span>
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

      {/* 2. Additional Credit Top-Up Packs Section */}
      <div id="credits" className="space-y-8 pt-4 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Zap className="w-3.5 h-3.5" />
            <span>Never Expire • Instant Top-Up</span>
          </div>
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
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                    {pack.priceInr}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                    ({pack.priceUsd} USD)
                  </span>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    • {pack.costPerCredit}
                  </span>
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
        onSuccess={handlePlanCheckoutSuccess}
      />
    </div>
  );
}
