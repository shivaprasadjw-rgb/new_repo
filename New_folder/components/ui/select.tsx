import React from 'react';

export const Select: React.FC<{ value?: string; onValueChange?: (v: string) => void; children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ value, onValueChange, children, className = '', ...props }) => (
  <div className={`relative ${className}`} {...props}>{children}</div>
);

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`border rounded px-3 py-2 ${className}`} {...props} />
);

export const SelectValue: React.FC<{ placeholder?: string } & React.HTMLAttributes<HTMLSpanElement>> = ({ placeholder, className = '', ...props }) => (
  <span className={`text-sm text-slate-700 ${className}`} {...props}>{placeholder}</span>
);

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`absolute z-10 mt-1 w-full border rounded bg-white shadow ${className}`} {...props} />
);

export const SelectItem: React.FC<{ value: string } & React.HTMLAttributes<HTMLDivElement>> = ({ value, className = '', ...props }) => (
  <div role="option" data-value={value} className={`px-3 py-2 hover:bg-slate-50 cursor-pointer ${className}`} {...props} />
);


