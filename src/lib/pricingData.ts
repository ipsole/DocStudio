export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  rawPrice: number;
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
  price: string;
  rawPrice: number;
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
    price: '₹0',
    rawPrice: 0,
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
    price: '₹499',
    rawPrice: 499,
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
    price: '₹999',
    rawPrice: 999,
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

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack-mini',
    name: 'Mini Boost',
    credits: 100,
    price: '₹99',
    rawPrice: 99,
    costPerCredit: '₹0.99 / credit',
    savingsBadge: 'Starter Top-Up',
    description: 'Quick top-up for extra artwork exports and quick project generation runs.',
    popular: false,
  },
  {
    id: 'pack-studio',
    name: 'Studio Boost',
    credits: 300,
    price: '₹249',
    rawPrice: 249,
    costPerCredit: '₹0.83 / credit',
    savingsBadge: 'Save 17%',
    description: 'Best for intense creative sprints, multi-scene motion, and complex layouts.',
    popular: true,
  },
  {
    id: 'pack-power',
    name: 'Power Vault',
    credits: 750,
    price: '₹499',
    rawPrice: 499,
    costPerCredit: '₹0.66 / credit',
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
    question: 'What payment methods are supported for INR billing?',
    answer:
      'We support UPI (Google Pay, PhonePe, Paytm), Net Banking, RuPay, Visa, and Mastercard credit and debit cards.',
  },
];
