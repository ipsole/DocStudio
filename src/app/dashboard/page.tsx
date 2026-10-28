'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getPublicApps, getUserEntitlements } from '@/lib/firebase/db';
import { DocApp, Entitlement } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [catalogApps, userEnts] = await Promise.all([
          getPublicApps(),
          getUserEntitlements(user.uid),
        ]);
        setApps(catalogApps);
        setEntitlements(userEnts);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const activeApps = apps.filter((a) => a.status === 'active');
  const upcomingApps = apps.filter((a) => a.status === 'coming_soon');

  return (
    <ProtectedRoute>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-12">
        {/* Welcome Header */}
        <div className="border border-neutral-950 bg-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-none">
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              CENTRAL ACCOUNT ACTIVE
            </div>
            <h1 className="text-2xl sm:text-4xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans leading-none">
              Welcome back,{' '}
              <span className="font-bold">
                {profile?.displayName || user?.displayName || user?.email?.split('@')[0]}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 font-sans">
              Access your connected software tools and explore new releases across the Docdril platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/account">
              <Button variant="secondary" size="sm" className="gap-2">
                <Settings className="w-3.5 h-3.5" />
                Account Settings
              </Button>
            </Link>
            <Link href="/apps">
              <Button variant="primary" size="sm" className="gap-2">
                Explore Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: My Applications (Entitlements) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-950 pb-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                ACTIVE ACCESS
              </div>
              <h2 className="text-2xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
                My Applications
              </h2>
            </div>
          </div>

          {entitlements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entitlements.map((ent) => {
                const app = apps.find((a) => a.id === ent.appId);
                if (!app) return null;
                return <AppCard key={ent.id} app={app} showLaunchDirect={true} />;
              })}
            </div>
          ) : (
            <div className="border border-neutral-200 bg-white p-6 rounded-none">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-neutral-950 bg-neutral-950 text-white flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-950">
                    Application Access Management in Progress
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans max-w-2xl">
                    Your account does not currently hold any individual paid licenses or assigned product
                    entitlements. As software products in the Docdril ecosystem are activated for your account,
                    they will appear here for one-click access.
                  </p>
                  <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider pt-2">
                    Browse public tools and active preview software below.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Active Software Available for Discovery */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-950 pb-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                AVAILABLE DIRECTORY
              </div>
              <h2 className="text-2xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
                Active Software
              </h2>
            </div>
            <Link
              href="/apps"
              className="font-mono text-xs uppercase tracking-wider font-semibold text-neutral-950 hover:underline"
            >
              View full catalog →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 border border-neutral-200 bg-white p-6 animate-pulse" />
              ))}
            </div>
          ) : activeApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeApps.map((app) => (
                <AppCard key={app.id} app={app} showLaunchDirect={true} />
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs uppercase text-neutral-400">
              No active applications currently registered.
            </p>
          )}
        </section>

        {/* Section 3: Upcoming Releases */}
        {upcomingApps.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-950 pb-2">
              <Clock className="w-4 h-4 text-neutral-950" />
              <h2 className="text-2xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
                In Development
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingApps.map((app) => (
                <AppCard key={app.id} app={app} showLaunchDirect={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ProtectedRoute>
  );
}
