import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Filter,
  Search,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Upload,
  Play,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/ui/page-header';
import StatusBadge from '@/components/common/StatusBadge';
import ActivityFormDialog from '@/components/agenda/ActivityFormDialog';
import CheckinDialog from '@/components/agenda/CheckinDialog';
import RulesEvaluationDialog from '@/components/agenda/RulesEvaluationDialog';
import CalendarView from '@/components/agenda/CalendarView';
import moment from 'moment';

export default function Agenda() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-scheduled_at', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  useEffect(() => {
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    if (status) setStatusFilter(status);
    if (type) setTypeFilter(type);

    // Check for activityId to auto-open modal
    const activityId = searchParams.get('activityId');
    if (activityId && activities.length > 0) {
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        setSelectedActivity(activity);
        setShowForm(true);
      }
    }
  }, [searchParams, activities]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        // Find linked AppUser for consistent context
        const appUsers = await base44.entities.AppUser.list();
        const linkedAppUser = appUsers.find(au => au.user_id === currentUser.id);
        
        if (linkedAppUser) {
          setUser({ ...currentUser, appUser: linkedAppUser });
        } else {
          setUser(currentUser);
        }
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);



  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    },
  });

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title?.toLowerCase().includes(search.toLowerCase()) ||
      activity.client_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesType = typeFilter === 'all' || activity.activity_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const todayActivities = filteredActivities.filter(a => 
    moment(a.scheduled_at).isSame(moment(), 'day')
  );

  const upcomingActivities = filteredActivities.filter(a => 
    moment(a.scheduled_at).isAfter(moment(), 'day')
  );

  const pastActivities = filteredActivities.filter(a => 
    moment(a.scheduled_at).isBefore(moment(), 'day')
  );

  const getActivityTypeIcon = (type) => {
    const icons = {
      visit: MapPin,
      call: Phone,
      meeting: User,
      follow_up: Clock,
      presentation: FileText,
      document_collection: Upload,
      onboarding: CheckCircle,
    };
    return icons[type] || Calendar;
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      visit: 'bg-green-100 text-green-700',
      call: 'bg-blue-100 text-blue-700',
      meeting: 'bg-purple-100 text-purple-700',
      follow_up: 'bg-amber-100 text-amber-700',
      presentation: 'bg-pink-100 text-pink-700',
      document_collection: 'bg-cyan-100 text-cyan-700',
      onboarding: 'bg-emerald-100 text-emerald-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const handleComplete = (activity) => {
    setSelectedActivity(activity);
    setShowCheckin(true);
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setShowForm(true);
  };

  const handleEvaluateRules = (activity) => {
    setSelectedActivity(activity);
    setShowRules(true);
  };

  const ActivityCard = ({ activity }) => {
    const Icon = getActivityTypeIcon(activity.activity_type);
    const isToday = moment(activity.scheduled_at).isSame(moment(), 'day');
    const isPast = moment(activity.scheduled_at).isBefore(moment());
    const isCompleted = activity.status === 'completed';

    return (
      <Card className={`bg-white border-0 shadow-sm hover:shadow-md transition-all ${
        isCompleted ? 'opacity-75' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${getActivityTypeColor(activity.activity_type)}`}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900 truncate">
                    {activity.title || activity.activity_type}
                  </h3>
                  <p className="text-sm text-slate-500">{activity.client_name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(activity)}>
                      Editar
                    </DropdownMenuItem>
                    {!isCompleted && (
                      <DropdownMenuItem onClick={() => handleComplete(activity)}>
                        Marcar Completada
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleEvaluateRules(activity)}>
                      Evaluar Reglas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {moment(activity.scheduled_at).format('HH:mm')}
                </Badge>
                {isToday && (
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                    Hoy
                  </Badge>
                )}
                <StatusBadge status={activity.status} size="sm" />
                {activity.priority === 'high' || activity.priority === 'urgent' ? (
                  <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {activity.priority}
                  </Badge>
                ) : null}
              </div>
              
              {activity.notes && (
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{activity.notes}</p>
              )}
              
              {activity.checkin_at && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Check-in: {moment(activity.checkin_at).format('DD/MM HH:mm')}</span>
                </div>
              )}
            </div>
          </div>
          
          {!isCompleted && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleComplete(activity)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Check-in
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleEvaluateRules(activity)}
              >
                <Play className="h-4 w-4 mr-1" />
                Reglas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Calendar}
        title="Agenda Comercial"
        subtitle="Gestión de actividades y citas"
      >
        <div className="flex items-center border rounded-lg p-1 bg-white">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className={view === 'list' ? 'bg-[#0B63FF]' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('calendar')}
            className={view === 'calendar' ? 'bg-[#0B63FF]' : ''}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          className="bg-[#0B63FF] hover:bg-[#0A4DB6] gap-2"
          onClick={() => { setSelectedActivity(null); setShowForm(true); }}
        >
          <Plus className="h-4 w-4" />
          Nueva Actividad
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por título o cliente..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="rescheduled">Reprogramada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="visit">Cita</SelectItem>
                <SelectItem value="call">Llamada</SelectItem>
                <SelectItem value="meeting">Reunión</SelectItem>
                <SelectItem value="follow_up">Seguimiento</SelectItem>
                <SelectItem value="presentation">Presentación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Hoy</p>
              <p className="text-2xl font-bold text-slate-900">{todayActivities.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pendientes</p>
              <p className="text-2xl font-bold text-slate-900">
                {activities.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completadas</p>
              <p className="text-2xl font-bold text-slate-900">
                {activities.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Próximas</p>
              <p className="text-2xl font-bold text-slate-900">{upcomingActivities.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <ChevronRight className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Activities List */}
      {view === 'list' && (
        <div className="space-y-6">
          {todayActivities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                Hoy - {moment().format('DD MMMM YYYY')}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {todayActivities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          )}

          {upcomingActivities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                Próximas
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingActivities.slice(0, 6).map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          )}

          {pastActivities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                Pasadas
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastActivities.slice(0, 6).map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          )}

          {filteredActivities.length === 0 && (
            <Card className="p-12 bg-white border-0 shadow-sm text-center">
              <Calendar className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700">No hay actividades</h3>
              <p className="text-slate-500 mt-1">Crea una nueva actividad para comenzar</p>
              <Button 
                className="mt-4 bg-[#0B63FF] hover:bg-[#0A4DB6]"
                onClick={() => { setSelectedActivity(null); setShowForm(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Actividad
              </Button>
            </Card>
          )}
        </div>
      )}

      <ActivityFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        activity={selectedActivity}
        clients={clients}
        onSuccess={refetch}
      />

      <CheckinDialog
        open={showCheckin}
        onOpenChange={setShowCheckin}
        activity={selectedActivity}
        onSuccess={refetch}
      />

      <RulesEvaluationDialog
        open={showRules}
        onOpenChange={setShowRules}
        activity={selectedActivity}
      />
    </div>
  );
}