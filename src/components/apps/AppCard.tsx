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
  FileText,
  Box,
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
  Globe,
  Radio,
  Workflow,
  Cpu,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AppCardProps {
  app: DocApp;
  showLaunchDirect?: boolean;
}

export function AppCard({ app, showLaunchDirect = true }: AppCardProps) {
  const isLaunchable = app.status === 'active' && Boolean(app.applicationUrl);

  const renderVisualMockup = () => {
    const slug = (app.slug || '').toLowerCase();

    // 1. Founder Proposal Studio
    if (slug.includes('proposal')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                PROPOSAL STUDIO
              </span>
            </div>
            <span className="font-mono text-[9px] text-blue-400 font-bold bg-blue-950/60 border border-blue-900/60 px-1.5 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              E-SIGN
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-xs font-semibold text-white">CLIENT CONTRACT</span>
            </div>
            <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
              SCOPE • PRICING • LIVE PORTAL
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>SECURE VAULT</span>
            <span className="text-blue-400 font-semibold uppercase tracking-wider">FOUNDER READY</span>
          </div>
        </div>
      );
    }

    // 2. Packaging & 3D Mockup Studio
    if (slug.includes('mockup')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                3D PACKAGING MOCKUP
              </span>
            </div>
            <span className="font-mono text-[9px] text-amber-400 font-bold bg-amber-950/60 border border-amber-900/60 px-1.5 py-0.5 rounded">
              4K / 8K
            </span>
          </div>

          <div className="relative z-10 my-auto flex items-center justify-center">
            <div className="relative w-28 h-20 border border-amber-500/40 bg-gradient-to-b from-neutral-800/80 to-neutral-900/90 rounded shadow-[0_0_25px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center">
              <Box className="w-7 h-7 text-amber-300" />
              <span className="font-mono text-[8px] text-amber-200 mt-1 uppercase tracking-wider">THREE.JS STUDIO</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>REAL-TIME LIGHTS</span>
            <span className="text-amber-400 font-semibold uppercase tracking-wider">PHOTOREALISTIC</span>
          </div>
        </div>
      );
    }

    // 3. TypoMotion Studio
    if (slug.includes('typomotion')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                KINETIC TYPOGRAPHY
              </span>
            </div>
            <span className="font-mono text-[9px] text-yellow-400 font-bold bg-yellow-950/60 border border-yellow-900/60 px-1.5 py-0.5 rounded">
              WEBCODECS
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-xl font-black tracking-tighter uppercase text-white font-sans drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              VIRAL REELS
            </div>
            <p className="font-mono text-[9px] text-yellow-400/90 uppercase tracking-widest font-semibold">
              SPEECH SYNC • 3D DEPTH • 60 FPS
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>HARDWARE GPU</span>
            <span className="text-yellow-400 font-semibold uppercase tracking-wider">ZERO DROP FRAMES</span>
          </div>
        </div>
      );
    }

    // 4. AutoCutter
    if (slug.includes('auto-cutter')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                SILENCE REMOVAL
              </span>
            </div>
            <span className="font-mono text-[9px] text-rose-400 font-bold bg-rose-950/60 border border-rose-900/60 px-1.5 py-0.5 rounded">
              SILERO VAD
            </span>
          </div>

          {/* Audio Waveform visualization */}
          <div className="relative z-10 my-auto flex items-center justify-center gap-1 h-12">
            {[40, 75, 20, 95, 60, 15, 10, 85, 90, 30, 10, 10, 70, 80].map((h, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full ${h <= 20 ? 'bg-rose-500/40' : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>ZERO-CROSSING</span>
            <span className="text-rose-400 font-semibold uppercase tracking-wider">NLE XML EXPORT</span>
          </div>
        </div>
      );
    }

    // 5. Media Scaler AI
    if (slug.includes('media-scaler') || slug.includes('scaler')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                AI SUPER-RESOLUTION
              </span>
            </div>
            <span className="font-mono text-[9px] text-purple-400 font-bold bg-purple-950/60 border border-purple-900/60 px-1.5 py-0.5 rounded">
              2X → 8X
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-lg font-black tracking-wider uppercase text-white font-sans">
              REAL-ESRGAN
            </div>
            <p className="font-mono text-[9px] text-purple-300 uppercase tracking-widest font-semibold">
              APPLE SILICON METAL • CUDA
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>IMAGE & VIDEO</span>
            <span className="text-purple-400 font-semibold uppercase tracking-wider">LOSSLESS AUDIO</span>
          </div>
        </div>
      );
    }

    // 6. Wiper AI
    if (slug.includes('wiper')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Eraser className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                WATERMARK REMOVER
              </span>
            </div>
            <span className="font-mono text-[9px] text-teal-400 font-bold bg-teal-950/60 border border-teal-900/60 px-1.5 py-0.5 rounded">
              LAMA INPAINTING
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-lg font-black tracking-wider uppercase text-white font-sans drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              OBJECT ERASE
            </div>
            <p className="font-mono text-[9px] text-teal-300 uppercase tracking-widest">
              LOGOS • SUBTITLES • TIMESTAMPS
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>TEMPORAL SYNC</span>
            <span className="text-teal-400 font-semibold uppercase tracking-wider">ZERO ARTIFACTS</span>
          </div>
        </div>
      );
    }

    // 7. Voice Studio
    if (slug.includes('voice')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                AI VOICEOVER
              </span>
            </div>
            <span className="font-mono text-[9px] text-pink-400 font-bold bg-pink-950/60 border border-pink-900/60 px-1.5 py-0.5 rounded">
              STUDIO
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-lg font-black tracking-wider uppercase text-white font-sans drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              VOICE DESIGN
            </div>
            <p className="font-mono text-[9px] text-pink-300 uppercase tracking-widest">
              SCRIPT EDITOR • EMOTION • CLONING
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>STUDIO MASTERING</span>
            <span className="text-pink-400 font-semibold uppercase tracking-wider">HIGH FIDELITY</span>
          </div>
        </div>
      );
    }

    // 8. SlideShowcaser
    if (slug.includes('slide')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Presentation className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                3D VISUAL SHOWCASE
              </span>
            </div>
            <span className="font-mono text-[9px] text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-900/60 px-1.5 py-0.5 rounded">
              3D ORBIT
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-lg font-black tracking-wider uppercase text-white font-sans drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              PERSPECTIVE CARDS
            </div>
            <p className="font-mono text-[9px] text-indigo-300 uppercase tracking-widest">
              KEYFRAMES • LIGHTING • 4K EXPORT
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>THREE.JS ENGINE</span>
            <span className="text-indigo-400 font-semibold uppercase tracking-wider">MOTION READY</span>
          </div>
        </div>
      );
    }

    // 9. FLUTE Audio Station
    if (slug.includes('flute')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                FLUTE SOUND STATION
              </span>
            </div>
            <span className="font-mono text-[9px] text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-900/60 px-1.5 py-0.5 rounded">
              432Hz / 528Hz
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-lg font-black tracking-wider uppercase text-white font-sans drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              BINAURAL SYNTH
            </div>
            <p className="font-mono text-[9px] text-cyan-300 uppercase tracking-widest">
              SFX BRIDGE • AMBIENT LAYERS • PREMIERE XML
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>OBSIDIAN AUDIO</span>
            <span className="text-cyan-400 font-semibold uppercase tracking-wider">LOSSLESS WAV</span>
          </div>
        </div>
      );
    }

    // 10. Docdril Image Studio (Image & PDF workstation)
    if (slug.includes('image')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Images className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
                IMAGE STUDIO & PDF
              </span>
            </div>
            <span className="font-mono text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/60 px-1.5 py-0.5 rounded">
              BATCH CONVERT
            </span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-1">
            <div className="text-lg font-black tracking-wider uppercase text-white font-sans drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              ORGANIZE • EXIF • PDF
            </div>
            <p className="font-mono text-[9px] text-emerald-300 uppercase tracking-widest">
              WEBP • PNG • JPEG • AVIF • TIFF
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
            <span>DRAG & DROP</span>
            <span className="text-emerald-400 font-semibold uppercase tracking-wider">ORDERED PDF</span>
          </div>
        </div>
      );
    }

    // Default Fallback by Category
    switch (app.category.toLowerCase()) {
      case 'creative':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
                <span className="ml-2 font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                  CREATIVE SUITE
                </span>
              </div>
              <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                STUDIO
              </span>
            </div>

            <div className="relative z-10 my-auto flex items-center justify-center">
              <div className="relative w-36 h-20 border border-neutral-700 bg-neutral-900/90 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center rounded">
                <Palette className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between font-mono text-[9px] text-neutral-400 border-t border-neutral-900 pt-2">
              <span>CANVAS & ASSETS</span>
              <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                VECTOR ENGINE
              </span>
            </div>
          </div>
        );

      case 'animation':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
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

            <div className="relative z-10 my-auto text-center space-y-1">
              <div className="text-xl font-black tracking-tighter uppercase text-white font-sans drop-shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                KINETIC MOTION
              </div>
              <p className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">
                TIMELINE • KEYFRAMES • PRESETS
              </p>
            </div>

            <div className="relative z-10 space-y-1.5 pt-2 border-t border-neutral-800">
              <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div className="h-full w-2/3 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" />
              </div>
            </div>
          </div>
        );

      case 'productivity':
      case 'utilities':
      default:
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-5 flex flex-col justify-between overflow-hidden text-white select-none group-hover:scale-[1.03] transition-transform duration-700">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
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
    return raw || app.name;
  }, [app.name]);

  const renderSmallIcon = () => {
    const iconClass = 'w-4.5 h-4.5 text-neutral-800 dark:text-neutral-200';
    switch (app.icon) {
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
      case 'Palette':
        return <Palette className={iconClass} />;
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
          {/* Left: Bare Icon + Name */}
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
