'use client';

import React, { useState, useEffect } from 'react';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { PricingPlan, CreditPack, MembershipPass } from '@/lib/pricingData';
import { openRazorpayCheckout } from '@/lib/checkout';
import { auth } from '@/lib/firebase/client';
import { OrderRecord, PaymentMethodSummary } from '@/types';
import {
  X,
  ShieldCheck,
  Building,
  Mail,
  User,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Phone,
} from 'lucide-react';

interface CheckoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PricingPlan | CreditPack | MembershipPass | null;
  itemType: 'subscription' | 'credit_pack' | 'membership';
  userId: string;
  userEmail: string;
  userName?: string;
  initialQuantity?: number;
  onSuccess: (order: OrderRecord) => void;
}

export function CheckoutDetailsModal({
  isOpen,
  onClose,
  item,
  itemType,
  userId,
  userEmail,
  userName,
  initialQuantity = 1,
  onSuccess,
}: CheckoutDetailsModalProps) {
  const [billingName, setBillingName] = useState(userName || '');
  const [billingEmail, setBillingEmail] = useState(userEmail || '');
  const [billingPhone, setBillingPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [saveDetails, setSaveDetails] = useState(true);
  const [quantity, setQuantity] = useState(Math.max(1, Math.min(7, initialQuantity)));
  const [savedMethod, setSavedMethod] = useState<PaymentMethodSummary | null>(null);
  const [useSavedMethod, setUseSavedMethod] = useState(true);
  const [saveCardPreference, setSaveCardPreference] = useState(true);

  // Flow status
  const [status, setStatus] = useState<'form' | 'opening' | 'verifying' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('form');
      setErrorMessage(null);
      setBillingName(userName || '');
      setBillingEmail(userEmail || '');
      setQuantity(Math.max(1, Math.min(7, initialQuantity)));

      // Load remembered GSTIN, Phone and Saved Payment Method
      if (typeof window !== 'undefined' && userId) {
        const savedGstin = localStorage.getItem(`docstudio_gstin_${userId}`);
        if (savedGstin) setGstin(savedGstin);
        const savedBusiness = localStorage.getItem(`docstudio_business_${userId}`);
        if (savedBusiness) setBusinessName(savedBusiness);
        const savedPhone = localStorage.getItem(`docstudio_phone_${userId}`);
        if (savedPhone) setBillingPhone(savedPhone);

        try {
          const rawMethod = localStorage.getItem(`docstudio_saved_payment_method_${userId}`);
          if (rawMethod) {
            setSavedMethod(JSON.parse(rawMethod));
            setUseSavedMethod(true);
          } else {
            setSavedMethod(null);
            setUseSavedMethod(false);
          }
        } catch {
          setSavedMethod(null);
        }
      }
    }
  }, [isOpen, userId, userEmail, userName, initialQuantity]);

  if (!isOpen || !item) return null;

  const isCreditPack = itemType === 'credit_pack';
  const effectiveQty = isCreditPack ? Math.max(1, Math.min(7, quantity)) : 1;
  const rawAmount = item.rawPriceInr * effectiveQty;
  const unitCredits = 'creditsAllotment' in item ? item.creditsAllotment : 'bonusCredits' in item ? item.bonusCredits : item.credits;
  const credits = unitCredits * effectiveQty;
  const baseAmount = (rawAmount / 1.18).toFixed(2);
  const gstAmount = (rawAmount - Number(baseAmount)).toFixed(2);
  const cgst = (Number(gstAmount) / 2).toFixed(2);
  const sgst = (Number(gstAmount) - Number(cgst)).toFixed(2);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Save GSTIN & Business to local storage if requested
    if (saveDetails && typeof window !== 'undefined' && userId) {
      if (gstin) localStorage.setItem(`docstudio_gstin_${userId}`, gstin.trim().toUpperCase());
      if (businessName) localStorage.setItem(`docstudio_business_${userId}`, businessName.trim());
      if (billingPhone) localStorage.setItem(`docstudio_phone_${userId}`, billingPhone.trim());
    }

    setStatus('opening');

    const preferredMethod =
      useSavedMethod && savedMethod
        ? (savedMethod.type as 'card' | 'upi' | 'netbanking' | 'wallet')
        : undefined;

    await openRazorpayCheckout({
      itemId: item.id,
      itemType,
      userId,
      userEmail: billingEmail.trim() || userEmail,
      userName: billingName.trim() || userName,
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
        onSuccess(order);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <DocdrilLogo size={36} className="w-9 h-9 shrink-0 text-neutral-950 dark:text-white" fill="currentColor" />
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white font-sans">
                Review & Billing Details
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                Secure checkout
              </p>
            </div>
          </div>
          {status !== 'verifying' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Order Summary Box */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900 dark:text-white font-sans">
                  {item.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-900 dark:bg-white text-white dark:text-black">
                  {itemType === 'subscription' ? 'Plan' : itemType === 'membership' ? 'Pass' : effectiveQty > 1 ? `Pack × ${effectiveQty}` : 'Pack'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>+{credits} Generation Credits included</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-neutral-900 dark:text-white font-sans">
                ₹{rawAmount}
              </div>
              <div className="text-[11px] text-neutral-400 font-sans">
                {effectiveQty > 1 ? `₹${item.rawPriceInr} × ${effectiveQty} (Incl. GST)` : 'Inclusive of 18% GST'}
              </div>
            </div>
          </div>

          {/* Quantity Selector (1 to 7 Limit) for Credit Top-Up Packs */}
          {isCreditPack && (
            <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans block">
                  Purchase Quantity
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                  Single purchase limit: 1 to 7 packs (+{credits} Credits)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={effectiveQty <= 1}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-base text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-sm text-neutral-950 dark:text-white font-mono">
                  {effectiveQty}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(7, q + 1))}
                  disabled={effectiveQty >= 7}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-base text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Itemized GST & Tax Summary */}
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5 text-xs font-sans">
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Taxable Value (Base)</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">₹{baseAmount}</span>
            </div>
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Central GST (CGST @ 9%)</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">₹{cgst}</span>
            </div>
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>State / UT GST (SGST @ 9%)</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">₹{sgst}</span>
            </div>
            <div className="pt-1.5 border-t border-neutral-200 dark:border-neutral-800 flex justify-between font-bold text-neutral-950 dark:text-white">
              <span>Total Amount (SAC 998313)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{rawAmount} INR</span>
            </div>
          </div>

          {/* Verification States */}
          {status === 'verifying' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-sans">
                  Verifying Payment...
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto font-sans leading-relaxed">
                  Cryptographically validating your transaction and allocating {credits} credits to your account.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-sans">
                  Payment Confirmed! 🎉
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto font-sans leading-relaxed">
                  Your plan and credits have been unlocked! Official receipt #{confirmedOrder?.receiptNumber || ''} was sent to your email.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-semibold text-xs tracking-wider uppercase transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Payment could not be completed</div>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Form State */}
          {(status === 'form' || status === 'opening' || status === 'error') && (
            <form onSubmit={handleStartPayment} className="space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Billing & Invoice Info
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Billing Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Receipt Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Mobile Phone</span>
                      <span className="text-[10px] text-neutral-400">(Saved Cards)</span>
                    </label>
                    <input
                      type="tel"
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Optional Company & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Company / Org <span className="text-[10px] text-neutral-400">(Optional)</span></span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Docdril Softwares"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span>GSTIN Number <span className="text-[10px] text-neutral-400">(Optional)</span></span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveDetails"
                    checked={saveDetails}
                    onChange={(e) => setSaveDetails(e.target.checked)}
                    className="rounded text-neutral-900 focus:ring-neutral-900"
                  />
                  <label htmlFor="saveDetails" className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none cursor-pointer">
                    Save billing details for future invoices
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="saveCardPreference"
                    checked={saveCardPreference}
                    onChange={(e) => setSaveCardPreference(e.target.checked)}
                    className="rounded text-neutral-900 focus:ring-neutral-900"
                  />
                  <label htmlFor="saveCardPreference" className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none cursor-pointer">
                    Remember & store payment method securely for 1-click checkout (RBI compliant)
                  </label>
                </div>

                {/* Stored / Saved Payment Method Choice */}
                {savedMethod && (
                  <div className="p-3.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-sans block">
                      Saved Payment Method Detected
                    </span>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentChoice"
                          checked={useSavedMethod}
                          onChange={() => setUseSavedMethod(true)}
                          className="text-neutral-900 focus:ring-neutral-900"
                        />
                        <div className="flex-1 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {savedMethod.type === 'card'
                                ? `${savedMethod.brand || 'Card'} •••• ${savedMethod.last4 || '****'}`
                                : savedMethod.type === 'upi'
                                ? `UPI • ${savedMethod.vpa || 'Verified VPA'}`
                                : '1-Click Saved Method'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            1-Click
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentChoice"
                          checked={!useSavedMethod}
                          onChange={() => setUseSavedMethod(false)}
                          className="text-neutral-900 focus:ring-neutral-900"
                        />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Use a different card, UPI or NetBanking
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Net Price</span>
                  <span className="font-mono">₹{baseAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Integrated GST (18%)</span>
                  <span className="font-mono">₹{gstAmount}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white">
                  <span>Total Amount</span>
                  <span className="font-mono">₹{rawAmount}.00 INR</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={status === 'opening'}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {status === 'opening' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching secure checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Pay ₹{rawAmount} {isCreditPack ? `(+${credits} Credits)` : ''}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit Encrypted Payment • UPI, Cards & NetBanking</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
