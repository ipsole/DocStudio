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
  Boxes,
  User,
  Settings,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Welcome Header */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Docdril Central Account</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {profile?.displayName || user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-slate-500">
              Manage your connected applications and explore new tools across the Docdril platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/account">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                Account Settings
              </Button>
            </Link>
            <Link href="/apps">
              <Button variant="primary" size="sm" className="gap-2">
                Browse All Software
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: My Applications (Entitlements) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Applications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Software licensed or granted directly to your Docdril identity.
              </p>
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
            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Access Management Under Establishment
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    Your account does not currently hold any assigned individual licenses or paid product
                    entitlements. As monetization and access policies are integrated, software you acquire
                    will appear in this section for launch and management.
                  </p>
                  <p className="text-xs text-slate-500 pt-1">
                    In the meantime, public tools and beta releases can be explored directly below.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Active Software Available for Discovery */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Available Software</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active tools currently open for exploration in the Docdril ecosystem.
              </p>
            </div>
            <Link href="/apps" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View full catalog →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
              ))}
            </div>
          ) : activeApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeApps.map((app) => (
                <AppCard key={app.id} app={app} showLaunchDirect={true} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No active applications currently registered.</p>
          )}
        </section>

        {/* Section 3: Upcoming Releases */}
        {upcomingApps.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900">In Development</h2>
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
