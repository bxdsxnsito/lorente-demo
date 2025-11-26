import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import moment from 'moment';

export default function OpportunityFormDialog({ open, onOpenChange, opportunity, clients, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    title: '',
    description: '',
    product_type: 'loan',
    stage: 'lead',
    amount: '',
    probability: 20,
    expected_close_date: moment().add(30, 'days').format('YYYY-MM-DD'),
    notes: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (opportunity) {
      setFormData({
        client_id: opportunity.client_id || '',
        client_name: opportunity.client_name || '',
        title: opportunity.title || '',
        description: opportunity.description || '',
        product_type: opportunity.product_type || 'loan',
        stage: opportunity.stage || 'lead',
        amount: opportunity.amount || '',
        probability: opportunity.probability || 20,
        expected_close_date: opportunity.expected_close_date 
          ? moment(opportunity.expected_close_date).format('YYYY-MM-DD')
          : moment().add(30, 'days').format('YYYY-MM-DD'),
        notes: opportunity.notes || '',
      });
    } else {
      setFormData({
        client_id: '',
        client_name: '',
        title: '',
        description: '',
        product_type: 'loan',
        stage: 'lead',
        amount: '',
        probability: 20,
        expected_close_date: moment().add(30, 'days').format('YYYY-MM-DD'),
        notes: '',
      });
    }
  }, [opportunity]);

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.name || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        official_id: user?.id,
        official_name: user?.full_name,
      };
      
      if (opportunity) {
        await base44.entities.Opportunity.update(opportunity.id, data);
      } else {
        await base44.entities.Opportunity.create(data);
        
        // Create mock event
        await base44.entities.MockEvent.create({
          event_type: 'opportunity',
          source: 'pipeline',
          payload: JSON.stringify({ action: 'create', opportunity: data }),
          trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select 
              value={formData.client_id} 
              onValueChange={handleClientChange}
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
          
          <div>
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Nombre de la oportunidad"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Producto</Label>
              <Select 
                value={formData.product_type} 
                onValueChange={(v) => setFormData({...formData, product_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loan">Préstamo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="insurance">Seguro</SelectItem>
                  <SelectItem value="investment">Inversión</SelectItem>
                  <SelectItem value="account">Cuenta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Etapa</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(v) => setFormData({...formData, stage: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Calificado</SelectItem>
                  <SelectItem value="proposal">Propuesta</SelectItem>
                  <SelectItem value="negotiation">Negociación</SelectItem>
                  <SelectItem value="closed_won">Ganada</SelectItem>
                  <SelectItem value="closed_lost">Perdida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monto Estimado (USD)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="10000"
              />
            </div>
            
            <div>
              <Label>Fecha Cierre Esperada</Label>
              <Input
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label>Probabilidad de Cierre: {formData.probability}%</Label>
            <Slider
              value={[formData.probability]}
              onValueChange={(v) => setFormData({...formData, probability: v[0]})}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descripción de la oportunidad"
              rows={3}
            />
          </div>
          
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
              {opportunity ? 'Guardar Cambios' : 'Crear Oportunidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}