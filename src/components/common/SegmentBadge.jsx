import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wheat, Factory, Beef, Landmark, Building2, User, ShoppingBag, Tractor, Store, Leaf } from 'lucide-react';

const segmentConfigs = {
  corp_agricola:      { label: 'Corp. Agrícola',    color: 'bg-green-100 text-green-700 border-green-200',     icon: Wheat },
  corp_com_ind_serv:  { label: 'Corp. Com/Ind/Serv', color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Factory },
  corp_ganadero:      { label: 'Corp. Ganadero',     color: 'bg-amber-100 text-amber-700 border-amber-200',    icon: Beef },
  inv_ifis:           { label: 'IFIs',               color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Landmark },
  inv_institucional:  { label: 'Inv. Institucional', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Building2 },
  inv_personal:       { label: 'Inv. Personal',      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',       icon: User },
  personas_consumo:   { label: 'Personas Consumo',   color: 'bg-rose-100 text-rose-700 border-rose-200',       icon: ShoppingBag },
  pyme_agricola:      { label: 'Pyme Agrícola',      color: 'bg-lime-100 text-lime-700 border-lime-200',       icon: Tractor },
  pyme_com_ind_serv:  { label: 'Pyme Com/Ind/Serv',  color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Store },
  pyme_ganadera:      { label: 'Pyme Ganadera',      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Leaf },
  sin_productos:      { label: 'Sin Productos',      color: 'bg-slate-100 text-slate-600 border-slate-200',    icon: User },
};

export default function SegmentBadge({ segment, showIcon = true, size = 'default' }) {
  const config = segmentConfigs[segment] || { label: segment || '—', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: User };
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