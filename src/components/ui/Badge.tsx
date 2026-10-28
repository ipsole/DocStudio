import React from 'react';
import { AppStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppStatus }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
          Active
        </Badge>
      );
    case 'coming_soon':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
          Coming Soon
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-1" />
          Draft
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="default">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1" />
          Archived
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
