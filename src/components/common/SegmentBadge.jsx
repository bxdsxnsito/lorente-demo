import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, Crown, Building, User } from 'lucide-react';

const segmentConfigs = {
  normal: { label: 'Normal', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: User },
  preferente: { label: 'Preferente', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Star },
  premium: { label: 'Premium', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Crown },
  pyme: { label: 'PYME', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Building },
};

export default function SegmentBadge({ segment, showIcon = true, size = 'default' }) {
  const config = segmentConfigs[segment] || segmentConfigs.normal;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 font-medium border",
        config.color,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
}