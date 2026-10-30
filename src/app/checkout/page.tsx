'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ALL_PRICING_PLANS, CREDIT_PACKS, ELITE_MEMBERSHIP, PricingPlan, CreditPack, MembershipPass } from '@/lib/pricingData';
import { openRazorpayCheckout } from '@/lib/checkout';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { OrderRecord, PaymentMethodSummary } from '@/types';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  User,
  Phone,
  CreditCard,
  Sparkles,
  Loader2,
  Check,
  FileText,
  Zap,
  ArrowRight,
  RefreshCw,
  Tag,
  X,
  Crown,
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();

  const planId = searchParams.get('plan');
  const packId = searchParams.get('pack');
  const passId = searchParams.get('pass');
  const itemId = searchParams.get('item');
  const itemTypeParam = searchParams.get('type');
  const initialQtyParam = parseInt(searchParams.get('qty') || '1', 10);

  const matchedPass: MembershipPass | null = React.useMemo(() => {
    if (
      passId === 'elite-annual' ||
      itemId === 'elite-annual' ||
      itemTypeParam === 'membership'
    ) {
      return ELITE_MEMBERSHIP;
    }
    return null;
  }, [passId, itemId, itemTypeParam]);

  const isMembership = Boolean(matchedPass);

  // Base tier detection for subscription plans ('starter' | 'pro' | 'ultra')
  const baseTier: 'starter' | 'pro' | 'ultra' = React.useMemo(() => {
    const raw = (planId || itemId || '').toLowerCase();
    if (raw.includes('ultra')) return 'ultra';
    if (raw.includes('starter')) return 'starter';
    return 'pro';
  }, [planId, itemId]);

  // Initial billing cycle from URL (defaults to yearly if specified, otherwise monthly)
  const initialCycle: 'monthly' | 'yearly' = React.useMemo(() => {
    const raw = (planId || itemId || '').toLowerCase();
    return raw.includes('yearly') || raw.includes('annual') ? 'yearly' : 'monthly';
  }, [planId, itemId]);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialCycle);

  const matchedPack: CreditPack | null = React.useMemo(() => {
    if (isMembership) return null;
    if (packId) {
      return CREDIT_PACKS.find((p) => p.id === packId) || null;
    }
    if (itemTypeParam === 'credit_pack' && itemId) {
      return CREDIT_PACKS.find((p) => p.id === itemId) || null;
    }
    return null;
  }, [isMembership, packId, itemId, itemTypeParam]);

  const isCreditPack = Boolean(matchedPack);

  // Active plan dynamically switches between monthly and annual
  const currentPlan: PricingPlan | null = React.useMemo(() => {
    if (isCreditPack || isMembership) return null;
    if (billingCycle === 'yearly') {
      if (baseTier === 'ultra') return ALL_PRICING_PLANS.find((p) => p.id === 'ultra-yearly') || null;
      if (baseTier === 'starter') return ALL_PRICING_PLANS.find((p) => p.id === 'starter') || null;
      return ALL_PRICING_PLANS.find((p) => p.id === 'pro-yearly') || null;
    } else {
      if (baseTier === 'ultra') return ALL_PRICING_PLANS.find((p) => p.id === 'ultra') || null;
      if (baseTier === 'starter') return ALL_PRICING_PLANS.find((p) => p.id === 'starter') || null;
      return ALL_PRICING_PLANS.find((p) => p.id === 'pro') || null;
    }
  }, [isCreditPack, isMembership, billingCycle, baseTier]);

  const selectedItem: PricingPlan | CreditPack | MembershipPass | null = matchedPass || matchedPack || currentPlan;

  // Clean Plan Display Name: Always "DocStudio Pro" or "DocStudio Ultra" (without "Annual")
  const planDisplayName = React.useMemo(() => {
    if (matchedPass) return `${matchedPass.name} Annual Pass`;
    if (matchedPack) return matchedPack.name;
    if (baseTier === 'ultra') return 'DocStudio Ultra';
    if (baseTier === 'starter') return 'DocStudio Starter';
    return 'DocStudio Pro';
  }, [matchedPass, matchedPack, baseTier]);

  // Quantity state for credit packs (limit 1 to 7)
  const [quantity, setQuantity] = useState<number>(
    Math.max(1, Math.min(7, isNaN(initialQtyParam) ? 1 : initialQtyParam))
  );

  // Form Fields
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [saveDetails, setSaveDetails] = useState(true);
  const [saveCardPreference, setSaveCardPreference] = useState(true);
  const [savedMethod, setSavedMethod] = useState<PaymentMethodSummary | null>(null);
  const [useSavedMethod, setUseSavedMethod] = useState(true);

  // Flow State
  const [status, setStatus] = useState<'form' | 'opening' | 'verifying' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  // Prepopulate authenticated user information
  useEffect(() => {
    if (user) {
      setBillingName((prev) => prev || profile?.displayName || user.displayName || '');
      setBillingEmail((prev) => prev || user.email || '');

      if (typeof window !== 'undefined') {
        const savedGstin = localStorage.getItem(`docstudio_gstin_${user.uid}`);
        if (savedGstin) setGstin(savedGstin);
        const savedBusiness = localStorage.getItem(`docstudio_business_${user.uid}`);
        if (savedBusiness) setBusinessName(savedBusiness);
        const savedPhone = localStorage.getItem(`docstudio_phone_${user.uid}`);
        if (savedPhone) setBillingPhone(savedPhone);

        try {
          const rawMethod = localStorage.getItem(`docstudio_saved_payment_method_${user.uid}`);
          if (rawMethod) {
            setSavedMethod(JSON.parse(rawMethod));
            setUseSavedMethod(true);
          }
        } catch {
          setSavedMethod(null);
        }
      }
    }
  }, [user, profile]);

  // Coupon / Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    discountAmountInr: number;
    finalAmountInr: number;
    isFree: boolean;
    message?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const isEliteUser = Boolean(
    profile?.isEliteMember &&
    (profile?.eliteExpiresAt ? Number(profile.eliteExpiresAt) > Date.now() : true)
  );

  // Price calculations
  const effectiveQty = isCreditPack ? Math.max(1, Math.min(7, quantity)) : 1;
  const rawAmount = selectedItem ? selectedItem.rawPriceInr * effectiveQty : 0;

  // Elite 10% discount applies to all subscriptions & credit packs if user is active Elite
  const eliteDiscountAmount = isEliteUser && !isMembership ? Math.round(rawAmount * 0.1) : 0;
  const amountAfterElite = Math.max(0, rawAmount - eliteDiscountAmount);

  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmountInr : 0;
  const finalPayableAmount = Math.max(0, amountAfterElite - couponDiscountAmount);

  const unitCredits = selectedItem
    ? 'creditsAllotment' in selectedItem
      ? selectedItem.creditsAllotment
      : 'bonusCredits' in selectedItem
      ? selectedItem.bonusCredits
      : selectedItem.credits
    : 0;
  const totalCredits = unitCredits * effectiveQty;
  const baseAmount = (finalPayableAmount / 1.18).toFixed(2);
  const gstAmount = (finalPayableAmount - Number(baseAmount)).toFixed(2);
  const cgst = (Number(gstAmount) / 2).toFixed(2);
  const sgst = (Number(gstAmount) - Number(cgst)).toFixed(2);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: clean,
          userId: user?.uid,
          userEmail: billingEmail.trim() || user?.email || '',
          username: profile?.username || user?.displayName || '',
          amountInr: rawAmount,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discountAmountInr: data.discountAmountInr,
          finalAmountInr: data.finalAmountInr,
          isFree: data.isFree,
          message: data.message,
        });
        setCouponError(null);
      } else {
        setCouponError(data.reason || 'Invalid promo code');
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // Dynamic GST determination:
  // Seller (DocStudio / Docdril) is located in Delhi (GST State Code: 07).
  // Intra-state (Delhi to Delhi, '07'): CGST (9%) + SGST (9%)
  // Inter-state (Delhi to other States): IGST (18%)
  const isInterState = React.useMemo(() => {
    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin.length >= 2) {
      return cleanGstin.slice(0, 2) !== '07';
    }
    // Default pan-India supply: IGST @ 18%
    return true;
  }, [gstin]);

  // Handle Checkout Submission
  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user) return;

    setErrorMessage(null);

    // Save info locally for convenience
    if (saveDetails && typeof window !== 'undefined' && user.uid) {
      if (gstin) localStorage.setItem(`docstudio_gstin_${user.uid}`, gstin.trim().toUpperCase());
      if (businessName) localStorage.setItem(`docstudio_business_${user.uid}`, businessName.trim());
      if (billingPhone) localStorage.setItem(`docstudio_phone_${user.uid}`, billingPhone.trim());
    }

    setStatus('opening');

    const preferredMethod =
      useSavedMethod && savedMethod
        ? (savedMethod.type as 'card' | 'upi' | 'netbanking' | 'wallet')
        : undefined;

    await openRazorpayCheckout({
      itemId: selectedItem.id,
      itemType: isCreditPack ? 'credit_pack' : isMembership ? 'membership' : 'subscription',
      userId: user.uid,
      userEmail: billingEmail.trim() || user.email || '',
      userName: billingName.trim() || user.displayName || '',
      userPhone: billingPhone.trim() || undefined,
      quantity: effectiveQty,
      businessName: businessName.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      couponCode: appliedCoupon?.code,
      preferredMethod,
      onVerifying: () => {
        setStatus('verifying');
      },
      onSuccess: async (order) => {
        setStatus('success');
        setConfirmedOrder(order);
      },
      onError: (err) => {
        setStatus('error');
        setErrorMessage(err);
      },
      onDismiss: () => {
        setStatus('form');
      },
    });
  };

  // 1. Loading auth state or Unauthenticated -> redirect immediately to main login page
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout';
      router.replace(`/sign-in?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        <p className="text-sm text-neutral-500 font-sans">
          {authLoading ? 'Loading checkout session...' : 'Redirecting to login...'}
        </p>
      </div>
    );
  }

  // 3. Invalid or Missing Item Selection
  if (!selectedItem) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-sans text-neutral-950 dark:text-white">
            No Item Selected
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Please choose a subscription plan or credit pack from our pricing catalog to proceed to checkout.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Pricing Catalog</span>
        </Link>
      </div>
    );
  }

  // 4. Success State (Full Dedicated Page Order Confirmation)
  if (status === 'success' && confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto my-10 px-4 sm:px-6">
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 sm:p-10 shadow-lg text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Payment Verified & Activated</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-neutral-950 dark:text-white">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-sans max-w-md mx-auto">
              Your transaction has been processed. Access to all suites and credits are now synced to your account.
            </p>
          </div>

          {/* Receipt Breakdown Box */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-5 text-left space-y-3.5 text-xs font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-500">Invoice Number</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                #{confirmedOrder.receiptNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Item Purchased</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {confirmedOrder.itemName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Total Amount Paid</span>
              <span className="font-bold text-neutral-950 dark:text-white text-sm">
                ₹{confirmedOrder.amount} INR
              </span>
            </div>
            {confirmedOrder.creditsAdded ? (
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Credits Added to Vault</span>
                <span>+{confirmedOrder.creditsAdded} Credits</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-colors text-center"
            >
              Open Workspace Dashboard
            </Link>
            <Link
              href="/account#billing"
              className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white transition-colors text-center"
            >
              View Invoices & Billing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Main Checkout Form & Summary Dedicated Page
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 pb-16 animate-fadeIn">
      {/* Main Grid: Left Order Summary, Right Billing Details Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: Order Summary & Item Breakdown (col-span-5) */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-6">
          <div className="rounded-3xl p-6 sm:p-7 space-y-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            {/* Subscription Billing Cycle Switcher */}
            {!isCreditPack && !isMembership && (
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 font-sans">
                  Billing Cycle
                </span>
                <div className="inline-flex items-center p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      billingCycle === 'yearly'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 leading-none">
                      -20%
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-sans text-neutral-950 dark:text-white tracking-tight leading-tight">
                {planDisplayName}
              </h2>
              {isMembership ? (
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm whitespace-nowrap shrink-0 leading-none tracking-wide">
                    👑 Annual Membership Pass • 10% Off Everything
                  </span>
                </div>
              ) : !isCreditPack && billingCycle === 'yearly' ? (
                <div>
                  <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm whitespace-nowrap shrink-0 leading-none tracking-wide">
                    Save 20% • 2 Months Free
                  </span>
                </div>
              ) : null}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans pt-0.5">
                {selectedItem.description}
              </p>
            </div>

            {/* Credit Allotment Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-neutral-950 dark:text-white font-sans">
                    {totalCredits.toLocaleString()} {isMembership ? 'Welcome Bonus Credits' : 'Total Credits'}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {isMembership
                      ? 'Deposited immediately into your central vault'
                      : isCreditPack
                      ? 'Permanent top-up (Never expires)'
                      : 'Shared cross-app monthly quota'}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Pack Quantity Stepper */}
            {isCreditPack && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white block font-sans">
                    Packs Quantity
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                    Max 7 packs per transaction
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-xs text-neutral-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(7, q + 1))}
                    disabled={quantity >= 7}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Promo Code & Coupon Section */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 font-sans">
                  <Tag className="w-3.5 h-3.5 text-neutral-500" />
                  Promo Code / Discount
                </span>
                {appliedCoupon && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-sans">
                    Discount Applied
                  </span>
                )}
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-sans">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-bold font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{appliedCoupon.code}</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {appliedCoupon.message || `${appliedCoupon.discountValue}% discount`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-lg hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer shrink-0"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="ENTER PROMO CODE"
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono uppercase text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center min-w-[64px]"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-500 font-sans flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Official Itemized Tax & Price Breakdown */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 p-4 space-y-2.5 text-xs font-sans">
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>Original Subtotal</span>
                <span className="font-mono">₹{rawAmount.toFixed(2)}</span>
              </div>
              {eliteDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span>👑 Elite Members Discount (10%)</span>
                  </span>
                  <span className="font-mono">-₹{eliteDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-mono">-₹{couponDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>Taxable Value (Base)</span>
                <span className="font-mono">₹{baseAmount}</span>
              </div>
              {isInterState ? (
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                  <span>Integrated GST (IGST @ 18%)</span>
                  <span className="font-mono">₹{gstAmount}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span>Central GST (CGST @ 9%)</span>
                    <span className="font-mono">₹{cgst}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span>State / UT GST (SGST @ 9%)</span>
                    <span className="font-mono">₹{sgst}</span>
                  </div>
                </>
              )}

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-neutral-950 dark:text-white text-sm block">
                    Total Amount Due
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                    SAC Code 998313 (IT Services)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white font-sans tracking-tight">
                    ₹{finalPayableAmount.toFixed(2)} INR
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Features Checklist */}
            {'features' in selectedItem && selectedItem.features ? (
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block font-sans">
                  Included in this tier:
                </span>
                <div className="space-y-2">
                  {selectedItem.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Security Guarantee Badges */}
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 text-[11px] text-neutral-600 dark:text-neutral-400 font-sans">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                RBI compliant tokenization • Official Tax Invoice with GSTIN credit generated immediately.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer & Billing Form (col-span-7) */}
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                Customer & Billing Details
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                Review your billing credentials and enter optional GST info for tax invoice generation.
              </p>
            </div>

            {/* Error Notification */}
            {status === 'error' && errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-start gap-3 text-xs text-red-700 dark:text-red-300 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Checkout Encountered An Issue</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleStartPayment} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Full Billing Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="e.g. Piyush Chaudhary"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
                />
              </div>

              {/* Email and Phone Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Receipt Email</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Mobile Phone (for OTP & 2FA)</span>
                  </label>
                  <input
                    type="tel"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
                  />
                </div>
              </div>

              {/* Company & GSTIN Side by Side (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <Building className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Company / Org (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Docdril Softwares"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-sans text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                      <FileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span>GSTIN Number (Optional)</span>
                    </label>
                    {gstin.length >= 2 && (
                      <span className="text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400">
                        {isInterState ? 'IGST @ 18%' : 'CGST (9%) + SGST (9%)'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="E.G. 07AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-950 dark:focus:border-white uppercase transition-colors"
                  />
                </div>
              </div>

              {/* Preferences Checkboxes */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-sans select-none">
                  <input
                    type="checkbox"
                    checked={saveDetails}
                    onChange={(e) => setSaveDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-950 dark:text-white focus:ring-0 cursor-pointer"
                  />
                  <span>Save billing & tax details for future invoices</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-sans select-none">
                  <input
                    type="checkbox"
                    checked={saveCardPreference}
                    onChange={(e) => setSaveCardPreference(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-950 dark:text-white focus:ring-0 cursor-pointer"
                  />
                  <span>Remember & store payment method securely for 1-click checkout (RBI compliant)</span>
                </label>
              </div>

              {/* Saved Payment Method Card (If available) */}
              {savedMethod && (
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    <div className="text-xs font-sans">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {savedMethod.brand?.toUpperCase() || 'Saved Card'} •••• {savedMethod.last4}
                      </div>
                      <div className="text-[11px] text-neutral-500">RBI Compliant Token</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-sans">
                    <input
                      type="checkbox"
                      checked={useSavedMethod}
                      onChange={(e) => setUseSavedMethod(e.target.checked)}
                      className="w-4 h-4 rounded text-neutral-950 dark:text-white focus:ring-0 cursor-pointer"
                    />
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Use Saved Method</span>
                  </label>
                </div>
              )}

              {/* Payment CTA Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === 'opening' || status === 'verifying'}
                  className="w-full py-3.5 px-6 rounded-2xl text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'opening' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to secure payment...</span>
                    </>
                  ) : status === 'verifying' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment Signature...</span>
                    </>
                  ) : finalPayableAmount === 0 ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Activate Free with 100% Promo (₹0)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{finalPayableAmount.toFixed(2)} INR</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer Trust Text */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                  Payments are 256-bit encrypted and PCI-DSS compliant. Official GST invoice issued automatically.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
          <p className="text-sm text-neutral-500 font-sans">Initializing checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
