'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { IntroSplash } from '@/components/ui/IntroSplash';
import {
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
  BookOpen,
  PlayCircle,
  Layers,
  LayoutDashboard,
} from 'lucide-react';

const PRICING_PLANS = [
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
  const { user, profile, signInWithGoogle, isConfigured } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<HomeTab>('softwares');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [replayIntro, setReplayIntro] = useState(false);

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
      {!user && (
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
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
              The unified software ecosystem of Docdril
            </p>
            {!user && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <button
                  type="button"
                  onClick={() => setReplayIntro(true)}
                  className="text-[11px] font-mono text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title="Replay intro animation"
                >
                  Play Film ↺
                </button>
              </>
            )}
          </div>
        </div>

      {/* Tabs Selector Directly Below Login Screen */}
      <div id="ecosystem" className="relative z-10 w-full max-w-[1400px] mx-auto pt-2 space-y-6">
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleTabChange('softwares')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'softwares'
                  ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Softwares {apps.length > 0 && `(${apps.length})`}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('pricings')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'pricings'
                  ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Pricings
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('tutorials')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'tutorials'
                  ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-sm font-semibold'
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
            {/* Category Filter Pills */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              {[
                { id: 'all', label: 'All Softwares' },
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
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
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

        {/* Tab 2: Pricings */}
        {activeTab === 'pricings' && (
          <div id="pricings" className="space-y-8 animate-fadeIn pt-2">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white">
                Unified Ecosystem Subscriptions
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Subscribe once to unlock creative and document generation suites across all subdomains.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all ${
                    plan.popular
                      ? 'border-neutral-950 dark:border-white bg-neutral-50/70 dark:bg-neutral-950 shadow-md'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-neutral-950 dark:bg-white text-white dark:text-black text-[10px] font-mono uppercase tracking-widest rounded-full font-bold flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </span>
                  )}

                  <div className="space-y-3.5">
                    <div>
                      <h3 className="text-base font-bold text-neutral-950 dark:text-white font-sans">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white font-mono">
                        {plan.price}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">{plan.period}</span>
                    </div>

                    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3.5 space-y-2">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
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
    </>
  );
}
