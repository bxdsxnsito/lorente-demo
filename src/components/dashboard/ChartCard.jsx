import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ChartCard({ 
  title, 
  icon: Icon, 
  children, 
  className,
  actions 
}) {
  return (
    <Card className={cn("bg-white border-0 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-slate-500" />}
            <CardTitle className="text-base font-semibold text-slate-700">{title}</CardTitle>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}