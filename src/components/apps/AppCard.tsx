'use client';

import React from 'react';
import Link from 'next/link';
import { DocApp } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ExternalLink,
  ArrowRight,
  Palette,
  Clapperboard,
  Layers,
  Wrench,
  Boxes,
  Lock,
} from 'lucide-react';

interface AppCardProps {
  app: DocApp;
  showLaunchDirect?: boolean;
}

export function AppCard({ app, showLaunchDirect = true }: AppCardProps) {
  const isLaunchable = app.status === 'active' && Boolean(app.applicationUrl);

  // Render high-fidelity visual mockups in the card thumbnail
  const renderVisualMockup = () => {
    switch (app.category.toLowerCase()) {
      case 'creative':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 p-5 flex flex-col justify-between overflow-hidden text-white select-none">
            {/* Dot grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#404040_1px,transparent_1px)] [background-size:14px_14px] opacity-40 pointer-events-none" />

            {/* Top Toolbar Mockup */}
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-700/60 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                <span className="ml-2 font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                  CANVAS / ARTBOARD_01
                </span>
              </div>
              <span className="font-mono text-[9px] bg-neutral-800 px-1.5 py-0.5 border border-neutral-700 text-neutral-300">
                100%
              </span>
            </div>

            {/* Vector artboard shape */}
            <div className="relative z-10 my-auto flex items-center justify-center">
              <div className="relative w-36 h-20 border border-neutral-600 bg-neutral-800/80 shadow-lg flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-neutral-400 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                {/* Transform anchor points */}
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-neutral-900" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-neutral-900" />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-neutral-900" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-neutral-900" />
              </div>
            </div>

            {/* Bottom info strip */}
            <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400">
              <span>W: 1920 H: 1080</span>
              <span className="text-emerald-400 font-semibold">VECTOR ENGINE</span>
            </div>
          </div>
        );

      case 'animation':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none">
            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[10px] text-neutral-300 uppercase tracking-wider">
                  MOTION SEQUENCER
                </span>
              </div>
              <span className="font-mono text-[9px] text-amber-400 font-bold">60 FPS</span>
            </div>

            {/* Kinetic Typography Graphic */}
            <div className="relative z-10 my-auto text-center space-y-1">
              <div className="text-xl font-bold tracking-tighter uppercase text-white font-sans">
                KINETIC MOTION
              </div>
              <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                TIMELINE • KEYFRAMES • EXPORT
              </p>
            </div>

            {/* Timeline Tracks Mockup */}
            <div className="relative z-10 space-y-1.5 pt-2 border-t border-neutral-800">
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-amber-400" />
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-neutral-500" />
              </div>
            </div>
          </div>
        );

      case 'productivity':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 flex flex-col justify-between overflow-hidden text-white select-none">
            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-[10px] text-neutral-300 uppercase tracking-wider">
                  DOCUMENT PIPELINE
                </span>
              </div>
              <span className="font-mono text-[9px] text-blue-400 font-semibold">AUTOMATED</span>
            </div>

            {/* Node flow diagram */}
            <div className="relative z-10 my-auto flex items-center justify-center gap-2">
              <div className="px-2 py-1 bg-neutral-800 border border-neutral-700 font-mono text-[9px] text-neutral-300">
                PDF IN
              </div>
              <span className="text-neutral-500 font-mono text-xs">→</span>
              <div className="px-2.5 py-1 bg-blue-600 font-mono text-[9px] text-white font-bold shadow-md">
                PROCESS
              </div>
              <span className="text-neutral-500 font-mono text-xs">→</span>
              <div className="px-2 py-1 bg-neutral-800 border border-neutral-700 font-mono text-[9px] text-neutral-300">
                EXPORT
              </div>
            </div>

            {/* Bottom status */}
            <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400">
              <span>ZERO CONFIG</span>
              <span className="text-emerald-400">READY</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="relative w-full h-full bg-neutral-900 p-5 flex flex-col justify-between overflow-hidden text-white select-none">
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                {app.category}
              </span>
              <span className="font-mono text-[9px] text-neutral-400">{app.version || '1.0.0'}</span>
            </div>
            <div className="relative z-10 my-auto flex flex-col items-center justify-center gap-2">
              <Boxes className="w-8 h-8 text-neutral-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                {app.name}
              </span>
            </div>
            <div className="relative z-10 text-right font-mono text-[9px] text-neutral-500">
              DOCDRIL ECOSYSTEM
            </div>
          </div>
        );
    }
  };

  const renderSmallIcon = () => {
    const iconClass = 'w-3.5 h-3.5 text-neutral-950';
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
    <div className="group relative flex flex-col rounded-none transition-all duration-200">
      {/* 1. Visual Thumbnail Preview Area (like Dribbble card) */}
      <Link
        href={`/apps/${app.slug}`}
        className="relative block w-full aspect-[16/10] border border-neutral-300 group-hover:border-neutral-950 transition-colors overflow-hidden bg-neutral-900"
      >
        {renderVisualMockup()}

        {/* Hover overlay with action */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 p-4">
          <span className="px-3.5 py-1.5 border border-white bg-white text-neutral-950 font-sans text-xs font-semibold uppercase tracking-tight flex items-center gap-1.5 shadow-lg">
            Details
            <ArrowRight className="w-3.5 h-3.5" />
          </span>

          {isLaunchable && (
            <a
              href={app.applicationUrl!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-1.5 border border-white text-white font-sans text-xs font-semibold uppercase tracking-tight hover:bg-white hover:text-neutral-950 transition-colors flex items-center gap-1.5 shadow-lg"
            >
              Launch
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </Link>

      {/* 2. Metadata Bar directly beneath thumbnail */}
      <div className="pt-3 pb-1 flex items-center justify-between gap-2">
        {/* Left: Creator Avatar + App Name + Team Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 border border-neutral-900 bg-white flex items-center justify-center shrink-0">
            {renderSmallIcon()}
          </div>
          <Link
            href={`/apps/${app.slug}`}
            className="font-bold text-sm text-neutral-950 truncate hover:underline tracking-tight"
          >
            {app.name}
          </Link>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-1.5 py-0.5 border border-neutral-200 shrink-0">
            DOCDRIL
          </span>
        </div>

        {/* Right: Status badge & launch button */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={app.status} />

          {showLaunchDirect && isLaunchable && (
            <a
              href={app.applicationUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-950 p-1 transition-colors"
              title="Launch Application"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Short 1-line caption */}
      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
        {app.shortDescription}
      </p>
    </div>
  );
}
