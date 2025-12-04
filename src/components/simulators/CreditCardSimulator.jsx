import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CreditCardSimulator() {
  const [amount, setAmount] = useState(2500);
  const [installments, setInstallments] = useState(12);
  const [interestRate, setInterestRate] = useState(35); // TEA Tarjeta promedio

  const calculateInstallment = () => {
    const P = amount;
    const r = interestRate / 100 / 12; // Tasa mensual aproximada
    const n = installments;
    
    if (n === 1) return P; // Directo (sin interes si paga a tiempo, pero asumimos simulacion de cuotas)
    
    if (P > 0 && r > 0 && n > 0) {
      // Formula cuota fija: R = P * (r(1+r)^n) / ((1+r)^n - 1)
      const payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      return payment;
    }
    return 0;
  };

  const monthlyPayment = calculateInstallment();
  const totalPayment = monthlyPayment * installments;
  const totalInterest = totalPayment - amount;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    }).format(value || 0);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-purple-600" />
          Simulador de Cuotas (Tarjeta de Crédito)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <div>
              <Label className="text-base">Monto de la Compra: {formatCurrency(amount)}</Label>
              <Slider
                value={[amount]}
                onValueChange={(v) => setAmount(v[0])}
                min={100}
                max={20000}
                step={100}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>$100</span>
                <span>$20,000</span>
              </div>
            </div>
            
            <div>
              <Label className="text-base">Cuotas: {installments}</Label>
              <Slider
                value={[installments]}
                onValueChange={(v) => setInstallments(v[0])}
                min={1}
                max={36}
                step={1}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 cuota</span>
                <span>36 cuotas</span>
              </div>
            </div>
            
            <div>
              <Label className="text-base">TEA Tarjeta: {interestRate}%</Label>
              <Slider
                value={[interestRate]}
                onValueChange={(v) => setInterestRate(v[0])}
                min={15}
                max={85}
                step={1}
                className="mt-3"
              />
            </div>
          </div>
          
          {/* Results */}
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-sm opacity-90">Cuota Mensual Estimada</p>
                  <p className="text-4xl font-bold mt-2">{formatCurrency(monthlyPayment)}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
                    <CreditCard className="h-4 w-4" />
                    <span>Sistema de cuotas</span>
                  </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10"></div>
                <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/5"></div>
             </div>

             <div className="bg-slate-50 rounded-xl border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Monto Compra:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Intereses Totales:</span>
                  <span className="font-medium text-red-600">+{formatCurrency(totalInterest)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total a Pagar:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalPayment)}</span>
                </div>
             </div>
          </div>
        </div>

        {installments > 1 && (
          <div className="mt-4">
             <h4 className="text-sm font-medium text-slate-700 mb-3">Desglose de Cuotas (Primeros 6 meses)</h4>
             <div className="rounded-lg border overflow-hidden">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-slate-50">
                     <TableHead>Cuota #</TableHead>
                     <TableHead>Pago Total</TableHead>
                     <TableHead>Capital</TableHead>
                     <TableHead>Interés</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {Array.from({ length: Math.min(installments, 6) }).map((_, i) => {
                     // Cálculo simplificado de desglose (sistema francés)
                     const monthlyRate = interestRate / 100 / 12;
                     // Nota: Esto es una aproximación para visualización, el cálculo real requiere iteración estado previo
                     // Reutilizamos logica si quisieramos exactitud, pero para "preview" basta mostrar la cuota fija
                     return (
                       <TableRow key={i}>
                         <TableCell>{i + 1}</TableCell>
                         <TableCell className="font-medium">{formatCurrency(monthlyPayment)}</TableCell>
                         <TableCell className="text-slate-500">Variable</TableCell>
                         <TableCell className="text-slate-500">Variable</TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
               {installments > 6 && (
                 <div className="p-2 text-center text-xs text-slate-500 bg-slate-50">
                   ... y {installments - 6} cuotas más
                 </div>
               )}
             </div>
          </div>
        )}
        
        <p className="text-xs text-slate-400 text-center mt-4">
          * Simulación referencial para compras en cuotas. No incluye seguro de desgravamen ni otros cargos.
        </p>
      </CardContent>
    </Card>
  );
}