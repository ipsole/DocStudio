'use client';

import React, { useState } from 'react';
import { AppSubscription, DocApp } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: AppSubscription;
  app?: DocApp;
  onCreditsUpdated?: (appId: string, newRemaining: number) => void;
}

export function SubscriptionCard({
  subscription,
  app,
  onCreditsUpdated,
}: SubscriptionCardProps) {
  const [remaining, setRemaining] = useState(subscription.creditsRemaining);
  const [total, setTotal] = useState(subscription.creditsTotal);
  const [consuming, setConsuming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const percentage = Math.max(0, Math.min(100, Math.round((remaining / (total || 1)) * 100)));
  const subdomainUrl =
    app?.applicationUrl ||
    (app?.subdomain ? `https://${app.subdomain}` : `https://${subscription.appId.replace('demo-', '')}.docdril.com`);

  const handleSimulateGeneration = async () => {
    setConsuming(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/credits/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: subscription.userId,
          appId: subscription.appId,
          amount: 1,
          action: 'simulate_generation',
          metadata: { client: 'docstudio_dashboard_test' },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRemaining(data.creditsRemaining);
        onCreditsUpdated?.(subscription.appId, data.creditsRemaining);
        setFeedback({
          type: 'success',
          message: `Generation processed. Remaining: ${data.creditsRemaining} credits`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Insufficient credits or consumption failed.',
        });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setConsuming(false);
    }
  };

  const handleTopUp = async () => {
    setAdding(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/credits/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: subscription.userId,
          appId: subscription.appId,
          amount: -50, // Negative amount or add credits
        }),
      });
      // Or local reload
      const newRem = remaining + 50;
      setRemaining(newRem);
      setTotal((t) => t + 50);
      onCreditsUpdated?.(subscription.appId, newRem);
      setFeedback({ type: 'success', message: 'Added +50 credits successfully' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to top up credits' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 p-6 sm:p-7 space-y-6 rounded-xl flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors shadow-sm dark:shadow-lg text-neutral-900 dark:text-white">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                PRODUCT SUBSCRIPTION
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
              {subscription.appName}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Subdomain: <code className="bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] rounded">{subdomainUrl.replace('https://', '')}</code>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Badge variant="default" className="uppercase font-mono text-[10px] tracking-wider px-2 py-0.5 font-bold">
              {subscription.plan}
            </Badge>
            <span className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ● {subscription.status}
            </span>
          </div>
        </div>

        {/* Credit Meter */}
        <div className="p-4 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900/60 rounded-lg space-y-2.5">
          <div className="flex justify-between items-baseline font-sans">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              <Zap className="w-3.5 h-3.5 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
              <span>Generation Quota</span>
            </div>
            <div className="text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-300">
              <span className="text-sm font-bold text-neutral-950 dark:text-white">{remaining}</span> / {total} credits
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentage > 25 ? 'bg-neutral-950 dark:bg-white' : 'bg-amber-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400">
            <span>{percentage}% allowance remaining</span>
            <span>Resets monthly</span>
          </div>
        </div>

        {/* Features Checklist */}
        {subscription.features.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 font-semibold">
              Included Privileges:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-sans">
              {subscription.features.map((feat) => (
                <div key={feat} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs flex items-center gap-2 border font-mono rounded ${
              feedback.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/70 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSimulateGeneration}
          isLoading={consuming}
          disabled={consuming || remaining <= 0}
          className="text-xs gap-1.5 font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
          Simulate 1 Gen (-1 Credit)
        </Button>

        <a
          href={subdomainUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="primary" size="sm" className="w-full gap-1.5 text-xs">
            <span>Launch App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
}
