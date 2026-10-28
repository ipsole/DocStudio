'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X, Sparkles, Layers, Zap } from 'lucide-react';

export interface TourStep {
  title: string;
  tag: string;
  description: string;
  targetId?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    tag: 'Unified Ecosystem',
    title: 'All Software in One Place',
    description:
      'One central identity unlocks the entire suite of Docdril creative applications, motion tools, and document pipelines.',
    targetId: 'tour-apps-catalog',
  },
  {
    tag: 'Shared Quotas',
    title: 'Cross-App Generation Credits',
    description:
      'Your monthly credits flow seamlessly across Canvas, Motion, and Document Pipelines with real-time balance tracking.',
    targetId: 'tour-quota-card',
  },
  {
    tag: 'Instant Launchpad',
    title: 'Zero Login Friction',
    description:
      'Launch directly into any connected software or subdomain without ever entering your password again.',
    targetId: 'tour-launchpad',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMain?: () => void;
}

export function GuidedTour({ isOpen, onClose, onNavigateToMain }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      // Smoothly scroll to top or target if present
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Optionally scroll toward highlighted section
      const targetEl = TOUR_STEPS[nextStep].targetId
        ? document.getElementById(TOUR_STEPS[nextStep].targetId!)
        : null;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('docstudio_tour_completed', 'true');
    } catch {
      // ignore
    }
    onClose();
    if (onNavigateToMain) {
      onNavigateToMain();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none flex flex-col justify-end sm:justify-end p-4 sm:p-8">
      {/* Subtle backdrop overlay with soft vignette */}
      <div
        onClick={handleSkip}
        className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
      />

      {/* Floating Guided Tour Card */}
      <div className="relative z-20 pointer-events-auto mx-auto w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 animate-fade-in-up">
        {/* Top Header: Tag & Dismiss '✕' */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span>
              {step.tag} • {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Skip Tour"
            title="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tour Step Content: Short & Essential */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg sm:text-xl font-serif font-normal text-neutral-950 dark:text-white tracking-[0.01em]">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            {step.description}
          </p>
        </div>

        {/* Bottom Navigation: Step Dots, Skip link, and Next pill button */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-900">
          {/* Step Indicators */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-neutral-950 dark:bg-white'
                    : 'w-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-400'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer px-2 py-1"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{isLast ? 'Got it' : 'Next'}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
