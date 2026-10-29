'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CreditPack } from '@/lib/pricingData';
import { addCredits, getUserSubscriptions } from '@/lib/firebase/db';
import { openRazorpayCheckout } from '@/lib/checkout';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  CheckCircle,
  X,
  CreditCard,
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface CreditTopUpModalProps {
  pack: CreditPack | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (addedCredits: number) => void;
}

export function CreditTopUpModal({
  pack,
  isOpen,
  onClose,
  onSuccess,
}: CreditTopUpModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError(null);
      setPurchased(false);
    }
  }, [isOpen, pack]);

  if (!isOpen || !pack) return null;

  const totalCredits = pack.credits * quantity;
  const totalAmountInr = pack.rawPriceInr * quantity;

  const handlePurchase = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    await openRazorpayCheckout({
      itemId: pack.id,
      itemType: 'credit_pack',
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || undefined,
      quantity,
      onSuccess: () => {
        setPurchased(true);
        onSuccess?.(totalCredits);
        setTimeout(() => {
          setPurchased(false);
          onClose();
        }, 2200);
      },
      onError: (errMsg) => {
        setError(errMsg);
        setLoading(false);
      },
      onDismiss: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-neutral-900 dark:text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {purchased ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-sans">
                +{totalCredits} Credits Added!
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                Added {quantity > 1 ? `${quantity} × ${pack.name}` : pack.name} (+{totalCredits} credits) to your central DocStudio vault.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>On-Demand Credit Top-Up</span>
              </div>
              <h3 className="text-2xl font-bold font-sans tracking-tight pt-1">
                {pack.name}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                {pack.description}
              </p>
            </div>

            {/* Quantity Selector: 1 to 7 Limit */}
            <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans block">
                  Purchase Quantity
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                  Purchase up to 7 packs in a single checkout
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-base text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-sm text-neutral-950 dark:text-white font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(7, q + 1))}
                  disabled={quantity >= 7}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-base text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price & Credit Summary Box */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight text-neutral-950 dark:text-white">
                    ₹{totalAmountInr}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                    (${pack.rawPriceUsd * quantity} USD)
                  </span>
                  <span className="text-xs text-neutral-500 font-sans ml-1">
                    {quantity > 1 ? `(${quantity} × ₹${pack.rawPriceInr})` : 'one-time payment'}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-sans text-xs font-semibold">
                  +{totalCredits} Credits
                </span>
              </div>

              <div className="border-t border-neutral-200/70 dark:border-neutral-800 pt-3 space-y-2 text-xs font-sans text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Unit Rate</span>
                  <span className="font-sans text-neutral-900 dark:text-white font-medium">
                    {pack.costPerCredit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Validity</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Never Expires
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cross-App Availability</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    Canvas • Motion • Pipeline
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-xl">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            {user ? (
              <div className="space-y-2.5">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full h-11 text-xs font-semibold uppercase tracking-wider gap-2"
                  onClick={handlePurchase}
                  isLoading={loading}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Pay ₹{totalAmountInr} (+{totalCredits} Credits)</span>
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Instant UPI & Card checkout via Razorpay</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href={`/sign-in?redirect=/pricing`} className="block">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full h-11 text-xs font-semibold uppercase tracking-wider gap-2"
                  >
                    <span>Sign In to Purchase Top-Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-center text-[11px] text-neutral-500 font-sans">
                  Sign in or create an account to tie purchased credits to your central identity.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
