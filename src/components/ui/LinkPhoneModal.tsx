'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ArrowLeft, RotateCcw, AlertCircle, CheckCircle2, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';
import { useAuth } from '@/context/AuthContext';
import type { ConfirmationResult } from 'firebase/auth';

interface LinkPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phoneNumber: string) => void;
}

export function LinkPhoneModal({ isOpen, onClose, onSuccess }: LinkPhoneModalProps) {
  const { setupRecaptcha, startPhoneLink, confirmPhoneLink } = useAuth();

  const [countryCode, setCountryCode] = useState('+91');
  const [nationalNumber, setNationalNumber] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setStep('input');
    setNationalNumber('');
    setOtpCode('');
    setError(null);
    setSuccess(null);
    setConfirmationResult(null);
    onClose();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = nationalNumber.replace(/[\s-]/g, '').replace(/^0+/, '');
    if (!cleanDigits) {
      setError('Please enter a valid phone number.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${cleanDigits}`;
      const verifier = setupRecaptcha('recaptcha-link-phone-container');
      const confirmation = await startPhoneLink(fullPhoneNumber, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/credential-already-in-use') {
        setError('This phone number is already linked to another Docdril account. Please use a different phone number.');
      } else if (fbErr.code === 'auth/invalid-phone-number') {
        setError(`Please enter a valid phone number for country code ${countryCode}.`);
      } else if (fbErr.code === 'auth/too-many-requests' || fbErr.code === 'auth/quota-exceeded') {
        setError('SMS quota limit reached. Please try again later.');
      } else {
        setError(fbErr.message || 'Failed to send SMS verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !confirmationResult) return;

    setError(null);
    setLoading(true);

    try {
      const cleanDigits = nationalNumber.replace(/[\s-]/g, '').replace(/^0+/, '');
      const fullPhoneNumber = `${countryCode}${cleanDigits}`;
      await confirmPhoneLink(confirmationResult, otpCode.trim());
      setSuccess(`Phone number ${fullPhoneNumber} is now linked to your unified account!`);
      if (onSuccess) onSuccess(fullPhoneNumber);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/invalid-verification-code') {
        setError('Incorrect 6-digit code. Please verify and try again.');
      } else if (fbErr.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new code.');
      } else if (fbErr.code === 'auth/credential-already-in-use') {
        setError('This phone number is already linked to another Docdril account.');
      } else {
        setError(fbErr.message || 'Failed to verify code.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-link-phone-container"></div>

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-neutral-900 dark:text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-sans text-neutral-950 dark:text-white">
                {step === 'input' ? 'Link Phone Number' : 'Verify SMS Code'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                {step === 'input'
                  ? 'Connect a mobile number for 1-tap SMS OTP login without changing your UID.'
                  : 'Enter the 6-digit verification code dispatched to your mobile.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 text-xs font-sans flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-xs font-sans flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Input Phone */}
        {step === 'input' && !success && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <PhoneInputWithCountry
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              nationalNumber={nationalNumber}
              setNationalNumber={setNationalNumber}
              disabled={loading}
              autoFocus
            />

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 font-sans space-y-1">
              <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                🔒 Enterprise Account Linking Guarantee:
              </p>
              <p>
                Linking your phone will <strong>not</strong> create a new account or reset your credits. Your existing UID, active subscriptions, and preferences remain unchanged.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={loading} disabled={loading || !nationalNumber.trim()}>
                Send SMS Code
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 'otp' && !success && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs font-sans">
              <div>
                <span className="text-neutral-500">Code sent to:</span>{' '}
                <strong className="font-mono text-neutral-950 dark:text-white font-bold bg-neutral-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 ml-1">
                  {countryCode} {nationalNumber}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setOtpCode('');
                  setError(null);
                }}
                disabled={loading}
                className="text-xs text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div>
              <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                6-Digit SMS Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-xl border-2 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-neutral-950 dark:focus:border-white bg-white dark:bg-neutral-900 pl-10 pr-3.5 py-2.5 text-base tracking-[0.3em] font-mono font-bold text-center text-neutral-900 dark:text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>

              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" size="md" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={loading} disabled={loading || otpCode.length < 6}>
                  Verify & Link Phone
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
