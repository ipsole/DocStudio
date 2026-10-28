'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      description: 'Ideal for trying out Docdril creative and document tools.',
      price: '$0',
      period: '/ month',
      features: [
        'Access to free tier tools',
        'Standard export resolution',
        'Community support',
        'Unified single sign-on',
      ],
      cta: 'Get Started Free',
      href: '/sign-up',
      popular: false,
    },
    {
      name: 'Docdril Pro',
      description: 'Full unlimited access to all creative & document suites.',
      price: '$19',
      period: '/ month',
      features: [
        'Unlimited access to all software',
        '4K & vector export pipelines',
        'Shared cross-app credits',
        'Priority cloud rendering',
        'Early access to new tools',
      ],
      cta: 'Upgrade to Pro',
      href: '/sign-up',
      popular: true,
    },
    {
      name: 'Studio Team',
      description: 'For creative teams and studios working across workspaces.',
      price: '$49',
      period: '/ month',
      features: [
        'Everything in Pro for up to 5 seats',
        'Collaborative projects & artboards',
        'Centralized billing & admin portal',
        'Dedicated 24/7 support',
        'Custom domain access',
      ],
      cta: 'Contact Sales',
      href: 'mailto:support@docdril.com',
      popular: false,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 space-y-12">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
          Simple, Unified Pricing
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-sans">
          One account grants access across the entire Docdril suite of creative and document applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all ${
              plan.popular
                ? 'border-neutral-900 dark:border-white bg-neutral-50/50 dark:bg-neutral-950 shadow-lg'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-950 dark:bg-white text-white dark:text-black text-[10px] font-mono uppercase tracking-widest rounded-full font-bold flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Most Popular
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white font-sans">
                  {plan.name}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-4xl font-extrabold text-neutral-950 dark:text-white font-mono">
                  {plan.price}
                </span>
                <span className="text-xs text-neutral-500 font-mono">{plan.period}</span>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2.5">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <Link
                href={plan.href}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  plan.popular
                    ? 'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-md'
                    : 'border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white text-neutral-900 dark:text-white'
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
  );
}
