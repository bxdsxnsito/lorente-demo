import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

export default function LoanSimulator() {
  const [principal, setPrincipal] = useState(10000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(18.5);
  const [showSchedule, setShowSchedule] = useState(false);

  const calculateMonthlyPayment = () => {
    const P = principal;
    const r = interestRate / 100 / 12;
    const n = termMonths;
    
    if (P > 0 && r > 0 && n > 0) {
      const payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      return payment;
    }
    return 0;
  };

  const generateAmortizationSchedule = () => {
    const schedule = [];
    let balance = principal;
    const monthlyPayment = calculateMonthlyPayment();
    const monthlyRate = interestRate / 100 / 12;
    
    for (let month = 1; month <= termMonths; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest,
        balance: Math.max(0, balance),
      });
    }
    
    return schedule;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - principal;

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
          <Calculator className="h-5 w-5 text-blue-600" />
          Simulador de Crédito Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <div>
              <Label className="text-base">Monto del Préstamo: {formatCurrency(principal)}</Label>
              <Slider
                value={[principal]}
                onValueChange={(v) => setPrincipal(v[0])}
                min={1000}
                max={100000}
                step={1000}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>$1,000</span>
                <span>$100,000</span>
              </div>
            </div>
            
            <div>
              <Label className="text-base">Plazo: {termMonths} meses</Label>
              <Slider
                value={[termMonths]}
                onValueChange={(v) => setTermMonths(v[0])}
                min={6}
                max={72}
                step={6}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>6 meses</span>
                <span>72 meses</span>
              </div>
            </div>
            
            <div>
              <Label className="text-base">Tasa de Interés Anual (TEA): {interestRate}%</Label>
              <Slider
                value={[interestRate]}
                onValueChange={(v) => setInterestRate(v[0])}
                min={5}
                max={40}
                step={0.5}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5%</span>
                <span>40%</span>
              </div>
            </div>
          </div>
          
          {/* Results */}
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
              <p className="text-sm opacity-90 font-medium">Cuota Mensual Estimada</p>
              <p className="text-4xl font-bold mt-2">{formatCurrency(monthlyPayment)}</p>
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm opacity-90">
                <span>TEA: {interestRate}%</span>
                <span>Plazo: {termMonths} meses</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Total a Pagar</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalPayment)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Total Intereses</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalInterest)}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setShowSchedule(!showSchedule)}
            >
              {showSchedule ? 'Ocultar' : 'Ver'} Cronograma de Pagos
            </Button>
          </div>
        </div>
        
        {/* Amortization Schedule */}
        {showSchedule && (
          <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="font-semibold text-slate-900 mb-4">Cronograma de Pagos Referencial</h3>
            <ScrollArea className="h-[300px] rounded-lg border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 sticky top-0">
                    <TableHead className="w-[80px]">Mes</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Capital</TableHead>
                    <TableHead>Interés</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generateAmortizationSchedule().map((row) => (
                    <TableRow key={row.month} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-center bg-slate-50/30">{row.month}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(row.payment)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(row.principal)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(row.interest)}</TableCell>
                      <TableCell className="text-right text-slate-600">{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
        
        <p className="text-xs text-slate-400 text-center mt-4">
          * Los valores son referenciales y están sujetos a evaluación crediticia al momento de la solicitud.
        </p>
      </CardContent>
    </Card>
  );
}