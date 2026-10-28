import React from 'react';
import Link from 'next/link';
import { DocApp } from '@/types';
import { StatusBadge, Badge } from '@/components/ui/Badge';
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
  const renderIcon = () => {
    const iconClass = 'w-5 h-5 text-white';
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

  const isLaunchable = app.status === 'active' && Boolean(app.applicationUrl);

  return (
    <div className="group relative flex flex-col justify-between border border-neutral-200 hover:border-neutral-950 bg-white p-6 transition-all duration-200 rounded-none">
      <div>
        {/* Header: Icon, Category & Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-neutral-950 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              {renderIcon()}
            </div>
            <div>
              <h3 className="font-bold text-neutral-950 text-base sm:text-lg tracking-[-0.02em] font-sans group-hover:text-black transition-colors">
                {app.name}
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                {app.category}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={app.status} />
            {app.isDemo && (
              <Badge variant="neutral" size="sm">
                DEMO
              </Badge>
            )}
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 mb-4 leading-relaxed font-sans">
          {app.shortDescription}
        </p>

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {app.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-neutral-50 border border-neutral-200 text-neutral-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-neutral-200 flex items-center justify-between gap-2 mt-auto">
        <Link
          href={`/apps/${app.slug}`}
          className="font-mono text-xs uppercase tracking-wider font-semibold text-neutral-900 hover:text-black inline-flex items-center gap-1 transition-colors"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {showLaunchDirect && (
          <>
            {isLaunchable ? (
              <a
                href={app.applicationUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-950 bg-neutral-950 text-white font-mono text-[11px] uppercase tracking-wider hover:bg-white hover:text-neutral-950 transition-all cursor-pointer"
              >
                Launch
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : app.status === 'coming_soon' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400 border border-neutral-200 bg-neutral-50 cursor-not-allowed">
                <Lock className="w-3 h-3" />
                Coming Soon
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase text-neutral-400">Unavailable</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
