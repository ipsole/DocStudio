export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceInr: string;
  priceUsd: string;
  rawPriceInr: number;
  rawPriceUsd: number;
  period: string;
  creditsAllotment: number;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  badge?: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceInr: string;
  priceUsd: string;
  rawPriceInr: number;
  rawPriceUsd: number;
  costPerCredit: string;
  savingsBadge?: string;
  description: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for trying out Docdril creative and document tools.',
    priceInr: '₹0',
    priceUsd: '$0',
    rawPriceInr: 0,
    rawPriceUsd: 0,
    period: '/ month',
    creditsAllotment: 50,
    description: 'Ideal for trying out Docdril creative and document tools.',
    features: [
      '50 Monthly generation credits',
      'Access to free tier tools & artboards',
      'Standard 1080p export resolution',
      'Community support & documentation',
      'Unified single sign-on across suites',
    ],
    cta: 'Get Started Free',
    href: '/sign-up',
    popular: false,
  },
  {
    id: 'pro',
    name: 'DocStudio Pro',
    tagline: 'Full unlimited access for founders, designers, and creators.',
    priceInr: '₹499',
    priceUsd: '$6',
    rawPriceInr: 499,
    rawPriceUsd: 6,
    period: '/ month',
    creditsAllotment: 500,
    description: 'Full unlimited access to all creative & document suites.',
    features: [
      '500 Monthly generation credits',
      'Unlimited access to all software suites',
      '4K & vector export pipelines',
      'Shared cross-app credits (Canvas, Motion, Flow)',
      'Priority cloud rendering & GPU processing',
      'Early access to newly released tools',
    ],
    cta: 'Upgrade to Pro',
    href: '/sign-up',
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'ultra',
    name: 'DocStudio Ultra',
    tagline: 'Maximum generation capacity, team seats, and 60 FPS ProRes export.',
    priceInr: '₹999',
    priceUsd: '$12',
    rawPriceInr: 999,
    rawPriceUsd: 12,
    period: '/ month',
    creditsAllotment: 1500,
    description: 'For power creators and teams scaling multi-app production.',
    features: [
      '1,500 Monthly generation credits',
      'Everything in Pro for up to 5 seats',
      '60 FPS ProRes animations & lossless vector engines',
      'Automated high-throughput batch document pipelines',
      'Fastest VIP render queue',
      'Dedicated 24/7 priority support & custom domain',
    ],
    cta: 'Upgrade to Ultra',
    href: '/sign-up',
    popular: false,
    badge: 'Ultimate Power',
  },
];

export const YEARLY_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for trying out Docdril creative and document tools.',
    priceInr: '₹0',
    priceUsd: '$0',
    rawPriceInr: 0,
    rawPriceUsd: 0,
    period: '/ year',
    creditsAllotment: 50,
    description: 'Ideal for trying out Docdril creative and document tools.',
    features: [
      '50 Monthly generation credits (600 / year)',
      'Access to free tier tools & artboards',
      'Standard 1080p export resolution',
      'Community support & documentation',
      'Unified single sign-on across suites',
    ],
    cta: 'Get Started Free',
    href: '/sign-up',
    popular: false,
  },
  {
    id: 'pro-yearly',
    name: 'DocStudio Pro Annual',
    tagline: 'Full unlimited access for founders, designers, and creators with 2 months free.',
    priceInr: '₹4,790',
    priceUsd: '$58',
    rawPriceInr: 4790,
    rawPriceUsd: 58,
    period: '/ year',
    creditsAllotment: 6000,
    description: 'Full unlimited access to all creative & document suites with annual savings.',
    features: [
      '6,000 Annual generation credits (500/mo guaranteed)',
      '2 Months Free (Save 20% compared to monthly)',
      'Unlimited access to all software suites',
      '4K & vector export pipelines',
      'Shared cross-app credits (Canvas, Motion, Flow)',
      'Priority cloud rendering & GPU processing',
      'Early access to newly released tools',
    ],
    cta: 'Upgrade to Pro Annual',
    href: '/sign-up',
    popular: true,
    badge: 'Save 20% • 2 Months Free',
  },
  {
    id: 'ultra-yearly',
    name: 'DocStudio Ultra Annual',
    tagline: 'Maximum generation capacity, team seats, and 60 FPS ProRes export with 2 months free.',
    priceInr: '₹9,590',
    priceUsd: '$115',
    rawPriceInr: 9590,
    rawPriceUsd: 115,
    period: '/ year',
    creditsAllotment: 18000,
    description: 'For power creators and teams scaling multi-app production with maximum annual savings.',
    features: [
      '18,000 Annual generation credits (1,500/mo guaranteed)',
      '2 Months Free (Save 20% compared to monthly)',
      'Everything in Pro for up to 5 seats',
      '60 FPS ProRes animations & lossless vector engines',
      'Automated high-throughput batch document pipelines',
      'Fastest VIP render queue',
      'Dedicated 24/7 priority support & custom domain',
    ],
    cta: 'Upgrade to Ultra Annual',
    href: '/sign-up',
    popular: false,
    badge: 'Save 20% • Best Value',
  },
];

export const ALL_PRICING_PLANS: PricingPlan[] = [...PRICING_PLANS, ...YEARLY_PRICING_PLANS];

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack-mini',
    name: 'Mini Boost',
    credits: 100,
    priceInr: '₹99',
    priceUsd: '$1.20',
    rawPriceInr: 99,
    rawPriceUsd: 1.2,
    costPerCredit: '₹0.99 (~$0.012) / cr',
    savingsBadge: 'Starter Top-Up',
    description: 'Quick top-up for extra artwork exports and quick project generation runs.',
    popular: false,
  },
  {
    id: 'pack-studio',
    name: 'Studio Boost',
    credits: 300,
    priceInr: '₹249',
    priceUsd: '$3',
    rawPriceInr: 249,
    rawPriceUsd: 3,
    costPerCredit: '₹0.83 (~$0.010) / cr',
    savingsBadge: 'Save 17%',
    description: 'Best for intense creative sprints, multi-scene motion, and complex layouts.',
    popular: true,
  },
  {
    id: 'pack-power',
    name: 'Power Vault',
    credits: 750,
    priceInr: '₹499',
    priceUsd: '$6',
    rawPriceInr: 499,
    rawPriceUsd: 6,
    costPerCredit: '₹0.66 (~$0.008) / cr',
    savingsBadge: 'Save 33% • Best Value',
    description: 'Bulk generation pack for automated document pipelines and heavy studio workloads.',
    popular: false,
  },
];

export const PRICING_FAQS = [
  {
    question: 'How do unified generation credits work across subdomains?',
    answer:
      'Credits are pooled into your central DocStudio identity. When you generate an artboard in Canvas, render a timeline in Motion, or run a document pipeline in Flow, credits are automatically deducted from this unified balance.',
  },
  {
    question: 'Do additional credit top-up packs expire?',
    answer:
      'No! Unlike monthly quota which refreshes every 30 days, additional credit top-up packs never expire. They remain in your account until you consume them.',
  },
  {
    question: 'Can I purchase top-up credits without upgrading my monthly plan?',
    answer:
      'Yes. If you run out of credits mid-month, you can purchase any top-up pack (100, 300, or 750 credits) anytime to keep generating without changing your tier.',
  },
  {
    question: 'What payment methods are supported for INR & USD billing?',
    answer:
      'We support all major payment methods: UPI (Google Pay, PhonePe, Paytm), Net Banking, RuPay cards, International credit & debit cards (Visa, Mastercard, Amex), and PayPal.',
  },
];
