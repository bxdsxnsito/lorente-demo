import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const getBarColor = (pct) => {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
};

const formatCurrency = (v) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

export default function ExecutivePerformanceChart({ executives = [], onExecutiveClick }) {
  // Use real data if available (≥2), otherwise use mock
  const MOCK = [
    { name: 'Carlos M.', presupuesto: 50000, ejecucion: 45000 },
    { name: 'María R.',  presupuesto: 50000, ejecucion: 28000 },
    { name: 'José P.',   presupuesto: 50000, ejecucion: 41000 },
    { name: 'Ana G.',    presupuesto: 50000, ejecucion: 12000 },
    { name: 'Luis T.',   presupuesto: 50000, ejecucion: 37000 },
  ];

  const raw = executives.length >= 2 ? executives : MOCK;

  const data = raw.map(e => ({
    ...e,
    pct: e.presupuesto > 0 ? Math.min(Math.round((e.ejecucion / e.presupuesto) * 100), 100) : 0,
  }));

  return (
    <Card className="p-6 bg-white border-0 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="h-5 w-5 text-[#0B63FF]" />
        <h3 className="font-semibold text-slate-700">Desempeño Ejecutivo</h3>
      </div>
      <p className="text-xs text-slate-400 mb-5">Haz clic en un ejecutivo para ver su dashboard individual</p>

      {/* Custom horizontal bar chart */}
      <div className="space-y-3">
        {data.map((exec, i) => {
          const color = getBarColor(exec.pct);
          const pctDisplay = Math.max(exec.pct, 2); // minimum visible width
          return (
            <div
              key={i}
              className="cursor-pointer group"
              onClick={() => onExecutiveClick && onExecutiveClick(exec)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  {exec.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {formatCurrency(exec.ejecucion)} / {formatCurrency(exec.presupuesto)}
                  </span>
                  <span className="text-sm font-bold w-10 text-right" style={{ color }}>
                    {exec.pct}%
                  </span>
                </div>
              </div>
              {/* Track */}
              <div className="w-full bg-slate-100 rounded-full h-5 relative overflow-hidden">
                {/* Bar */}
                <div
                  className="h-5 rounded-full transition-all duration-500"
                  style={{ width: `${pctDisplay}%`, backgroundColor: color }}
                />
                {/* 80% reference line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400 opacity-50"
                  style={{ left: '80%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-5 text-xs text-slate-500 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ≥80% En meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 50–79% Alerta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;50% Crítico
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-4 bg-slate-400 inline-block opacity-50" /> Meta 80%
        </span>
      </div>
    </Card>
  );
}