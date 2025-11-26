import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfigs = {
  // Activity statuses
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  rescheduled: { label: 'Reprogramada', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  
  // Loan statuses
  preapproved: { label: 'Pre-aprobado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  in_review: { label: 'En Revisión', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700 border-green-200' },
  disbursed: { label: 'Desembolsado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-200' },
  paid_off: { label: 'Pagado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  default: { label: 'En Mora', color: 'bg-red-100 text-red-700 border-red-200' },
  
  // Card statuses
  active: { label: 'Activa', color: 'bg-green-100 text-green-700 border-green-200' },
  blocked: { label: 'Bloqueada', color: 'bg-red-100 text-red-700 border-red-200' },
  expired: { label: 'Expirada', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  
  // Account statuses
  inactive: { label: 'Inactiva', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  closed: { label: 'Cerrada', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  
  // Opportunity stages
  lead: { label: 'Lead', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  qualified: { label: 'Calificado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  proposal: { label: 'Propuesta', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  negotiation: { label: 'Negociación', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  closed_won: { label: 'Ganada', color: 'bg-green-100 text-green-700 border-green-200' },
  closed_lost: { label: 'Perdida', color: 'bg-red-100 text-red-700 border-red-200' },
  
  // Activity results
  successful: { label: 'Exitosa', color: 'bg-green-100 text-green-700 border-green-200' },
  no_contact: { label: 'Sin Contacto', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  not_interested: { label: 'Sin Interés', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function StatusBadge({ status, customLabel, size = 'default' }) {
  const config = statusConfigs[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border",
        config.color,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      {customLabel || config.label}
    </Badge>
  );
}