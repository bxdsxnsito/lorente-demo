import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LoanRequestDialog({ open, onOpenChange, clients, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [preApprovalResult, setPreApprovalResult] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    product_code: 'personal',
    principal: '',
    term_months: 12,
    interest_rate: 18.5,
  });

  const calculateMonthlyPayment = () => {
    const P = parseFloat(formData.principal) || 0;
    const r = formData.interest_rate / 100 / 12;
    const n = formData.term_months;
    
    if (P > 0 && r > 0 && n > 0) {
      const payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      return payment.toFixed(2);
    }
    return 0;
  };

  const handlePreApproval = async () => {
    if (!formData.client_id) {
      toast.error('Seleccione un cliente');
      return;
    }
    
    setEvaluating(true);
    setPreApprovalResult(null);
    
    // Simulate evaluation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const client = clients.find(c => c.id === formData.client_id);
    const isApproved = (client?.risk_score || 0) >= 600;
    
    setPreApprovalResult({
      approved: isApproved,
      riskScore: client?.risk_score || 0,
      maxAmount: isApproved ? 50000 : 0,
      message: isApproved 
        ? 'Cliente califica para pre-aprobación' 
        : 'Cliente no califica en este momento',
      traceId: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
    
    setEvaluating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...formData,
        principal: parseFloat(formData.principal),
        monthly_installment: parseFloat(calculateMonthlyPayment()),
        outstanding_balance: parseFloat(formData.principal),
        status: preApprovalResult?.approved ? 'preapproved' : 'in_review',
        probability: preApprovalResult?.approved ? 85 : 40,
        request_date: new Date().toISOString().split('T')[0],
      };
      
      await base44.entities.Loan.create(data);
      
      // Create mock event
      await base44.entities.MockEvent.create({
        event_type: 'loan',
        source: 'loan_request',
        payload: JSON.stringify({ action: 'create', loan: data }),
        trace_id: preApprovalResult?.traceId || `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      toast.success('Solicitud de crédito creada');
      onSuccess();
      onOpenChange(false);
      setFormData({
        client_id: '',
        product_code: 'personal',
        principal: '',
        term_months: 12,
        interest_rate: 18.5,
      });
      setPreApprovalResult(null);
    } catch (error) {
      console.error('Error creating loan:', error);
      toast.error('Error al crear solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Crédito</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select 
              value={formData.client_id} 
              onValueChange={(v) => {
                setFormData({...formData, client_id: v});
                setPreApprovalResult(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Pre-approval evaluation */}
          {formData.client_id && (
            <div className="p-4 bg-slate-50 rounded-lg">
              {evaluating ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">
                    Evaluando pre-aprobación con motor de reglas (simulado)...
                  </span>
                </div>
              ) : preApprovalResult ? (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${
                    preApprovalResult.approved ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {preApprovalResult.approved ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">{preApprovalResult.message}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Score de riesgo: {preApprovalResult.riskScore}
                  </p>
                  {preApprovalResult.approved && (
                    <p className="text-sm text-green-600">
                      Monto máximo pre-aprobado: ${preApprovalResult.maxAmount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    Trace: {preApprovalResult.traceId}
                  </p>
                </div>
              ) : (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handlePreApproval}
                  className="w-full"
                >
                  Evaluar Pre-aprobación
                </Button>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Producto</Label>
              <Select 
                value={formData.product_code} 
                onValueChange={(v) => setFormData({...formData, product_code: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="hipotecario">Hipotecario</SelectItem>
                  <SelectItem value="vehicular">Vehicular</SelectItem>
                  <SelectItem value="consumo">Consumo</SelectItem>
                  <SelectItem value="capital_trabajo">Capital de Trabajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Plazo (meses)</Label>
              <Select 
                value={formData.term_months.toString()} 
                onValueChange={(v) => setFormData({...formData, term_months: parseInt(v)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                  <SelectItem value="48">48 meses</SelectItem>
                  <SelectItem value="60">60 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monto (USD) *</Label>
              <Input
                type="number"
                value={formData.principal}
                onChange={(e) => setFormData({...formData, principal: e.target.value})}
                placeholder="10000"
                required
              />
            </div>
            
            <div>
              <Label>Tasa Anual (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={(e) => setFormData({...formData, interest_rate: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          
          {formData.principal && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">Cuota Mensual Estimada</p>
              <p className="text-2xl font-bold text-blue-600">
                ${calculateMonthlyPayment()}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}