'use client';

import React from 'react';
import Link from 'next/link';
import { DocApp } from '@/types';
import {
  ExternalLink,
  ArrowRight,
  Palette,
  Clapperboard,
  Layers,
  Wrench,
  Boxes,
  Sparkles,
} from 'lucide-react';

interface AppCardProps {
  app: DocApp;
  showLaunchDirect?: boolean;
}

export function AppCard({ app, showLaunchDirect = true }: AppCardProps) {
  const isLaunchable = app.status === 'active' && Boolean(app.applicationUrl);

  const renderVisualMockup = () => {
    switch (app.category.toLowerCase()) {
      case 'creative':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
            {/* Ambient neon radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:14px_14px] opacity-40 pointer-events-none" />

            {/* Top Toolbar */}
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="ml-2 font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                  CANVAS / ARTBOARD
                </span>
              </div>
              <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                100%
              </span>
            </div>

            {/* Vector artboard shape */}
            <div className="relative z-10 my-auto flex items-center justify-center">
              <div className="relative w-36 h-20 border border-neutral-700 bg-neutral-900/90 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center rounded">
                <div className="w-8 h-8 rounded-full border border-neutral-600 bg-neutral-800/80 flex items-center justify-center shadow-inner">
                  <Palette className="w-4 h-4 text-emerald-400" />
                </div>
                {/* Transform anchor points */}
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-neutral-900 rounded-sm" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-neutral-900 rounded-sm" />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-neutral-900 rounded-sm" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-neutral-900 rounded-sm" />
              </div>
            </div>

            {/* Bottom info strip */}
            <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
              <span>W: 1920 H: 1080</span>
              <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Vector Engine
              </span>
            </div>
          </div>
        );

      case 'animation':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
            {/* Ambient orange glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                  MOTION SEQUENCER
                </span>
              </div>
              <span className="font-mono text-[9px] text-amber-400 font-bold bg-amber-950/60 border border-amber-900/60 px-1.5 py-0.5 rounded">
                60 FPS
              </span>
            </div>

            {/* Kinetic Typography Graphic */}
            <div className="relative z-10 my-auto text-center space-y-1">
              <div className="text-xl font-black tracking-tighter uppercase text-white font-sans drop-shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                KINETIC MOTION
              </div>
              <p className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">
                TIMELINE • KEYFRAMES • EXPORT
              </p>
            </div>

            {/* Timeline Tracks Mockup */}
            <div className="relative z-10 space-y-1.5 pt-2 border-t border-neutral-800">
              <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div className="h-full w-2/3 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" />
              </div>
              <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div className="h-full w-1/3 bg-neutral-600 rounded-full" />
              </div>
            </div>
          </div>
        );

      case 'productivity':
      case 'utilities':
      default:
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
            {/* Ambient cyan glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                  DOCUMENT PIPELINE
                </span>
              </div>
              <span className="font-mono text-[9px] text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-900/60 px-1.5 py-0.5 rounded">
                AUTOMATED
              </span>
            </div>

            {/* Workflow steps graphic */}
            <div className="relative z-10 my-auto flex items-center justify-center gap-2 font-mono text-[10px]">
              <span className="px-2 py-1 border border-neutral-700 bg-neutral-900 text-neutral-300 rounded">
                INPUT
              </span>
              <span className="text-cyan-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-cyan-600 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded">
                PROCESS
              </span>
              <span className="text-cyan-400 font-bold">→</span>
              <span className="px-2 py-1 border border-neutral-700 bg-neutral-900 text-neutral-300 rounded">
                EXPORT
              </span>
            </div>

            <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-500 border-t border-neutral-800 pt-2">
              <span>ZERO CONFIG</span>
              <span className="text-cyan-400 font-semibold">READY</span>
            </div>
          </div>
        );
    }
  };

  const cleanName = React.useMemo(() => {
    let raw = (app.name || '')
      .replace(/\(demo\)|\(beta\)|\(alpha\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const words = raw.split(' ').filter(Boolean);
    if (words.length > 2) {
      return words.slice(0, 2).join(' ');
    }
    return raw || app.name;
  }, [app.name]);

  const renderSmallIcon = () => {
    const iconClass = 'w-4.5 h-4.5 text-neutral-800 dark:text-neutral-200';
    switch (app.icon) {
      case 'Palette':
        return <Palette className={iconClass} />;
      case 'Clapperboard':
        return <Clapperboard className={iconClass} />;
      case 'Layers':
        return <Layers className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      default:
        return <Boxes className={iconClass} />;
    }
  };

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-950/80 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none backdrop-blur-xl">
      {/* 1. Visual Thumbnail Preview Container (Flush edge-to-edge on top, left, and right) */}
      <Link
        href={`/apps/${app.slug}`}
        className="relative block w-full aspect-[16/10] overflow-hidden border-b border-neutral-200 dark:border-neutral-800/80 bg-neutral-950"
      >
        {renderVisualMockup()}

        {/* Hover overlay with action */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-4">
          <span className="px-3.5 py-1.5 border border-neutral-600 bg-neutral-900/90 text-white font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 rounded hover:border-white transition-colors">
            Details
            <ArrowRight className="w-3.5 h-3.5" />
          </span>

          {isLaunchable && (
            <a
              href={app.applicationUrl!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-1.5 bg-neutral-950 text-white dark:bg-white dark:text-black font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
            >
              Launch
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </Link>

      {/* 2. Metadata & Text Content Container */}
      <div className="p-3.5 flex flex-col justify-between flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Bare Icon + 1-2 Word Name */}
          <Link
            href={`/apps/${app.slug}`}
            className="flex items-center gap-2 min-w-0 group/title"
          >
            <span className="shrink-0 text-neutral-800 dark:text-neutral-200 group-hover/title:text-black dark:group-hover/title:text-white transition-colors">
              {renderSmallIcon()}
            </span>
            <span className="font-bold text-sm text-neutral-950 dark:text-white truncate tracking-tight group-hover/title:text-neutral-600 dark:group-hover/title:text-neutral-300 transition-colors">
              {cleanName}
            </span>
          </Link>

          {/* Right: Explore Button */}
          <Link
            href={`/apps/${app.slug}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors shrink-0 cursor-pointer"
          >
            <span>Explore</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 3. Short description in muted silver */}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1 font-sans">
          {app.shortDescription}
        </p>
      </div>
    </div>
  );
}
