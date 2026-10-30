'use client';

import React from 'react';
import Link from 'next/link';
import { PlayCircle, BookOpen, Layers, Sparkles, ArrowRight } from 'lucide-react';

export default function TutorialsPage() {
  const guides = [
    {
      title: 'Getting Started with DocStudio',
      category: 'Overview',
      duration: '3 min read',
      description: 'Learn how single sign-on works across all Docdril apps and how to access your active workspace.',
      icon: BookOpen,
    },
    {
      title: 'Creative Artboards & Vector Exports',
      category: 'Creative Suite',
      duration: '5 min watch',
      description: 'Master canvas controls, anchor points, SVG precision paths, and high-fidelity rendering pipelines.',
      icon: PlayCircle,
    },
    {
      title: 'Motion Sequencer & 60 FPS Keyframes',
      category: 'Animation',
      duration: '7 min watch',
      description: 'Animate kinetic typography and layered scenes with precision easing and instant timeline scrubbing.',
      icon: Sparkles,
    },
    {
      title: 'Automated Document Pipelines',
      category: 'Utilities',
      duration: '4 min read',
      description: 'Configure automated file conversion, batch processing, and continuous export triggers.',
      icon: Layers,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 space-y-12">
      <div className="max-w-3xl mx-auto text-center space-y-2.5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
          Tutorials & Documentation
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-sans max-w-2xl mx-auto leading-relaxed">
          Guides, walkthroughs, and technical references to help you get the most out of every Docdril tool.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <div
              key={guide.title}
              className="group p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-sans text-neutral-500">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                    <Icon className="w-3.5 h-3.5 text-neutral-500" />
                    {guide.category}
                  </span>
                  <span>{guide.duration}</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white font-sans group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                  {guide.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {guide.description}
                </p>
              </div>

              <div className="pt-5 flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                <span>Explore guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
