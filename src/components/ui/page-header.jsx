import React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ 
  icon: Icon,
  title, 
  subtitle, 
  children,
  className 
}) {
  return (
    <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1565C0] to-[#0D47A1] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}