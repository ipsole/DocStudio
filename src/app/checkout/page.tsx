'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ALL_PRICING_PLANS, CREDIT_PACKS, PricingPlan, CreditPack } from '@/lib/pricingData';
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
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();

  const planId = searchParams.get('plan');
  const packId = searchParams.get('pack');
  const itemId = searchParams.get('item');
  const itemTypeParam = searchParams.get('type');
  const initialQtyParam = parseInt(searchParams.get('qty') || '1', 10);

  // Identify plan or pack
  const matchedPlan: PricingPlan | null = React.useMemo(() => {
    if (planId) {
      return ALL_PRICING_PLANS.find((p) => p.id === planId) || null;
    }
    if (itemTypeParam === 'subscription' && itemId) {
      return ALL_PRICING_PLANS.find((p) => p.id === itemId) || null;
    }
    return null;
  }, [planId, itemId, itemTypeParam]);

  const matchedPack: CreditPack | null = React.useMemo(() => {
    if (packId) {
      return CREDIT_PACKS.find((p) => p.id === packId) || null;
    }
    if (itemTypeParam === 'credit_pack' && itemId) {
      return CREDIT_PACKS.find((p) => p.id === itemId) || null;
    }
    return null;
  }, [packId, itemId, itemTypeParam]);

  const isCreditPack = Boolean(matchedPack);
  const selectedItem: PricingPlan | CreditPack | null = matchedPack || matchedPlan;

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

  // Price calculations
  const effectiveQty = isCreditPack ? Math.max(1, Math.min(7, quantity)) : 1;
  const rawAmount = selectedItem ? selectedItem.rawPriceInr * effectiveQty : 0;
  const unitCredits = selectedItem
    ? 'creditsAllotment' in selectedItem
      ? selectedItem.creditsAllotment
      : selectedItem.credits
    : 0;
  const totalCredits = unitCredits * effectiveQty;
  const baseAmount = (rawAmount / 1.18).toFixed(2);
  const gstAmount = (rawAmount - Number(baseAmount)).toFixed(2);
  const cgst = (Number(gstAmount) / 2).toFixed(2);
  const sgst = (Number(gstAmount) - Number(cgst)).toFixed(2);

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
      itemType: isCreditPack ? 'credit_pack' : 'subscription',
      userId: user.uid,
      userEmail: billingEmail.trim() || user.email || '',
      userName: billingName.trim() || user.displayName || '',
      userPhone: billingPhone.trim() || undefined,
      quantity: effectiveQty,
      businessName: businessName.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      preferredMethod,
      onVerifying: () => {
        setStatus('verifying');
      },
      onSuccess: async (order) => {
        setStatus('success');
        setConfirmedOrder(order);

        // Store payment method if requested
        if (saveCardPreference && order.paymentMethod && order.paymentMethod.type !== 'other') {
          if (typeof window !== 'undefined' && user.uid) {
            try {
              localStorage.setItem(
                `docstudio_saved_payment_method_${user.uid}`,
                JSON.stringify(order.paymentMethod)
              );
              await fetch('/api/billing/payment-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, paymentMethod: order.paymentMethod }),
              });
            } catch {
              // ignore
            }
          }
        }
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

  // 1. Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        <p className="text-sm text-neutral-500 font-sans">Loading checkout session...</p>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!user) {
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout';
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-900 dark:text-white">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-sans text-neutral-950 dark:text-white">
            Sign In to Complete Checkout
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Please log in with your Docdril account to link your subscription and vault credits.
          </p>
        </div>
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(returnUrl)}`}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-colors"
        >
          <span>Continue to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
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
        {/* LEFT COLUMN: Order Summary & Item Breakdown (col-span-5, Golden Premium Edition) */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-6">
          <div className="rounded-3xl p-6 sm:p-7 space-y-6 border border-amber-200/90 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Order Summary</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-neutral-950 dark:text-white">
                  {selectedItem.name}
                </h2>
                {'badge' in selectedItem && selectedItem.badge ? (
                  <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-black whitespace-nowrap shrink-0 leading-none">
                    {selectedItem.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans">
                {selectedItem.description}
              </p>
            </div>

            {/* Credit Allotment Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-neutral-950 dark:text-white font-sans">
                    {totalCredits.toLocaleString()} Total Credits
                  </div>
                  <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                    {isCreditPack ? 'Permanent top-up (Never expires)' : 'Shared cross-app monthly quota'}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Pack Quantity Stepper */}
            {isCreditPack && (
              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-800/70 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between">
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
                    className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
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
                    className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Official Itemized Tax & Price Breakdown */}
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-white/95 dark:bg-neutral-950/70 p-4 space-y-2.5 text-xs font-sans shadow-sm">
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>Taxable Value (Base)</span>
                <span className="font-mono">₹{baseAmount}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>Central GST (CGST @ 9%)</span>
                <span className="font-mono">₹{cgst}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>State / UT GST (SGST @ 9%)</span>
                <span className="font-mono">₹{sgst}</span>
              </div>

              <div className="border-t border-amber-200/80 dark:border-amber-800/50 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-neutral-950 dark:text-white text-sm block">
                    Total Amount Due
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                    SAC Code 998313 (IT Services)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-amber-300 font-sans tracking-tight">
                    ₹{rawAmount} INR
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Features Checklist */}
            {'features' in selectedItem && selectedItem.features ? (
              <div className="space-y-2 pt-2 border-t border-amber-200/80 dark:border-amber-800/50">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block font-sans">
                  Included in this tier:
                </span>
                <div className="space-y-2">
                  {selectedItem.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-sans">
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Security Guarantee Badges */}
            <div className="p-3 rounded-2xl bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-center gap-3 text-[11px] text-amber-900/90 dark:text-amber-300/90 font-sans">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
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
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>GSTIN Number (Optional)</span>
                  </label>
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
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{rawAmount} INR</span>
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
