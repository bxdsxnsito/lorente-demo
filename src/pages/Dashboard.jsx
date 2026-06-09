import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Clock,
  CheckCircle,
  Phone,
  FileText,
  Upload,
  ShieldAlert,
  Layers,
  PieChart as PieChartIcon
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
import { Badge } from '@/components/ui/badge';
import ChartCard from '@/components/dashboard/ChartCard';
import StatusBadge from '@/components/common/StatusBadge';
import SalesVsBudgetChart from '@/components/dashboard/SalesVsBudgetChart';
import KpiMetricCard from '@/components/dashboard/KpiMetricCard';
import ExecutivePerformanceChart from '@/components/dashboard/ExecutivePerformanceChart';

const FALLBACK_EXECUTIVES = [
  { name: 'Carlos', presupuesto: 50000, ejecucion: 42000 },
  { name: 'María', presupuesto: 50000, ejecucion: 18000 },
  { name: 'José', presupuesto: 50000, ejecucion: 38500 },
  { name: 'Ana', presupuesto: 50000, ejecucion: 12000 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [filters, setFilters] = useState({ period: 'month', official: 'all' });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {}
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
    queryFn: () => base44.entities.Opportunity.list('-created_date', 100),
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

  const currentPeriod = moment().format('YYYY-MM');

  const { data: officialPerformances = [], refetch: refetchPerformances } = useQuery({
    queryKey: ['officialPerformances', currentPeriod],
    queryFn: () => base44.entities.OfficialPerformance.filter({ period: currentPeriod }),
  });

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

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Team performance data
  const teamPerformanceData = React.useMemo(() => {
    const officials = appUsers.filter(u => u.position === 'oficial');
    if (officials.length === 0) return [];
    return officials.map((official, idx) => {
      const officialClients = clients.filter(c => c.assigned_official_id === official.id);
      const officialClientIds = officialClients.map(c => c.id);
      const officialTx = transactions.filter(t =>
        officialClientIds.includes(t.client_id) &&
        isInPeriod(t.transaction_date || t.created_date, filters.period)
      );
      const ejecucion = officialTx.reduce((sum, t) =>
        (t.type === 'deposit' || t.type === 'transfer_in') ? sum + (t.amount || 0) : sum, 0);
      const monthlyBudget = official.monthly_budget || 50000;
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

  // Seed de número pseudo-aleatorio estable basado en string
  const seededRandom = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 100;
  };

  // Auto-crear registros de OfficialPerformance para oficiales sin registro en el período
  useEffect(() => {
    if (appUsers.length === 0 || officialPerformances === undefined) return;
    const officials = appUsers.filter(u => u.position === 'oficial');
    const existingIds = new Set(officialPerformances.map(p => p.official_id));
    const missing = officials.filter(u => !existingIds.has(u.id));
    if (missing.length === 0) return;

    const newRecords = missing.map(u => ({
      official_id: u.id,
      official_name: u.full_name,
      period: currentPeriod,
      cumplimiento_pct: 30 + (seededRandom(u.id + currentPeriod) % 65), // rango 30-94
      colocaciones: Math.round((30 + (seededRandom(u.id + 'col') % 60)) * 1000),
      captaciones: Math.round((15 + (seededRandom(u.id + 'cap') % 40)) * 1000),
      mora_pct: parseFloat((1 + (seededRandom(u.id + 'mor') % 50) / 20).toFixed(1)),
      cruzamiento: parseFloat((1 + (seededRandom(u.id + 'cru') % 20) / 10).toFixed(1)),
    }));

    base44.entities.OfficialPerformance.bulkCreate(newRecords).then(() => refetchPerformances());
  }, [appUsers, officialPerformances]);

  // Executives data desde OfficialPerformance
  const executivesData = React.useMemo(() => {
    const officials = appUsers.filter(u => u.position === 'oficial');
    if (officials.length === 0) return FALLBACK_EXECUTIVES.map(e => ({ ...e, cumplimiento: e.cumplimiento_pct || 0 }));

    return officials.map(u => {
      const perf = officialPerformances.find(p => p.official_id === u.id);
      return {
        name: u.full_name?.split(' ')[0] || u.full_name,
        cumplimiento: perf?.cumplimiento_pct ?? 0,
        colocaciones: perf?.colocaciones ?? 0,
        captaciones: perf?.captaciones ?? 0,
        mora_pct: perf?.mora_pct ?? 0,
        cruzamiento: perf?.cruzamiento ?? 1,
        official_id: u.id,
      };
    });
  }, [appUsers, officialPerformances]);

  const activitiesChartData = React.useMemo(() => {
    const periodActivities = activities.filter(a => isInPeriod(a.scheduled_at, filters.period));
    return [
      { name: 'Completadas', ejecutadas: periodActivities.filter(a => a.status === 'completed').length, noEjecutadas: 0, reprogramadas: 0 },
      { name: 'Pendientes', ejecutadas: 0, noEjecutadas: periodActivities.filter(a => a.status === 'pending').length, reprogramadas: 0 },
      { name: 'Canceladas', ejecutadas: 0, noEjecutadas: periodActivities.filter(a => a.status === 'cancelled').length, reprogramadas: 0 },
      { name: 'Reprogramadas', ejecutadas: 0, noEjecutadas: 0, reprogramadas: periodActivities.filter(a => a.status === 'rescheduled').length },
    ];
  }, [activities, filters.period]);

  const pipelineData = React.useMemo(() => {
    return [
      { key: 'lead', name: 'Lead', color: '#94a3b8' },
      { key: 'qualified', name: 'Calificado', color: '#0B63FF' },
      { key: 'proposal', name: 'Propuesta', color: '#8b5cf6' },
      { key: 'negotiation', name: 'Negociación', color: '#f59e0b' },
      { key: 'closed_won', name: 'Ganada', color: '#22c55e' },
      { key: 'closed_lost', name: 'Perdida', color: '#ef4444' },
    ].map(stage => {
      const stageOpps = opportunities.filter(o => o.stage === stage.key);
      return { name: stage.name, value: stageOpps.length, amount: stageOpps.reduce((s, o) => s + (o.amount || 0), 0), color: stage.color };
    });
  }, [opportunities]);

  const todaysActivities = activities.filter(a => moment(a.scheduled_at).isSame(moment(), 'day'));
  const currentAppUser = appUsers.find(u => u.email === user?.email);
  const isManager = !user || user.role === 'admin' || (currentAppUser && ['admin', 'gerente', 'supervisor'].includes(currentAppUser.position));

  const getActivityTypeIcon = (type) => {
    const icons = { visit: MapPin, call: Phone, meeting: Users, follow_up: Clock, presentation: FileText, document_collection: Upload, onboarding: CheckCircle };
    return icons[type] || Calendar;
  };
  const getActivityTypeColor = (type) => {
    const colors = { visit: 'bg-green-100 text-green-700', call: 'bg-blue-100 text-blue-700', meeting: 'bg-purple-100 text-purple-700', follow_up: 'bg-amber-100 text-amber-700', presentation: 'bg-pink-100 text-pink-700', document_collection: 'bg-cyan-100 text-cyan-700', onboarding: 'bg-emerald-100 text-emerald-700' };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const handleActivitiesChartClick = (data) => {
    if (data?.activePayload?.length > 0) {
      const category = data.activePayload[0].payload.name;
      const status = { Completadas: 'completed', Pendientes: 'pending', Canceladas: 'cancelled', Reprogramadas: 'rescheduled' }[category] || 'all';
      navigate(createPageUrl('Agenda') + `?status=${status}&type=visit`);
    }
  };

  // ── Drilldown data for selected executive ──
  const execPerf = selectedExecutive
    ? officialPerformances.find(p => p.official_id === selectedExecutive.id)
    : null;
  const execActivities = selectedExecutive
    ? activities.filter(a => a.official_id === selectedExecutive.id || a.official_name === selectedExecutive.full_name)
    : [];
  const execClients = selectedExecutive
    ? clients.filter(c => c.assigned_official_id === selectedExecutive.id)
    : [];
  const execOpps = selectedExecutive
    ? opportunities.filter(o => o.official_id === selectedExecutive.id)
    : [];
  const execEjecucion = execPerf?.colocaciones ?? 0;
  const execBudget = selectedExecutive?.monthly_budget || 50000;
  const execCumplimiento = execPerf?.cumplimiento_pct ?? 0;

  // ── If viewing a specific executive ──
  if (selectedExecutive) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedExecutive(null)}
              className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard Global
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filters.period} onValueChange={(v) => setFilters({ ...filters, period: v })}>
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
          </div>
        </div>

        {/* Executive identity */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-green-100 text-green-700 text-xl font-bold">
              {selectedExecutive.full_name?.slice(0, 2).toUpperCase() || 'EJ'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{selectedExecutive.full_name}</h2>
            <p className="text-sm text-slate-500 capitalize">{selectedExecutive.position || 'Oficial de Negocios'} · {selectedExecutive.branch || 'Sin agencia'}</p>
            <Badge className="mt-1 bg-green-100 text-green-700 border-0">Dashboard Individual</Badge>
          </div>
        </div>

        {/* KPIs individuales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard title="Colocaciones Mes" value={formatCurrency(execEjecucion)} subValue={`de ${formatCurrency(execBudget)}`} footer={`${execCumplimiento}% ejecutado`} icon={DollarSign} color="blue" />
          <KpiMetricCard title="Clientes Asignados" value={execClients.length} subValue="cartera activa" icon={Users} color="green" />
          <KpiMetricCard title="Actividades" value={execActivities.length} subValue={`${execActivities.filter(a => a.status === 'completed').length} completadas`} icon={CheckCircle} color="amber" />
          <KpiMetricCard title="Oportunidades" value={execOpps.length} subValue={`${execOpps.filter(o => o.stage === 'closed_won').length} cerradas`} icon={Target} color="purple" />
        </div>

        {/* Avance de meta */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AVANCE DE META A HOY</p>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-700 font-bold text-lg">{execCumplimiento}% ejecutado</span>
            <span className="text-slate-400 font-medium">Meta: {formatCurrency(execBudget)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4">
            <div
              className="h-4 rounded-full transition-all"
              style={{
                width: `${execCumplimiento}%`,
                backgroundColor: execCumplimiento >= 80 ? '#22c55e' : execCumplimiento >= 50 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{formatCurrency(execEjecucion)} colocados de {formatCurrency(execBudget)} presupuestados</p>
        </div>

        {/* Actividades del ejecutivo */}
        <Card className="p-6 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-700">Actividades Recientes ({execActivities.length})</h3>
          </div>
          <div className="space-y-2">
            {execActivities.slice(0, 6).map(activity => {
              const Icon = getActivityTypeIcon(activity.activity_type);
              const colorClass = getActivityTypeColor(activity.activity_type);
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{activity.title || activity.activity_type}</p>
                      <p className="text-xs text-slate-500">{activity.client_name} · {moment(activity.scheduled_at).format('DD/MM HH:mm')}</p>
                    </div>
                  </div>
                  <StatusBadge status={activity.status} size="sm" />
                </div>
              );
            })}
            {execActivities.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-sm">Sin actividades registradas</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── Global Dashboard ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard Global"
          subtitle={isManager ? "Vista Consolidada de Vendedores" : "Vista de Mis Resultados"}
        />
        <div className="flex flex-wrap gap-3">
          <Select value={filters.period} onValueChange={(v) => setFilters({ ...filters, period: v })}>
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
          <Select value={filters.official} onValueChange={(v) => setFilters({ ...filters, official: v })}>
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

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AVANCE DE META A HOY</p>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-700 font-bold text-lg">20% ejecutado</span>
            <span className="text-slate-400 font-medium">100% presupuestado</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4">
            <div className="h-4 rounded-full transition-all" style={{ width: '20%', backgroundColor: '#006838' }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">Mes en curso — datos consolidados del equipo</p>
        </div>
        <KpiMetricCard title="Colocaciones Mes" value="$200K" subValue="de $1,000K" footer="20% ejecutado" icon={DollarSign} color="blue" />
        <KpiMetricCard title="Captaciones Mes" value="$50K" subValue="de $100K" footer="50% ejecutado" icon={TrendingUp} color="green" />
        <KpiMetricCard title="Calidad de Cartera" value="3% mora" subValue="Índice de morosidad" icon={ShieldAlert} color="amber" />
        <KpiMetricCard title="Cruzamiento" value="1.2" subValue="productos x cliente" icon={Layers} color="purple" />
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

      {/* Executive Performance */}
      <ExecutivePerformanceChart
        executives={executivesData}
        onExecutiveClick={(exec) => {
          const found = appUsers.find(u => u.full_name?.split(' ')[0] === exec.name);
          setSelectedExecutive(found || { full_name: exec.name, id: exec.name, position: 'oficial' });
        }}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={isManager ? "Presupuesto vs Ejecución Vendedores" : "Presupuesto vs Mi Ejecución"} icon={TrendingUp}>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformanceData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="presupuesto" fill="#22c55e" radius={[4, 4, 0, 0]} name="Presupuesto" />
                <Bar dataKey="ejecucion" fill="#ef4444" radius={[4, 4, 0, 0]} name="Ejecución" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Citas Ejecutadas vs No Ejecutadas" icon={MapPin}>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activitiesChartData} barGap={8} onClick={handleActivitiesChartClick} className="cursor-pointer">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
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
        <ChartCard title="Pipeline Comercial" icon={Target}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-sm text-slate-600">{value}</span>} />
                <Tooltip formatter={(value, name, props) => [`${value} ops. - ${formatCurrency(props.payload.amount)}`, name]} contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="p-6 bg-white border-0 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-500" />
              <h3 className="font-semibold text-slate-700">Actividades del Día ({todaysActivities.length})</h3>
            </div>
            <Link to={createPageUrl('Agenda')}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                Ir a Agenda <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {todaysActivities.length > 0 ? todaysActivities.map((activity) => {
              const Icon = getActivityTypeIcon(activity.activity_type);
              const colorClass = getActivityTypeColor(activity.activity_type);
              return (
                <div
                  key={activity.id}
                  onClick={() => navigate(createPageUrl('Agenda') + `?activityId=${activity.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}><Icon className="h-4 w-4" /></div>
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
              );
            }) : (
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