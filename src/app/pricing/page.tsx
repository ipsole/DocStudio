'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PRICING_PLANS, CREDIT_PACKS, PRICING_FAQS, CreditPack } from '@/lib/pricingData';
import { CreditTopUpModal } from '@/components/pricing/CreditTopUpModal';
import { Check, Sparkles, ArrowRight, Zap, HelpCircle, ShieldCheck, Plus } from 'lucide-react';

export default function PricingPage() {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleOpenTopUp = (pack: CreditPack) => {
    setSelectedPack(pack);
    setModalOpen(true);
  };

  const handleTopUpSuccess = (added: number) => {
    setSuccessToast(`+${added} Credits added successfully to your DocStudio vault!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20 text-neutral-900 dark:text-white">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-sans text-xs font-semibold flex items-center gap-2 animate-fade-in-up">
          <ShieldCheck className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Unified Software Ecosystem</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
          Simple, Transparent Pricing in INR
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-sans max-w-2xl mx-auto leading-relaxed">
          One unified account gives you full access across all Docdril creative and document tools. Choose a monthly plan or purchase extra on-demand credits that never expire.
        </p>
      </div>

      {/* 1. Subscription Plans Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xs uppercase font-sans font-semibold tracking-wider text-neutral-400">
            Monthly Subscriptions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-8 transition-all ${
                plan.popular
                  ? 'border-neutral-950 dark:border-white bg-neutral-50/80 dark:bg-neutral-950 shadow-xl ring-1 ring-neutral-950/10 dark:ring-white/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-950 dark:bg-white text-white dark:text-black text-[11px] font-sans font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                  {plan.badge}
                </span>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-neutral-950 dark:text-white font-sans">
                    {plan.name}
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
                <Link
                  href={plan.href}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    plan.popular
                      ? 'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-md'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white text-neutral-900 dark:text-white bg-white dark:bg-neutral-900'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
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

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenTopUp(pack)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pack.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-black text-neutral-900 dark:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Purchase {pack.priceInr} ({pack.priceUsd})</span>
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
