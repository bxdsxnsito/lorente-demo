import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import RouteVisitList from '@/components/routemap/RouteVisitList';
import RouteMapView from '@/components/routemap/RouteMapView';

export default function RouteMap() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setCurrentUser(u);
    };
    load();
  }, []);

  // Cargar actividades del oficial actual
  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['activities-routemap', currentUser?.id],
    queryFn: async () => {
      const appUsers = await base44.entities.AppUser.list();
      const appUser = appUsers.find(au => au.user_id === currentUser.id || au.email === currentUser.email);
      if (!appUser) return [];
      return base44.entities.Activity.filter({ official_id: appUser.id });
    },
    enabled: !!currentUser,
  });

  // Cargar todos los clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-routemap'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Map de clientes por id para acceso rápido
  const clientsMap = React.useMemo(() => {
    return clients.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
  }, [clients]);

  // Filtrar visitas del día seleccionado y ordenar por route_order / scheduled_at
  const visitsOfDay = React.useMemo(() => {
    return activities
      .filter(a => isSameDay(parseISO(a.scheduled_at), selectedDate))
      .sort((a, b) => {
        if (a.route_order != null && b.route_order != null) return a.route_order - b.route_order;
        return new Date(a.scheduled_at) - new Date(b.scheduled_at);
      });
  }, [activities, selectedDate]);

  const changeDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
    setSelectedVisit(null);
  };

  // Visitas con coordenadas disponibles
  const visitsWithCoords = visitsOfDay.filter(v => {
    const client = clientsMap[v.client_id];
    return (v.lat && v.lng) || (client?.lat && client?.lng);
  });

  const visitsWithoutCoords = visitsOfDay.filter(v => {
    const client = clientsMap[v.client_id];
    return !(v.lat && v.lng) && !(client?.lat && client?.lng);
  });

  return (
    <div className="space-y-4 h-full">
      <PageHeader
        icon={MapPin}
        title="Ruta del Día"
        subtitle="Visitas programadas y recorrido del día"
      >
        {/* Selector de fecha */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeDay(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-[#1565C0]" />
            <span className="text-sm font-medium text-slate-700 capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeDay(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setSelectedDate(new Date()); setSelectedVisit(null); }}
          className="text-[#1565C0] border-[#1565C0]"
        >
          Hoy
        </Button>
      </PageHeader>

      {/* Layout principal: lista + mapa */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        
        {/* Panel lateral: lista de visitas */}
        <Card className="w-full lg:w-80 flex-shrink-0 border-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">
              {visitsOfDay.length} visita{visitsOfDay.length !== 1 ? 's' : ''} programada{visitsOfDay.length !== 1 ? 's' : ''}
            </p>
            {visitsWithoutCoords.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {visitsWithoutCoords.length} sin coordenadas (no aparecen en el mapa)
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {loadingActivities ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-6 h-6 border-2 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <RouteVisitList
                visits={visitsOfDay}
                selectedId={selectedVisit?.id}
                onSelect={(v) => setSelectedVisit(v)}
              />
            )}
          </div>
        </Card>

        {/* Mapa */}
        <Card className="flex-1 border-0 shadow-sm overflow-hidden" style={{ minHeight: '400px' }}>
          {visitsWithCoords.length === 0 && !loadingActivities ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <MapPin className="h-16 w-16 opacity-20" />
              <p className="text-sm font-medium">
                {visitsOfDay.length === 0
                  ? 'No hay visitas este día'
                  : 'Los clientes de este día no tienen coordenadas registradas'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs text-center">
                Agrega las coordenadas (lat/lng) en el perfil de cada cliente para verlos en el mapa.
              </p>
            </div>
          ) : (
            <RouteMapView
              visits={visitsWithCoords}
              clientsMap={clientsMap}
              selectedId={selectedVisit?.id}
              onSelectVisit={setSelectedVisit}
            />
          )}
        </Card>
      </div>
    </div>
  );
}