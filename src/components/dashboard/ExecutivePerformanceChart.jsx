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
} from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-blue-600">Cumplimiento: <strong>{payload[0]?.value}%</strong></p>
        {payload[1] && <p className="text-slate-400">Meta: 100%</p>}
      </div>
    );
  }
  return null;
};

export default function ExecutivePerformanceChart({ executives, onExecutiveClick }) {
  if (!executives || executives.length === 0) {
    return (
      <Card className="p-6 bg-white border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-700">Desempeño Ejecutivo</h3>
        </div>
        <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
          No hay ejecutivos registrados
        </div>
      </Card>
    );
  }

  const getBarColor = (value) => {
    if (value >= 80) return '#22c55e';
    if (value >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card className="p-6 bg-white border-0 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="h-5 w-5 text-[#006838]" />
        <h3 className="font-semibold text-slate-700">Desempeño Ejecutivo</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">Haz clic en un ejecutivo para ver su dashboard</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={executives}
            onClick={(data) => {
              if (data?.activePayload?.length > 0) {
                const exec = data.activePayload[0].payload;
                onExecutiveClick(exec);
              }
            }}
            className="cursor-pointer"
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
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
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11,99,255,0.05)' }} />
            <Bar dataKey="cumplimiento" radius={[6, 6, 0, 0]} name="Cumplimiento %">
              {executives.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.cumplimiento)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 text-xs text-slate-500 justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> ≥80% En meta</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> 50-79% Alerta</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> &lt;50% Crítico</span>
      </div>
    </Card>
  );
}