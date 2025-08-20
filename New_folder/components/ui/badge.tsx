import React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' };

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', ...props }) => {
  const variants: Record<string, string> = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-slate-100 text-slate-800',
    outline: 'border border-slate-300 text-slate-800'
  };
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`} {...props} />;
};


