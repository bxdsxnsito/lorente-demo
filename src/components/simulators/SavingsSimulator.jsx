import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SavingsSimulator() {
  const [initialDeposit, setInitialDeposit] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(5);
  const [interestRate, setInterestRate] = useState(6.0);

  const calculateGrowth = () => {
    const data = [];
    let totalPrincipal = initialDeposit;
    let currentBalance = initialDeposit;
    const monthlyRate = interestRate / 100 / 12;

    for (let year = 0; year <= years; year++) {
      if (year === 0) {
        data.push({
          year: 'Inicio',
          principal: initialDeposit,
          interes: 0,
          total: initialDeposit,
        });
        continue;
      }

      // Calculate for 12 months
      for (let m = 1; m <= 12; m++) {
        const interest = currentBalance * monthlyRate;
        currentBalance += interest + monthlyContribution;
        totalPrincipal += monthlyContribution;
      }

      data.push({
        year: `Año ${year}`,
        principal: Math.round(totalPrincipal),
        interes: Math.round(currentBalance - totalPrincipal),
        total: Math.round(currentBalance),
      });
    }
    return data;
  };

  const data = calculateGrowth();
  const finalResult = data[data.length - 1];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PiggyBank className="h-5 w-5 text-emerald-600" />
          Simulador de Ahorro e Inversión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-1">
            <div>
              <Label className="text-base">Depósito Inicial: {formatCurrency(initialDeposit)}</Label>
              <Slider
                value={[initialDeposit]}
                onValueChange={(v) => setInitialDeposit(v[0])}
                min={0}
                max={100000}
                step={1000}
                className="mt-3"
              />
            </div>
            
            <div>
              <Label className="text-base">Aporte Mensual: {formatCurrency(monthlyContribution)}</Label>
              <Slider
                value={[monthlyContribution]}
                onValueChange={(v) => setMonthlyContribution(v[0])}
                min={0}
                max={5000}
                step={100}
                className="mt-3"
              />
            </div>
            
            <div>
              <Label className="text-base">Plazo: {years} años</Label>
              <Slider
                value={[years]}
                onValueChange={(v) => setYears(v[0])}
                min={1}
                max={30}
                step={1}
                className="mt-3"
              />
            </div>
            
            <div>
              <Label className="text-base">Rentabilidad Anual: {interestRate}%</Label>
              <Slider
                value={[interestRate]}
                onValueChange={(v) => setInterestRate(v[0])}
                min={1}
                max={15}
                step={0.5}
                className="mt-3"
              />
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-4">
              <p className="text-sm text-emerald-800 font-medium mb-2">Resumen Final</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Invertido:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(finalResult.principal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ganancia (Intereses):</span>
                  <span className="font-bold text-emerald-600">+{formatCurrency(finalResult.interes)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between text-base">
                  <span className="font-bold text-emerald-900">Monto Final:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(finalResult.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="lg:col-span-2 h-[400px] bg-white rounded-xl border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="principal" name="Capital Invertido" stackId="a" fill="#94a3b8" radius={[0, 0, 4, 4]} barSize={40} />
                <Bar dataKey="interes" name="Interés Ganado" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="total" name="Crecimiento Total" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <p className="text-xs text-slate-400 text-center mt-4">
          * Proyección estimada asumiendo reinversión de intereses y tasa constante. No garantiza rentabilidad futura.
        </p>
      </CardContent>
    </Card>
  );
}