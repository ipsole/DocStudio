'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
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
    const iconClass = 'w-6 h-6 text-neutral-950 dark:text-white';
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

  // Prefetch the dedicated app page in the background while user browses the modal
  useEffect(() => {
    if (currentApp?.slug) {
      router.prefetch(`/apps/${currentApp.slug}`);
    }
  }, [currentApp?.slug, router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={closePreview}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8 md:p-12 lg:p-16 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      {/* Centered Modal Wrapper with tightly anchored side navigation */}
      <div className="relative w-full max-w-2xl lg:max-w-3xl flex items-center justify-center">
        {/* Side Arrow: Previous (Left) - Hugging card */}
        {appsList.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevApp();
            }}
            aria-label="Previous application (Left Arrow)"
            title="Previous (← Arrow)"
            className="hidden sm:flex absolute -left-5 md:-left-12 lg:-left-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-white/15 hover:border-white/40 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 items-center justify-center cursor-pointer group"
          >
            <ChevronLeft className="w-5 h-5 md:w-5.5 md:h-5.5 text-neutral-300 group-hover:text-white transition-colors" />
          </button>
        )}

        {/* Side Arrow: Next (Right) - Hugging card */}
        {appsList.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextApp();
            }}
            aria-label="Next application (Right Arrow)"
            title="Next (→ Arrow)"
            className="hidden sm:flex absolute -right-5 md:-right-12 lg:-right-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-white/15 hover:border-white/40 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 items-center justify-center cursor-pointer group"
          >
            <ChevronRight className="w-5 h-5 md:w-5.5 md:h-5.5 text-neutral-300 group-hover:text-white transition-colors" />
          </button>
        )}

        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl flex flex-col transition-all duration-300 animate-modal-pop"
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

            {/* Close Button: Pure Cross (No ESC, prominent on all screen sizes) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closePreview();
              }}
              aria-label="Close modal"
              title="Close modal (✕)"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 hover:bg-black text-white hover:text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer pointer-events-auto shadow-xl hover:scale-110 active:scale-95 shrink-0"
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
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
        <div className="p-5 sm:p-6 space-y-5 flex-1 bg-white dark:bg-neutral-950">
          {/* Title & Live Link Preview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-900 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 text-neutral-950 dark:text-white">
                {renderIcon()}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                    {cleanName}
                  </h2>
                  {targetUrl && (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:text-black dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-sm"
                      title={`Open ${targetUrl}`}
                    >
                      <Globe className="w-3 h-3 text-emerald-500" />
                      <span>{targetUrl.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                    </a>
                  )}
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-0.5">
                  DOCDRIL ECOSYSTEM // {currentApp.category}
                </p>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
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

          {/* Main Info + Action Showcase Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {/* Left 2 Cols: Overview & Capabilities & Tags */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                  Overview & Capabilities
                </h3>
                <p className="text-sm sm:text-[15px] text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed">
                  {currentApp.description || currentApp.shortDescription}
                </p>
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

            {/* Right 1 Col: Showcase Sidebar (Specs + Action Buttons) */}
            <div className="md:col-span-1 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">Authentication</span>
                  <span className="font-sans font-bold text-neutral-900 dark:text-white text-xs">Docdril SSO</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-neutral-200/60 dark:border-neutral-800/80 pt-2">
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">Engine</span>
                  <span className="font-sans font-bold text-neutral-900 dark:text-white text-xs">Client / Cloud</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-neutral-200/60 dark:border-neutral-800/80 pt-2">
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">Ecosystem</span>
                  <span className="font-sans font-bold text-emerald-600 dark:text-emerald-400 text-xs">Verified Active</span>
                </div>
              </div>

              {/* Direct Action Buttons in Showcase */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
                {isLaunchable && targetUrl ? (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-sm hover:shadow transition-all"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
                <Link
                  href={`/apps/${currentApp.slug}`}
                  onClick={closePreview}
                  prefetch={true}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-[0.98]"
                >
                  <span>Know More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
