'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAppBySlug } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ExternalLink,
  ArrowLeft,
  Calendar,
  Layers,
  ShieldCheck,
  Palette,
  Clapperboard,
  Wrench,
  Boxes,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';

export default function AppDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [app, setApp] = useState<DocApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApp() {
      if (!slug) return;
      try {
        const found = await getAppBySlug(slug);
        setApp(found);
      } catch (err) {
        console.error('Error loading app detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [slug]);

  const renderIcon = (iconName?: string) => {
    const iconClass = 'w-8 h-8 text-slate-800';
    switch (iconName) {
      case 'Palette':
        return <Palette className={iconClass} />;
      case 'Clapperboard':
        return <Clapperboard className={iconClass} />;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded w-24" />
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Application Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
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

  const isLaunchable = app.status === 'active' && Boolean(app.applicationUrl);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>

      {/* Hero Header */}
      <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              {renderIcon(app.icon)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{app.name}</h1>
                <StatusBadge status={app.status} />
                {app.isDemo && (
                  <Badge variant="neutral" size="sm">
                    Demo Record
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 capitalize">
                Category: <span className="font-medium text-slate-700">{app.category}</span>
                {app.version && (
                  <>
                    <span className="mx-2">•</span>
                    Version <span className="font-mono">{app.version}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isLaunchable ? (
              <a
                href={app.applicationUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                  Launch Application
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            ) : app.status === 'coming_soon' ? (
              <Button variant="secondary" size="lg" disabled className="w-full sm:w-auto gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                Coming Soon
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled className="w-full sm:w-auto">
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
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">About this Application</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {app.description || app.shortDescription}
            </p>

            {app.tags && app.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tags & Capabilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ecosystem note */}
          <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Docdril Ecosystem Integration</span>
            </div>
            <p className="text-xs text-blue-800/90 leading-relaxed">
              This application is registered in DocStore. In future updates, your central Docdril
              account will directly authenticate your sessions and manage software entitlements
              across connected tools.
            </p>
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Product Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800 capitalize">{app.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Account Requirement</span>
                <span className="font-semibold text-slate-800">Docdril Unified Account</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Platform Deployment</span>
                <span className="font-semibold text-slate-800">
                  {app.applicationUrl ? 'Cloud Hosted' : 'Pending Deployment'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Access Tier</span>
                <span className="font-semibold text-slate-800">Access Management In Progress</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Application</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official software catalog record maintained by Docdril. Product URLs and integrity are verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
