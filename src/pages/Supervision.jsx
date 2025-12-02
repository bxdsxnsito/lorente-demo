import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Users,
  Calendar,
  Target,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import StatusBadge from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import moment from 'moment';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import SalesVsBudgetChart from '@/components/dashboard/SalesVsBudgetChart';

export default function Supervision() {
  const [search, setSearch] = useState('');
  const [officialFilter, setOfficialFilter] = useState('all');
  const [reassignDialog, setReassignDialog] = useState({ open: false, activity: null });
  const [newOfficialId, setNewOfficialId] = useState('');
  const queryClient = useQueryClient();

  const { data: appUsers = [] } = useQuery({
    queryKey: ['appUsers'],
    queryFn: () => base44.entities.AppUser.list(),
  });

  const { data: activities = [], refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-scheduled_at', 200),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
    },
  });

  // Solo cuentan los que tengan user_id (estén vinculados) y sean oficiales
  const officials = appUsers.filter(u => u.position === 'oficial' && u.user_id && u.status === 'active');

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title?.toLowerCase().includes(search.toLowerCase()) ||
      activity.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      activity.official_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesOfficial = officialFilter === 'all' || activity.official_id === officialFilter;
    
    return matchesSearch && matchesOfficial;
  });

  const getOfficialStats = (officialId) => {
    const officialActivities = activities.filter(a => a.official_id === officialId);
    const completed = officialActivities.filter(a => a.status === 'completed').length;
    const pending = officialActivities.filter(a => a.status === 'pending').length;
    const total = officialActivities.length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;
    
    const officialOpportunities = opportunities.filter(o => o.official_id === officialId);
    const pipelineValue = officialOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
    
    return { completed, pending, total, completionRate, pipelineValue };
  };

  const handleReassign = async () => {
    if (!reassignDialog.activity || !newOfficialId) return;
    
    try {
      // Call backend function for activity assignment
      const response = await base44.functions.invoke('assignActivity', {
        activity_id: reassignDialog.activity.id,
        new_official_id: newOfficialId,
        reason: 'Reasignación manual por supervisor',
      });
      
      const data = response.data;
      
      if (data.success) {
        queryClient.invalidateQueries(['activities']);
        toast.success(`Actividad reasignada a ${data.new_official.name}`);
        
        if (data.workload_warning) {
          toast.warning(`Advertencia: ${data.new_official.name} tiene ${data.new_official.pending_activities} actividades pendientes`);
        }
      } else {
        toast.error(data.error || 'Error al reasignar');
      }
    } catch (error) {
      console.error('Error reassigning activity:', error);
      toast.error('Error al reasignar actividad');
    }
    
    setReassignDialog({ open: false, activity: null });
    setNewOfficialId('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  // Chart data
  const chartData = officials.map(official => {
    const stats = getOfficialStats(official.id);
    return {
      name: official.full_name?.split(' ')[0] || 'Oficial',
      completadas: stats.completed,
      pendientes: stats.pending,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Shield}
        title="Supervisión de Equipo"
        subtitle="Monitoreo de actividades y rendimiento"
      />

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Oficiales Activos</p>
              <p className="text-2xl font-bold text-slate-900">{officials.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Actividades Hoy</p>
              <p className="text-2xl font-bold text-slate-900">
                {activities.filter(a => moment(a.scheduled_at).isSame(moment(), 'day')).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">
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
              <p className="text-sm text-slate-500">Tasa Cumplimiento</p>
              <p className="text-2xl font-bold text-green-600">
                {activities.length > 0 
                  ? ((activities.filter(a => a.status === 'completed').length / activities.length) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1">
        <SalesVsBudgetChart />
      </div>

      {/* Team Performance Chart */}
      <Card className="bg-white border-0 shadow-sm p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Rendimiento por Oficial</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="completadas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completadas" />
              <Bar dataKey="pendientes" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pendientes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {officials.map(official => {
          const stats = getOfficialStats(official.id);
          return (
            <Card key={official.id} className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {official.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'OF'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{official.full_name}</p>
                    <p className="text-sm text-slate-500">Oficial de Negocios</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    <p className="text-xs text-slate-500">Actividades</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p>
                    <p className="text-xs text-slate-500">Cumplimiento</p>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-slate-500">Pipeline</p>
                  <p className="font-semibold text-blue-600">{formatCurrency(stats.pipelineValue)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activities Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle>Actividades del Equipo</CardTitle>
            <div className="flex gap-3">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={officialFilter} onValueChange={setOfficialFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los oficiales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {officials.map(official => (
                    <SelectItem key={official.id} value={official.id}>
                      {official.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Actividad</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Oficial</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.slice(0, 20).map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{activity.title || activity.activity_type}</p>
                      <Badge variant="outline" className="text-xs capitalize mt-1">
                        {activity.activity_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{activity.client_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {activity.official_name?.slice(0, 2).toUpperCase() || 'OF'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{activity.official_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {moment(activity.scheduled_at).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={activity.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setReassignDialog({ open: true, activity })}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reasignar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog.open} onOpenChange={(open) => setReassignDialog({ ...reassignDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reasignar Actividad</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium">{reassignDialog.activity?.title || reassignDialog.activity?.activity_type}</p>
              <p className="text-sm text-slate-500">{reassignDialog.activity?.client_name}</p>
              <p className="text-sm text-slate-500 mt-1">
                Asignado a: {reassignDialog.activity?.official_name}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Nuevo Oficial Asignado</label>
              <Select value={newOfficialId} onValueChange={setNewOfficialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar oficial" />
                </SelectTrigger>
                <SelectContent>
                  {officials.map(official => (
                    <SelectItem key={official.id} value={official.id}>
                      {official.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog({ open: false, activity: null })}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReassign}
              className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
              disabled={!newOfficialId}
            >
              Reasignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}