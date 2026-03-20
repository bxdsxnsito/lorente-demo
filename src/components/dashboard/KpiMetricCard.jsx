import React from 'react';
import { Card } from '@/components/ui/card';

export default function KpiMetricCard({ title, value, subValue, footer, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className={`p-5 border-0 shadow-sm ${c.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subValue && (
            <p className="text-sm text-slate-500 mt-0.5">{subValue}</p>
          )}
          {footer && (
            <p className="text-xs text-slate-400 mt-1">{footer}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${c.icon} ml-3 flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${c.text}`} />
          </div>
        )}
      </div>
    </Card>
  );
}