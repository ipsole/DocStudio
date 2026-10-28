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
      'inline-flex items-center justify-center uppercase font-sans tracking-[-0.02em] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-none cursor-pointer';

    const variants = {
      primary:
        'border border-white bg-white text-black hover:bg-neutral-200 hover:border-neutral-200 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.15)]',
      secondary:
        'border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 hover:border-neutral-500',
      outline:
        'border border-neutral-800 bg-neutral-950 text-neutral-200 hover:border-white hover:text-white',
      ghost:
        'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent',
      danger:
        'border border-red-800 bg-red-950/60 text-red-300 hover:bg-red-900 hover:text-white',
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
