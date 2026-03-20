import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Users, ShieldAlert, Layers } from 'lucide-react';
import KpiMetricCard from './KpiMetricCard';

// Hardcoded drill-down mock data per level
const LEVEL_DATA = {
  0: { // Top level (global)
    colocaciones: { actual: 200000, meta: 1000000 },
    captaciones: { actual: 50000, meta: 100000 },
    mora: 3.0,
    cruzamiento: 1.2,
    avance_pct: 20,
    presupuesto_pct: 100,
  },
  1: { // Supervisor level
    colocaciones: { actual: 80000, meta: 300000 },
    captaciones: { actual: 20000, meta: 40000 },
    mora: 2.5,
    cruzamiento: 1.4,
    avance_pct: 26,
    presupuesto_pct: 100,
  },
  2: { // Ejecutivo level
    colocaciones: { actual: 25000, meta: 80000 },
    captaciones: { actual: 6000, meta: 12000 },
    mora: 1.8,
    cruzamiento: 1.6,
    avance_pct: 31,
    presupuesto_pct: 100,
  }
};

const getBarColor = (v) => v >= 80 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444';

const formatCurrency = (v) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

export default function ExecutiveDrilldownModal({ executive, level = 0, appUsers, onClose }) {
  if (!executive) return null;

  const data = LEVEL_DATA[Math.min(level, 2)];

  // Build sub-executives from appUsers (if any are supervised by this one)
  const subExecutives = appUsers
    .filter(u => u.supervisor_id === executive.id || (level === 0 && u.position === 'supervisor'))
    .map(u => ({
      id: u.id,
      full_name: u.full_name,
      name: u.full_name?.split(' ')[0] || 'Ejecutivo',
      cumplimiento: Math.floor(40 + Math.random() * 60),
      budget: u.monthly_budget || 50000,
    }));

  // If no sub-executives, generate mock ones for demo
  const chartData = subExecutives.length > 0 ? subExecutives : [
    { name: 'Sin reportes', cumplimiento: 0 }
  ];

  const hasSubordinates = subExecutives.length > 0;

  const pctColoc = Math.round((data.colocaciones.actual / data.colocaciones.meta) * 100);
  const pctCaptac = Math.round((data.captaciones.actual / data.captaciones.meta) * 100);

  const [drillExec, setDrillExec] = React.useState(null);

  return (
    <>
      <Dialog open={!!executive} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 uppercase tracking-wide">
              META EJECUTIVO MES — {executive.full_name || executive.name}
            </DialogTitle>
          </DialogHeader>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {/* Avance de Colocaciones */}
            <div className="col-span-2 lg:col-span-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Avance de Colocaciones a Hoy
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-600 font-bold">{data.avance_pct}% ejecutado</span>
                      <span className="text-slate-400">{data.presupuesto_pct}% presupuestado</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${data.avance_pct}%`,
                          background: getBarColor(data.avance_pct)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <KpiMetricCard
              title="Colocaciones Mes"
              value={formatCurrency(data.colocaciones.actual)}
              subValue={`de ${formatCurrency(data.colocaciones.meta)}`}
              footer={`${pctColoc}% ejecutado`}
              icon={DollarSign}
              color="blue"
            />
            <KpiMetricCard
              title="Captaciones Mes"
              value={formatCurrency(data.captaciones.actual)}
              subValue={`de ${formatCurrency(data.captaciones.meta)}`}
              footer={`${pctCaptac}% ejecutado`}
              icon={TrendingUp}
              color="green"
            />
            <KpiMetricCard
              title="Calidad de Cartera"
              value={`${data.mora}% mora`}
              subValue="Índice de morosidad"
              icon={ShieldAlert}
              color={data.mora > 3 ? 'red' : 'amber'}
            />
            <KpiMetricCard
              title="Cruzamiento"
              value={data.cruzamiento.toFixed(1)}
              subValue="productos x cliente"
              icon={Layers}
              color="purple"
            />
          </div>

          {/* Sub-executives chart */}
          {hasSubordinates && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Desempeño del Equipo — haz clic para ver detalle
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    onClick={(d) => {
                      if (d?.activePayload?.length > 0) {
                        const found = appUsers.find(u => u.full_name?.split(' ')[0] === d.activePayload[0].payload.name || u.full_name === d.activePayload[0].payload.full_name);
                        if (found) setDrillExec(found);
                      }
                    }}
                    className="cursor-pointer"
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Cumplimiento']} />
                    <Bar dataKey="cumplimiento" radius={[5, 5, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={getBarColor(entry.cumplimiento)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recursive drill-down */}
      {drillExec && (
        <ExecutiveDrilldownModal
          executive={drillExec}
          level={level + 1}
          appUsers={appUsers}
          onClose={() => setDrillExec(null)}
        />
      )}
    </>
  );
}