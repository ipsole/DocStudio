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
  // Dynamic icon selection
  const renderIcon = () => {
    const iconClass = 'w-6 h-6 text-slate-700';
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
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Header: Icon, Category & Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-blue-50/50 group-hover:border-blue-100">
              {renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 capitalize">{app.category}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={app.status} />
            {app.isDemo && (
              <Badge variant="neutral" size="sm">
                Demo
              </Badge>
            )}
          </div>
        </div>

        {/* Short description */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {app.shortDescription}
        </p>

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {app.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100/70 text-slate-600 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <Link
          href={`/apps/${app.slug}`}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                Launch
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : app.status === 'coming_soon' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-medium cursor-not-allowed">
                <Lock className="w-3 h-3" />
                Coming Soon
              </span>
            ) : (
              <span className="text-xs text-slate-400">Unavailable</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
