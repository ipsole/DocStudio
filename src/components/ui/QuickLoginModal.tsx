'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSvg } from './QRCodeSvg';
import { Button } from './Button';
import {
  createQRLoginSession,
  subscribeToQRLogin,
  cancelQRLogin,
} from '@/lib/firebase/db';
import {
  QrCode,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface QuickLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  userEmail: string;
}

export function QuickLoginModal({
  isOpen,
  onClose,
  userId,
  username,
  userEmail,
}: QuickLoginModalProps) {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [connectedDevice, setConnectedDevice] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const activeTokenRef = useRef<string | null>(null);

  const generateSession = useCallback(async () => {
    if (!userId) return;
    setIsGenerating(true);
    setIsSuccess(false);
    setConnectedDevice('');

    try {
      if (activeTokenRef.current) {
        cancelQRLogin(activeTokenRef.current).catch(() => {});
      }

      const id = await createQRLoginSession(userId, username || 'user', userEmail || '');
      activeTokenRef.current = id;
      setTokenId(id);
      setSecondsRemaining(180);
    } catch (err) {
      console.error('[QuickLoginModal] Error creating QR login session:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [userId, username, userEmail]);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      generateSession();
    } else {
      if (activeTokenRef.current) {
        cancelQRLogin(activeTokenRef.current).catch(() => {});
        activeTokenRef.current = null;
      }
      setTokenId(null);
      setIsSuccess(false);
    }
  }, [isOpen, generateSession]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !tokenId || isSuccess) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, tokenId, isSuccess]);

  // Real-time listener for redemption
  useEffect(() => {
    if (!isOpen || !tokenId || isSuccess) return;

    const unsubscribe = subscribeToQRLogin(tokenId, (session) => {
      if (session && session.status === 'authenticated') {
        setIsSuccess(true);
        const devName = session.redeemedByDevice?.deviceName || 'New Device';
        setConnectedDevice(devName);

        // Auto close after 2.5 seconds
        setTimeout(() => {
          onClose();
        }, 2500);
      }
    });

    return () => unsubscribe();
  }, [isOpen, tokenId, isSuccess, onClose]);

  if (!isOpen) return null;

  // Determine target URL with production domain docstudio.docdril.com fallback
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrl = isProd
    ? 'https://docstudio.docdril.com'
    : typeof window !== 'undefined'
    ? window.location.origin
    : 'https://docstudio.docdril.com';

  const cleanHandle = username ? username.replace('@', '') : 'user';
  const qrUrl = tokenId
    ? `${baseUrl}/auth/quick-login?token=${tokenId}&u=${encodeURIComponent(cleanHandle)}`
    : '';

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isExpired = secondsRemaining === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 font-sans space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
                Instant QR Login
              </h3>
              <p className="text-[11px] text-neutral-500 font-sans">
                Scan to login on another device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                Device Connected!
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Successfully authorized on <span className="font-semibold text-neutral-800 dark:text-neutral-200">{connectedDevice}</span>
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                Session active on docstudio.docdril.com
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* QR Code Container */}
            <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80">
              {isGenerating ? (
                <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-2 text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Generating secure code...</span>
                </div>
              ) : isExpired ? (
                <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-3 text-center px-4 bg-white dark:bg-neutral-900 rounded-xl">
                  <Clock className="w-8 h-8 text-neutral-400" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">QR Code Expired</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Codes expire after 3 mins for security</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={generateSession}
                    className="gap-1.5 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </Button>
                </div>
              ) : (
                <>
                  <QRCodeSvg value={qrUrl} size={220} />
                  {/* Subtle watermarked account badge below QR */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-400">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span>@{cleanHandle}</span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-[10px] text-neutral-400">docstudio.docdril.com</span>
                  </div>
                </>
              )}
            </div>

            {/* Instructions & Live Timer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Point camera to scan</span>
                </div>

                {!isExpired && (
                  <div
                    className={`flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      secondsRemaining < 30
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{formatTimer(secondsRemaining)}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed text-center">
                Instantly signs in your secondary phone, tablet, or browser with encrypted one-time credentials. No password entry required.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={generateSession}
                disabled={isGenerating}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Refresh Code</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
