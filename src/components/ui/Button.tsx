import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center uppercase font-sans tracking-[-0.02em] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-none cursor-pointer';

    const variants = {
      primary:
        'border border-neutral-950 bg-neutral-950 text-white hover:bg-white hover:text-neutral-950',
      secondary:
        'border border-neutral-950 bg-transparent text-neutral-950 hover:bg-neutral-950 hover:text-white',
      outline:
        'border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-950',
      ghost:
        'text-neutral-700 hover:text-black hover:bg-neutral-100 border border-transparent',
      danger:
        'border border-red-600 bg-red-600 text-white hover:bg-white hover:text-red-600',
    };

    const sizes = {
      sm: 'text-[11px] px-3.5 py-1.5 gap-1.5',
      md: 'text-xs sm:text-sm px-5 py-2.5 gap-2',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
