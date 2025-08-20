import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'destructive' };

export const Button: React.FC<Props> = ({ variant = 'default', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded px-3 py-2 text-sm';
  const variants: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-slate-300 text-slate-800 hover:bg-slate-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
};


