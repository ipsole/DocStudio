'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppPreview } from '@/context/AppPreviewContext';
import { AppVisualMockup } from '@/components/apps/AppCard';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  Cpu,
  Layers,
  FileText,
  Box,
  Clapperboard,
  Type,
  Images,
  Scissors,
  Maximize2,
  Eraser,
  Mic,
  Presentation,
  Sliders,
  Music,
  BookOpen,
  Wrench,
  Boxes,
} from 'lucide-react';

export function AppPreviewModal() {
  const preview = useAppPreview();
  const router = useRouter();

  if (!preview || !preview.isOpen || !preview.currentApp) {
    return null;
  }

  const { currentApp, appsList, currentIndex, closePreview, nextApp, prevApp } = preview;

  const targetUrl =
    currentApp.applicationUrl ||
    (currentApp.subdomain ? `https://${currentApp.subdomain}.docdril.com` : null);

  const isLaunchable = currentApp.status === 'active' && Boolean(targetUrl);

  const cleanName = (currentApp.name || '')
    .replace(/\(demo\)|\(beta\)|\(alpha\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || currentApp.name;

  const renderIcon = () => {
    const iconClass = 'w-5 h-5 text-neutral-900 dark:text-white';
    switch (currentApp.icon) {
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Box':
        return <Box className={iconClass} />;
      case 'Clapperboard':
        return <Clapperboard className={iconClass} />;
      case 'Type':
        return <Type className={iconClass} />;
      case 'Images':
        return <Images className={iconClass} />;
      case 'Scissors':
        return <Scissors className={iconClass} />;
      case 'Maximize2':
        return <Maximize2 className={iconClass} />;
      case 'Eraser':
        return <Eraser className={iconClass} />;
      case 'Mic':
        return <Mic className={iconClass} />;
      case 'Presentation':
        return <Presentation className={iconClass} />;
      case 'Sliders':
        return <Sliders className={iconClass} />;
      case 'Music':
        return <Music className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Globe':
        return <Globe className={iconClass} />;
      case 'Layers':
        return <Layers className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      default:
        return <Boxes className={iconClass} />;
    }
  };

  const handleKnowMore = () => {
    closePreview();
    router.push(`/apps/${currentApp.slug}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={closePreview}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      {/* Side Arrow: Previous (Left) - Floating on larger screens */}
      {appsList.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevApp();
          }}
          aria-label="Previous application (Left Arrow)"
          title="Previous (← Arrow)"
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95 items-center justify-center cursor-pointer group"
        >
          <ChevronLeft className="w-6 h-6 text-neutral-300 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* Side Arrow: Next (Right) - Floating on larger screens */}
      {appsList.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextApp();
          }}
          aria-label="Next application (Right Arrow)"
          title="Next (→ Arrow)"
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95 items-center justify-center cursor-pointer group"
        >
          <ChevronRight className="w-6 h-6 text-neutral-300 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl lg:max-w-3xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl flex flex-col transition-all duration-300 animate-modal-pop"
      >
        {/* 1. Header Visual Preview / Mockup Area */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <AppVisualMockup app={currentApp} />

          {/* Top Overlays */}
          <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
            {/* Index & Category Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono pointer-events-auto">
              <span className="font-bold text-neutral-200">
                {String(currentIndex + 1).padStart(2, '0')} / {String(appsList.length).padStart(2, '0')}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="uppercase tracking-wider text-neutral-400 font-semibold">
                {currentApp.category}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closePreview}
              aria-label="Close preview modal"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 text-neutral-300 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer pointer-events-auto shadow-md"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">ESC</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile In-Preview Quick Nav Arrows (Visible on small screens) */}
          {appsList.length > 1 && (
            <div className="md:hidden absolute bottom-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevApp();
                }}
                aria-label="Previous application"
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextApp();
                }}
                aria-label="Next application"
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Insider Main Information Body */}
        <div className="p-5 sm:p-7 space-y-6 flex-1 bg-white dark:bg-neutral-950">
          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-900 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 shadow-sm">
                {renderIcon()}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                  {cleanName}
                </h2>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-0.5">
                  DOCDRIL ECOSYSTEM // {currentApp.category}
                </p>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                LIVE APPLICATION
              </span>
              {currentApp.version && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  v{currentApp.version}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
              Overview & Capabilities
            </h3>
            <p className="text-sm sm:text-[15px] text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed">
              {currentApp.description || currentApp.shortDescription}
            </p>
          </div>

          {/* Insider Architecture / Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono uppercase font-semibold">
                <Globe className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                <span>Web Endpoint</span>
              </div>
              <p className="font-mono text-xs font-bold text-neutral-950 dark:text-white truncate">
                {currentApp.subdomain ? `${currentApp.subdomain}.docdril.com` : 'docdril.com'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono uppercase font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Authentication</span>
              </div>
              <p className="font-sans text-xs font-bold text-neutral-950 dark:text-white">
                Docdril Unified SSO
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono uppercase font-semibold">
                <Cpu className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                <span>Engine Type</span>
              </div>
              <p className="font-sans text-xs font-bold text-neutral-950 dark:text-white">
                Client / Cloud Hybrid
              </p>
            </div>
          </div>

          {/* Tags */}
          {currentApp.tags && currentApp.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {currentApp.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3. Action Bar: Know More vs Launch */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-sans text-neutral-500 dark:text-neutral-400 hidden sm:block">
            Use <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px] text-neutral-800 dark:text-neutral-200">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px] text-neutral-800 dark:text-neutral-200">→</kbd> to browse softwares
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Know More Button */}
            <button
              type="button"
              onClick={handleKnowMore}
              className="group/btn flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none"
            >
              <span>Know More</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>

            {/* Launch Button */}
            {isLaunchable && targetUrl ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-md hover:shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none"
              >
                <span>Launch Software</span>
                <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleKnowMore}
                className="group/btn flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-md hover:shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none"
              >
                <span>Explore Details</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
