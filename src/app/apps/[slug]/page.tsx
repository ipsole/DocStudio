'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAppBySlug, getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AppVisualMockup, AppCard } from '@/components/apps/AppCard';
import {
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Palette,
  Clapperboard,
  Wrench,
  Boxes,
  Lock,
  Layers,
  Info,
  FileText,
  Box,
  Type,
  Images,
  Scissors,
  Maximize2,
  Eraser,
  Mic,
  Presentation,
  Sliders,
  Music,
  BookOpen,
  Globe,
} from 'lucide-react';

export default function AppDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [app, setApp] = useState<DocApp | null>(null);
  const [allApps, setAllApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApp() {
      if (!slug) return;
      try {
        const [found, publicApps] = await Promise.all([
          getAppBySlug(slug),
          getPublicApps(),
        ]);
        setApp(found);
        setAllApps(publicApps);
      } catch (err) {
        console.error('Error loading app detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [slug]);

  const relatedApps = React.useMemo(() => {
    if (!app || allApps.length === 0) return [];
    const others = allApps.filter((a) => a.slug !== app.slug);
    const sameCat = others.filter((a) => a.category === app.category);
    const diffCat = others.filter((a) => a.category !== app.category);
    return [...sameCat, ...diffCat].slice(0, 3);
  }, [app, allApps]);

  const renderIcon = (iconName?: string) => {
    const iconClass = 'w-8 h-8 text-white';
    switch (iconName) {
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Box':
        return <Box className={iconClass} />;
      case 'Clapperboard':
        return <Clapperboard className={iconClass} />;
      case 'Type':
        return <Type className={iconClass} />;
      case 'Images':
        return <Images className={iconClass} />;
      case 'Scissors':
        return <Scissors className={iconClass} />;
      case 'Maximize2':
        return <Maximize2 className={iconClass} />;
      case 'Eraser':
        return <Eraser className={iconClass} />;
      case 'Mic':
        return <Mic className={iconClass} />;
      case 'Presentation':
        return <Presentation className={iconClass} />;
      case 'Sliders':
        return <Sliders className={iconClass} />;
      case 'Music':
        return <Music className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Globe':
        return <Globe className={iconClass} />;
      case 'Palette':
        return <Palette className={iconClass} />;
      case 'Layers':
        return <Layers className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      default:
        return <Boxes className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 animate-pulse space-y-6">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-24 rounded" />
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 w-1/3 rounded" />
            <div className="h-4 bg-neutral-100 dark:bg-neutral-900 w-1/2 rounded" />
          </div>
        </div>
        <div className="h-32 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white shadow-sm">
        <div className="w-12 h-12 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-amber-600 dark:text-amber-400 rounded-full mx-auto flex items-center justify-center mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="font-mono text-sm uppercase tracking-wider font-bold text-neutral-950 dark:text-white">
          Application Not Found
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 font-sans">
          The requested application &ldquo;{slug}&rdquo; is not currently registered or is not publicly available.
        </p>
        <div className="mt-6">
          <Link href="/apps">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Return to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const targetUrl = app.applicationUrl || (app.subdomain ? `https://${app.subdomain}.docdril.com` : null);
  const isLaunchable = app.status === 'active' && Boolean(targetUrl);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Back button */}
      <div>
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>

      {/* Hero Header */}
      <div className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl rounded-xl text-neutral-900 dark:text-white shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl flex items-center justify-center shrink-0 text-neutral-900 dark:text-white">
              {renderIcon(app.icon)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] uppercase text-neutral-950 dark:text-white font-sans">
                  {app.name}
                </h1>
                <StatusBadge status={app.status} />
                {app.isDemo && (
                  <Badge variant="neutral" size="sm">
                    DEMO RECORD
                  </Badge>
                )}
              </div>
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-1">
                CATEGORY: <span className="font-bold text-neutral-950 dark:text-white">{app.category}</span>
                {app.version && (
                  <>
                    <span className="mx-2">•</span>
                    VERSION: <span className="text-neutral-950 dark:text-white">{app.version}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            {isLaunchable && targetUrl ? (
              <>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 px-6 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all">
                    Launch Software
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center sm:justify-end gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  <span>{targetUrl.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : app.status === 'coming_soon' ? (
              <Button variant="secondary" size="lg" disabled className="w-full sm:w-auto gap-2 opacity-50">
                <Lock className="w-4 h-4 text-neutral-400" />
                Coming Soon
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled className="w-full sm:w-auto opacity-50">
                Not Available
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Interactive Preview */}
          <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 aspect-[16/9] shadow-sm relative">
            <AppVisualMockup app={app} />
          </div>

          <div className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 rounded-xl space-y-4 text-neutral-900 dark:text-white shadow-sm">
            <h2 className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-950 dark:text-white">
              About this Application
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
              {app.description || app.shortDescription}
            </p>

            {app.tags && app.tags.length > 0 && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  TAGS & CAPABILITIES
                </h4>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Direct Navigation Banner */}
          {isLaunchable && targetUrl && (
            <div className="p-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-neutral-950 dark:text-white flex items-center gap-2">
                  <span>Open {app.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                  Navigate directly to <span className="font-mono font-medium text-neutral-900 dark:text-neutral-200">{targetUrl.replace(/^https?:\/\//, '')}</span> with seamless DocStudio SSO authentication.
                </p>
              </div>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto shrink-0"
              >
                <Button variant="primary" size="md" className="w-full sm:w-auto gap-2 font-medium">
                  Go to Website
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          )}

          <div className="p-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl space-y-2 text-neutral-900 dark:text-white">
            <div className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-950 dark:text-white">
              Docdril Ecosystem Architecture
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
              This application is registered in DocStore. Your central Docdril identity will authenticate
              sessions and manage software entitlements across connected satellite applications.
            </p>
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <div className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 rounded-xl space-y-4 text-neutral-900 dark:text-white shadow-sm">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-950 dark:text-white">
              SPECIFICATIONS
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">STATUS</span>
                <span className="font-bold text-neutral-950 dark:text-white uppercase">{app.status}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">ACCOUNT</span>
                <span className="font-bold text-neutral-950 dark:text-white">DOCDRIL SSO</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">HOSTING</span>
                <span className="font-bold text-neutral-950 dark:text-white">
                  {targetUrl ? 'CLOUD' : 'PENDING'}
                </span>
              </div>
              {targetUrl && (
                <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">WEBSITE</span>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1 truncate max-w-[170px]"
                    title={targetUrl}
                  >
                    <span className="truncate">{targetUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-neutral-500 dark:text-neutral-400">TIER</span>
                <span className="font-bold text-neutral-950 dark:text-white">STANDALONE</span>
              </div>
            </div>
          </div>

          <div className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 rounded-xl space-y-2 text-neutral-900 dark:text-white shadow-sm">
            <div className="flex items-center gap-2 text-neutral-950 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-xs uppercase font-bold tracking-wider">
                VERIFIED SOFTWARE
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
              Official catalog entry registered and verified under the Docdril platform.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Explore More Software / Ecosystem Suggestions Grid */}
      {relatedApps.length > 0 && (
        <div className="pt-10 border-t border-neutral-200 dark:border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                Explore More Applications
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
                Connected tools and specialized suites in the Docdril ecosystem
              </p>
            </div>
            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white transition-colors"
            >
              <span>View All 14 Suites</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedApps.map((relApp) => (
              <AppCard key={relApp.id} app={relApp} allApps={relatedApps} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
