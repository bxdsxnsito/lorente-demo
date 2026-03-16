import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Clock, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

const statusIcon = {
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  in_progress: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  cancelled: <AlertCircle className="h-5 w-5 text-slate-400" />,
  pending: <Circle className="h-5 w-5 text-slate-300" />,
  rescheduled: <AlertCircle className="h-5 w-5 text-purple-400" />,
};

export default function RouteVisitList({ visits, selectedId, onSelect }) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
        <MapPin className="h-10 w-10 opacity-30" />
        <p className="text-sm">Sin visitas para este día</p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {visits.map((visit, index) => (
        <li
          key={visit.id}
          onClick={() => onSelect(visit)}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all",
            selectedId === visit.id
              ? "border-[#1565C0] bg-blue-50 shadow-sm"
              : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
          )}
        >
          {/* Número de orden */}
          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#1565C0] text-white text-xs font-bold flex items-center justify-center mt-0.5">
            {visit.route_order ?? index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{visit.client_name || 'Cliente'}</p>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(visit.scheduled_at), 'hh:mm a', { locale: es })}</span>
            </div>
            <div className="mt-1.5">
              <StatusBadge status={visit.status} size="sm" />
            </div>
          </div>

          <div className="flex-shrink-0 mt-0.5">
            {statusIcon[visit.status] ?? statusIcon.pending}
          </div>
        </li>
      ))}
    </ol>
  );
}