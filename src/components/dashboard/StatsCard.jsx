import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
  trendUp = true,
  className
}) {
  return (
    <Card className={cn("p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-slate-900">{value}</h3>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              trendUp ? "text-green-600" : "text-red-600"
            )}>
              <span>{trendUp ? '↑' : '↓'} {trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        )}
      </div>
    </Card>
  );
}