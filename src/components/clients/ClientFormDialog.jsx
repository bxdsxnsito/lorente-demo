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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function ClientFormDialog({ open, onOpenChange, client, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    document_type: 'DNI',
    client_type: '',
    segment: '',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    monthly_income: '',
    risk_score: 750,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        document: client.document || '',
        document_type: client.document_type || 'DNI',
        client_type: client.client_type || '',
        segment: client.segment || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        occupation: client.occupation || '',
        monthly_income: client.monthly_income || '',
        risk_score: client.risk_score || 750,
      });
    } else {
      setFormData({
        name: '',
        document: '',
        document_type: 'DNI',
        client_type: '',
        segment: '',
        phone: '',
        email: '',
        address: '',
        occupation: '',
        monthly_income: '',
        risk_score: 750,
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...formData,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
        risk_score: parseInt(formData.risk_score),
      };
      
      if (client) {
        await base44.entities.Client.update(client.id, data);
      } else {
        await base44.entities.Client.create(data);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nombre Completo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            
            <div>
              <Label>Tipo de Documento</Label>
              <Select 
                value={formData.document_type} 
                onValueChange={(v) => setFormData({...formData, document_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Número de Documento *</Label>
              <Input
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
                placeholder="12345678"
                required
              />
            </div>
            
            <div>
              <Label>Tipo de Cliente</Label>
              <Select 
                value={formData.client_type} 
                onValueChange={(v) => setFormData({...formData, client_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="com_mayor">Com. Mayor</SelectItem>
                  <SelectItem value="com_mayor_vin">Com. Mayor Vin.</SelectItem>
                  <SelectItem value="com_menor">Com. Menor</SelectItem>
                  <SelectItem value="gd_com">GD Com.</SelectItem>
                  <SelectItem value="microcredito">Microcrédito</SelectItem>
                  <SelectItem value="personal_consumo">Personal Consumo</SelectItem>
                  <SelectItem value="personal_vivienda">Personal Vivienda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Segmento</Label>
              <Select 
                value={formData.segment} 
                onValueChange={(v) => setFormData({...formData, segment: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corp_agricola">Corp. Agrícola</SelectItem>
                  <SelectItem value="corp_com_ind_serv">Corp. Com/Ind/Serv</SelectItem>
                  <SelectItem value="corp_ganadero">Corp. Ganadero</SelectItem>
                  <SelectItem value="inv_ifis">Inv. IFIs</SelectItem>
                  <SelectItem value="inv_institucional">Inv. Institucional</SelectItem>
                  <SelectItem value="inv_personal">Inv. Personal</SelectItem>
                  <SelectItem value="personas_consumo">Personas Consumo</SelectItem>
                  <SelectItem value="pyme_agricola">PYME Agrícola</SelectItem>
                  <SelectItem value="pyme_com_ind_serv">PYME Com/Ind/Serv</SelectItem>
                  <SelectItem value="pyme_ganadera">PYME Ganadera</SelectItem>
                  <SelectItem value="sin_productos">Sin Productos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+51 999 888 777"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="cliente@email.com"
              />
            </div>
            
            <div className="col-span-2">
              <Label>Dirección</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Av. Principal 123"
              />
            </div>
            
            <div>
              <Label>Ocupación</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                placeholder="Profesión u ocupación"
              />
            </div>
            
            <div>
              <Label>Ingreso Mensual (USD)</Label>
              <Input
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({...formData, monthly_income: e.target.value})}
                placeholder="5000"
              />
            </div>
            
            <div>
              <Label>Score de Riesgo (0-1000)</Label>
              <Input
                type="number"
                min="0"
                max="1000"
                value={formData.risk_score}
                onChange={(e) => setFormData({...formData, risk_score: e.target.value})}
                placeholder="750"
              />
            </div>
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
              {client ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}