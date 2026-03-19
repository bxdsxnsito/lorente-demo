import React, { useState } from 'react';
import moment from 'moment';
import 'moment/locale/es';
import { ChevronLeft, ChevronRight, MapPin, Phone, User, Clock, FileText, Upload, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

moment.locale('es');

const typeColors = {
  visit: 'bg-green-500',
  call: 'bg-blue-500',
  meeting: 'bg-purple-500',
  follow_up: 'bg-amber-500',
  presentation: 'bg-pink-500',
  document_collection: 'bg-cyan-500',
  onboarding: 'bg-emerald-500',
};

const typeLabels = {
  visit: 'Visita',
  call: 'Llamada',
  meeting: 'Reunión',
  follow_up: 'Seguimiento',
  presentation: 'Presentación',
  document_collection: 'Documentos',
  onboarding: 'Onboarding',
};

const statusColors = {
  pending: 'border-l-amber-400',
  in_progress: 'border-l-blue-400',
  completed: 'border-l-green-400',
  cancelled: 'border-l-slate-400',
  rescheduled: 'border-l-purple-400',
};

export default function CalendarView({ activities, onSelectActivity }) {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDay, setSelectedDay] = useState(null);

  const startOfMonth = currentMonth.clone().startOf('month');
  const endOfMonth = currentMonth.clone().endOf('month');
  const startDate = startOfMonth.clone().startOf('week'); // Monday
  const endDate = endOfMonth.clone().endOf('week');

  const days = [];
  let day = startDate.clone();
  while (day.isSameOrBefore(endDate, 'day')) {
    days.push(day.clone());
    day.add(1, 'day');
  }

  const getActivitiesForDay = (d) =>
    activities.filter(a => a.scheduled_at && moment(a.scheduled_at.substring(0, 10)).isSame(d, 'day'));

  const selectedActivities = selectedDay ? getActivitiesForDay(selectedDay) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Calendar grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => m.clone().subtract(1, 'month'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {currentMonth.format('MMMM YYYY')}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => m.clone().add(1, 'month'))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const isCurrentMonth = d.isSame(currentMonth, 'month');
            const isToday = d.isSame(moment(), 'day');
            const isSelected = selectedDay && d.isSame(selectedDay, 'day');
            const dayActivities = getActivitiesForDay(d);

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(d)}
                className={cn(
                  'min-h-[80px] p-1.5 border-b border-r cursor-pointer transition-colors',
                  !isCurrentMonth && 'bg-slate-50/60',
                  isSelected && 'bg-blue-50',
                  isToday && !isSelected && 'bg-amber-50',
                  'hover:bg-blue-50/50'
                )}
              >
                <div className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  isToday ? 'bg-[#0B63FF] text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                )}>
                  {d.date()}
                </div>
                <div className="space-y-0.5">
                  {dayActivities.slice(0, 3).map((a, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'text-[10px] truncate px-1 py-0.5 rounded text-white font-medium',
                        typeColors[a.activity_type] || 'bg-slate-400'
                      )}
                    >
                      {a.client_name || typeLabels[a.activity_type] || 'Actividad'}
                    </div>
                  ))}
                  {dayActivities.length > 3 && (
                    <div className="text-[10px] text-slate-500 px-1">+{dayActivities.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel: selected day activities */}
      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b bg-slate-50">
          <p className="font-semibold text-slate-700 capitalize">
            {selectedDay ? selectedDay.format('dddd D [de] MMMM') : 'Selecciona un día'}
          </p>
          {selectedDay && (
            <p className="text-xs text-slate-500 mt-0.5">{selectedActivities.length} actividad(es)</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!selectedDay && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Calendar className="h-10 w-10 opacity-30" />
              <p className="text-sm">Haz clic en un día</p>
            </div>
          )}
          {selectedDay && selectedActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Calendar className="h-10 w-10 opacity-30" />
              <p className="text-sm">Sin actividades este día</p>
            </div>
          )}
          {selectedActivities.map(a => (
            <div
              key={a.id}
              onClick={() => onSelectActivity && onSelectActivity(a)}
              className={cn(
                'p-3 rounded-lg border border-l-4 cursor-pointer hover:bg-slate-50 transition-colors',
                statusColors[a.status] || 'border-l-slate-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('h-2 w-2 rounded-full flex-shrink-0', typeColors[a.activity_type] || 'bg-slate-400')} />
                <p className="font-medium text-sm text-slate-800 truncate">
                  {a.title || typeLabels[a.activity_type] || 'Actividad'}
                </p>
              </div>
              <p className="text-xs text-slate-500 ml-4">{a.client_name}</p>
              <div className="flex items-center gap-2 mt-1.5 ml-4">
                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                  <Clock className="h-2.5 w-2.5" />
                  {moment(a.scheduled_at).format('HH:mm')}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                  {a.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}