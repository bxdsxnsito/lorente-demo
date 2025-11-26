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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import moment from 'moment';

export default function ActivityFormDialog({ open, onOpenChange, activity, clients, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    activity_type: 'visit',
    title: '',
    description: '',
    scheduled_at: moment().format('YYYY-MM-DDTHH:mm'),
    priority: 'medium',
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
    if (activity) {
      setFormData({
        client_id: activity.client_id || '',
        client_name: activity.client_name || '',
        activity_type: activity.activity_type || 'visit',
        title: activity.title || '',
        description: activity.description || '',
        scheduled_at: activity.scheduled_at 
          ? moment(activity.scheduled_at).format('YYYY-MM-DDTHH:mm') 
          : moment().format('YYYY-MM-DDTHH:mm'),
        priority: activity.priority || 'medium',
        notes: activity.notes || '',
      });
    } else {
      setFormData({
        client_id: '',
        client_name: '',
        activity_type: 'visit',
        title: '',
        description: '',
        scheduled_at: moment().format('YYYY-MM-DDTHH:mm'),
        priority: 'medium',
        notes: '',
      });
    }
  }, [activity]);

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
        official_id: user?.id,
        official_name: user?.full_name,
        status: 'pending',
      };
      
      if (activity) {
        await base44.entities.Activity.update(activity.id, data);
      } else {
        await base44.entities.Activity.create(data);
        
        // Create mock event
        await base44.entities.MockEvent.create({
          event_type: 'activity',
          source: 'agenda',
          payload: JSON.stringify({ action: 'create', activity: data }),
          trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {activity ? 'Editar Actividad' : 'Nueva Actividad'}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Actividad</Label>
              <Select 
                value={formData.activity_type} 
                onValueChange={(v) => setFormData({...formData, activity_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="call">Llamada</SelectItem>
                  <SelectItem value="meeting">Reunión</SelectItem>
                  <SelectItem value="follow_up">Seguimiento</SelectItem>
                  <SelectItem value="presentation">Presentación</SelectItem>
                  <SelectItem value="document_collection">Recolección Docs</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Prioridad</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData({...formData, priority: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Título de la actividad"
            />
          </div>
          
          <div>
            <Label>Fecha y Hora *</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descripción de la actividad"
              rows={3}
            />
          </div>
          
          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notas adicionales"
              rows={2}
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
              {activity ? 'Guardar Cambios' : 'Crear Actividad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}