import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Target,
  MapPin,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import StatusBadge from '@/components/common/StatusBadge';
import SalesVsBudgetChart from '@/components/dashboard/SalesVsBudgetChart';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    period: 'month',
    official: 'all'
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-scheduled_at', 100),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 50),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
  });

  const { data: appUsers = [] } = useQuery({
    queryKey: ['appUsers'],
    queryFn: () => base44.entities.AppUser.list(),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => base44.entities.Card.list('-created_date', 100),
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 100),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list('-created_date', 100),
  });

  // Calculate KPIs
  const totalSales = transactions.reduce((sum, t) => {
    if (t.type === 'deposit' || t.type === 'transfer_in') {
      return sum + (t.amount || 0);
    }
    return sum;
  }, 0);

  const activeTeams = new Set(appUsers.filter(u => u.position === 'oficial' && u.user_id).map(u => u.department)).size || 2;
  
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const totalActivities = activities.length;
  
  const bestTeamSales = Math.max(...appUsers.filter(u => u.user_id).map(u => {
    const userTransactions = transactions.filter(t => t.created_by === u.email);
    return userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }), 0);

  // Helper to filter by period
  const isInPeriod = (dateStr, period) => {
      if (!dateStr) return false;
      const date = moment(dateStr);
      const now = moment();
      
      if (period === 'week') return date.isSame(now, 'week');
      if (period === 'month') return date.isSame(now, 'month');
      if (period === 'quarter') return date.isSame(now, 'quarter');
      if (period === 'year') return date.isSame(now, 'year');
      return true;
  };

  // Chart data - Team performance filtered
  const teamPerformanceData = React.useMemo(() => {
    console.log('=== DEBUG DASHBOARD TEAM CHART ===');
    console.log('Current Filter Period:', filters.period);
    
    // Obtenemos todos los oficiales (vendedores)
    const officials = appUsers.filter(u => u.position === 'oficial');
    console.log('Total Officials:', officials.length);
    
    if (officials.length === 0) return [];

    return officials.map((official, idx) => {
      // 1. Encontrar clientes asignados a este oficial
      const officialClients = clients.filter(c => c.assigned_official_id === official.id);
      const officialClientIds = officialClients.map(c => c.id);
      
      console.log(`[${official.full_name}] Clients Assigned: ${officialClients.length}`);

      // 2. Filtrar transacciones de esos clientes en el periodo
      const officialTx = transactions.filter(t => {
        const isMyClient = officialClientIds.includes(t.client_id);
        const inPeriod = isInPeriod(t.transaction_date || t.created_date, filters.period);
        
        // Log failures for first few transactions to debug
        // if (!isMyClient && !inPeriod) console.log(`Tx ${t.id} rejected: ClientMatch=${isMyClient}, PeriodMatch=${inPeriod}`);
        
        return isMyClient && inPeriod;
      });
      
      console.log(`[${official.full_name}] Transactions Found: ${officialTx.length}`);
      if (officialTx.length > 0) {
        console.log(`[${official.full_name}] Tx Amounts:`, officialTx.map(t => t.amount));
      }

      const ejecucion = officialTx.reduce((sum, t) => {
           // Consideramos depósitos y transferencias entrantes como "Venta/Captación"
           if (t.type === 'deposit' || t.type === 'transfer_in') {
               return sum + (t.amount || 0);
           }
           return sum;
      }, 0);
      
      console.log(`[${official.full_name}] Total Ejecución: ${ejecucion}`);

      // 3. Calcular Presupuesto basado en configuración del usuario
      const monthlyBudget = official.monthly_budget || 50000; // Default 50k si no tiene
      let periodBudget = monthlyBudget;

      if (filters.period === 'week') periodBudget = monthlyBudget / 4;
      if (filters.period === 'quarter') periodBudget = monthlyBudget * 3;
      if (filters.period === 'year') periodBudget = monthlyBudget * 12;

      return {
        name: official.full_name?.split(' ')[0] || `Oficial ${idx + 1}`,
        presupuesto: Math.round(periodBudget),
        ejecucion: Math.round(ejecucion),
      };
    });
  }, [appUsers, transactions, clients, filters.period]);

  // Activities chart data filtered
  const activitiesChartData = React.useMemo(() => {
    const periodActivities = activities.filter(a => isInPeriod(a.scheduled_at, filters.period));

    const completed = periodActivities.filter(a => a.status === 'completed').length;
    const pending = periodActivities.filter(a => a.status === 'pending').length;
    const cancelled = periodActivities.filter(a => a.status === 'cancelled').length;
    const rescheduled = periodActivities.filter(a => a.status === 'rescheduled').length;
    
    return [
      { name: 'Completadas', ejecutadas: completed, noEjecutadas: 0, reprogramadas: 0 },
      { name: 'Pendientes', ejecutadas: 0, noEjecutadas: pending, reprogramadas: 0 },
      { name: 'Canceladas', ejecutadas: 0, noEjecutadas: cancelled, reprogramadas: 0 },
      { name: 'Reprogramadas', ejecutadas: 0, noEjecutadas: 0, reprogramadas: rescheduled },
    ];
  }, [activities, filters.period]);

  // Pipeline data filtered
  const pipelineData = React.useMemo(() => {
      const periodOpportunities = opportunities.filter(o => isInPeriod(o.created_date, filters.period));
      
      // If no data for period (demo fallback), show 0 or keep fallback logic? 
      // Let's show real 0s to be accurate to the filter, user can create data.
      
      return [
        { name: 'Lead', value: periodOpportunities.filter(o => o.stage === 'lead').length, color: '#94a3b8' },
        { name: 'Calificado', value: periodOpportunities.filter(o => o.stage === 'qualified').length, color: '#0B63FF' },
        { name: 'Propuesta', value: periodOpportunities.filter(o => o.stage === 'proposal').length, color: '#8b5cf6' },
        { name: 'Negociación', value: periodOpportunities.filter(o => o.stage === 'negotiation').length, color: '#f59e0b' },
        { name: 'Ganada', value: periodOpportunities.filter(o => o.stage === 'closed_won').length, color: '#22c55e' },
      ].filter(item => item.value > 0); // Optional: hide empty segments
  }, [opportunities, filters.period]);

  // Today's activities
  const todaysActivities = activities.filter(a => moment(a.scheduled_at).isSame(moment(), 'day'));

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader 
          icon={LayoutDashboard}
          title="Dashboard Global"
          subtitle="Vista Consolidada de Todos los Vendedores"
        />
        <div className="flex flex-wrap gap-3">
          <Select value={filters.period} onValueChange={(v) => setFilters({...filters, period: v})}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.official} onValueChange={(v) => setFilters({...filters, official: v})}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Todos los vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              {appUsers.filter(u => u.position === 'oficial' && u.user_id).map(u => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas Totales"
          value={formatCurrency(totalSales || 382000000)}
          subtitle={`${transactions.length || 97} transacciones`}
          icon={DollarSign}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatsCard
          title="Equipos Comerciales Activos"
          value={activeTeams}
          subtitle={`${clients.length || 20} clientes`}
          icon={Users}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Visitas Totales"
          value={totalActivities || 73}
          subtitle={`${completedActivities || 10} completadas`}
          icon={MapPin}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Mejor Equipo Comercial"
          value="1"
          subtitle={formatCurrency(bestTeamSales || 191600000)}
          icon={Target}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="grid grid-cols-1">
        <SalesVsBudgetChart 
          transactions={transactions}
          cards={cards}
          loans={loans}
          opportunities={opportunities}
          accounts={accounts}
          period={filters.period}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Chart */}
        <ChartCard title="Presupuesto vs Ejecución por Equipo Comercial" icon={TrendingUp}>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformanceData} barGap={8}>
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
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="presupuesto" fill="#22c55e" radius={[4, 4, 0, 0]} name="Presupuesto" />
                <Bar dataKey="ejecucion" fill="#ef4444" radius={[4, 4, 0, 0]} name="Ejecución" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Activities Chart */}
        <ChartCard title="Visitas Ejecutadas vs No Ejecutadas" icon={MapPin}>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activitiesChartData} barGap={8}>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="ejecutadas" fill="#0B63FF" radius={[4, 4, 0, 0]} name="Ejecutadas" />
                <Bar dataKey="noEjecutadas" fill="#fbbf24" radius={[4, 4, 0, 0]} name="No Ejecutadas" />
                <Bar dataKey="reprogramadas" fill="#9333ea" radius={[4, 4, 0, 0]} name="Reprogramadas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Summary */}
        <ChartCard title="Pipeline de Oportunidades" icon={Target}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-sm text-slate-600">{value}</span>
                  )}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Today's Activities */}
        <Card className="p-6 bg-white border-0 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-500" />
              <h3 className="font-semibold text-slate-700">Actividades del Día ({todaysActivities.length})</h3>
            </div>
            <Link to={createPageUrl('Agenda')}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                Ir a Agenda
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {todaysActivities.length > 0 ? todaysActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'completed' ? 'bg-green-100' : 
                    activity.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {activity.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : activity.status === 'pending' ? (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{activity.title || activity.activity_type}</p>
                    <p className="text-xs text-slate-500">{activity.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={activity.status} size="sm" />
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {activity.official_name?.slice(0, 2).toUpperCase() || 'OF'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>No hay actividades programadas para hoy</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}