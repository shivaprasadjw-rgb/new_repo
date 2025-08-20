import React from 'react';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' };

export const Alert: React.FC<AlertProps> = ({ variant = 'default', className = '', ...props }) => {
  const styles = variant === 'destructive'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-slate-200 bg-slate-50 text-slate-800';
  return <div className={`border rounded p-3 flex items-start gap-2 ${styles} ${className}`} {...props} />;
};

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`text-sm ${className}`} {...props} />
);


