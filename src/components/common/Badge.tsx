import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'neutral'
    | 'primary'
    | 'purple';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-500/10',
    primary: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-tight font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ring-1 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === 'danger'
                ? 'bg-rose-500'
                : variant === 'success'
                ? 'bg-emerald-500'
                : variant === 'warning'
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              variant === 'danger'
                ? 'bg-rose-600'
                : variant === 'success'
                ? 'bg-emerald-600'
                : variant === 'warning'
                ? 'bg-amber-600'
                : 'bg-blue-600'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
};
