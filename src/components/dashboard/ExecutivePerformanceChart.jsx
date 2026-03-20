import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const getBarColor = (pct) => {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
};

const MOCK_DATA = [
  { name: 'Carlos M.', presupuesto: 50000, ejecucion: 45000 },
  { name: 'María R.',  presupuesto: 50000, ejecucion: 28000 },
  { name: 'José P.',   presupuesto: 50000, ejecucion: 41500 },
  { name: 'Ana G.',    presupuesto: 50000, ejecucion: 12000 },
  { name: 'Luis T.',   presupuesto: 50000, ejecucion: 37000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.payload?.cumplimiento;
  const color = getBarColor(pct);
  const exec = payload[0]?.payload;
  const formatK = (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-800 mb-2">{label}</p>
      <p style={{ color }} className="font-bold text-base">{pct}% cumplimiento</p>
      <p className="text-slate-500 text-xs mt-1">
        {formatK(exec?.ejecucion)} / {formatK(exec?.presupuesto)}
      </p>
    </div>
  );
};

export default function ExecutivePerformanceChart({ executives = [], onExecutiveClick }) {
  const raw = executives.length >= 2 ? executives : MOCK_DATA;

  const data = raw.map(e => ({
    ...e,
    cumplimiento: e.presupuesto > 0
      ? Math.min(Math.round((e.ejecucion / e.presupuesto) * 100), 100)
      : 0,
  }));

  return (
    <Card className="p-6 bg-white border-0 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="h-5 w-5 text-[#0B63FF]" />
        <h3 className="font-semibold text-slate-700">Desempeño Ejecutivo</h3>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Haz clic en una barra para ver el dashboard individual del ejecutivo
      </p>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap="30%"
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            onClick={(chartData) => {
              if (chartData?.activePayload?.length > 0 && onExecutiveClick) {
                onExecutiveClick(chartData.activePayload[0].payload);
              }
            }}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              label={{
                value: 'Cumplimiento',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fill: '#94a3b8', fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11,99,255,0.05)', radius: 4 }} />
            <ReferenceLine
              y={80}
              stroke="#22c55e"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{ value: 'Meta 80%', position: 'right', fontSize: 11, fill: '#22c55e' }}
            />
            <Bar dataKey="cumplimiento" radius={[6, 6, 0, 0]} name="Cumplimiento" minPointSize={4}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.cumplimiento)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-5 mt-3 text-xs text-slate-500 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ≥80% En meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 50–79% Alerta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;50% Crítico
        </span>
      </div>
    </Card>
  );
}