import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

export default function RiskBadge({ score, showLabel = true, size = 'default' }) {
  const getRiskLevel = (score) => {
    if (score >= 700) return { label: 'Bajo', color: 'bg-green-100 text-green-700 border-green-200', icon: Shield };
    if (score >= 500) return { label: 'Medio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle };
    return { label: 'Alto', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
  };

  const risk = getRiskLevel(score);
  const Icon = risk.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 font-medium border",
        risk.color,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      {showLabel && <span>{risk.label}</span>}
      <span className="font-bold">{score}</span>
    </Badge>
  );
}