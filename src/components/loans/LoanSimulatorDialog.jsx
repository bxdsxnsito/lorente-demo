import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LoanSimulatorDialog({ open, onOpenChange }) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Simulador de Crédito
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <Label>Monto del Préstamo: {formatCurrency(principal)}</Label>
                <Slider
                  value={[principal]}
                  onValueChange={(v) => setPrincipal(v[0])}
                  min={1000}
                  max={100000}
                  step={1000}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>$1,000</span>
                  <span>$100,000</span>
                </div>
              </div>
              
              <div>
                <Label>Plazo: {termMonths} meses</Label>
                <Slider
                  value={[termMonths]}
                  onValueChange={(v) => setTermMonths(v[0])}
                  min={6}
                  max={72}
                  step={6}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>6 meses</span>
                  <span>72 meses</span>
                </div>
              </div>
              
              <div>
                <Label>Tasa de Interés Anual: {interestRate}%</Label>
                <Slider
                  value={[interestRate]}
                  onValueChange={(v) => setInterestRate(v[0])}
                  min={5}
                  max={40}
                  step={0.5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5%</span>
                  <span>40%</span>
                </div>
              </div>
            </div>
            
            {/* Results */}
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <p className="text-sm opacity-80">Cuota Mensual</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(monthlyPayment)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Total a Pagar</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPayment)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Total Intereses</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(totalInterest)}</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                {showSchedule ? 'Ocultar' : 'Ver'} Tabla de Amortización
              </Button>
            </div>
          </div>
          
          {/* Amortization Schedule */}
          {showSchedule && (
            <ScrollArea className="h-[300px] rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Cuota</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Capital</TableHead>
                    <TableHead>Interés</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generateAmortizationSchedule().map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell>{formatCurrency(row.payment)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(row.principal)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(row.interest)}</TableCell>
                      <TableCell>{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          
          <p className="text-xs text-slate-400 text-center">
            * Simulación con fines informativos. Las condiciones finales pueden variar (simulado).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}