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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function CheckinDialog({ open, onOpenChange, activity, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState('successful');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && activity) {
      setResult(activity.result || 'successful');
      setNotes(activity.notes || '');
      setLocation(null);
      setFile(null);
    }
  }, [open, activity]);

  const getLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
          toast.success('Ubicación obtenida correctamente');
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
          toast.error('No se pudo obtener la ubicación');
          // Set mock location for demo
          setLocation({ lat: -12.0464, lng: -77.0428 });
        }
      );
    } else {
      setGettingLocation(false);
      toast.error('Geolocalización no soportada');
      // Set mock location for demo
      setLocation({ lat: -12.0464, lng: -77.0428 });
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
        setFile({ name: selectedFile.name, url: file_url });
        toast.success('Documento subido correctamente');
        
        // Save document record
        if (activity) {
          await base44.entities.Document.create({
            client_id: activity.client_id,
            activity_id: activity.id,
            document_type: 'other',
            filename: selectedFile.name,
            file_url: file_url,
            status: 'pending',
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Error al subir documento');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const updateData = {
        status: 'completed',
        result: result,
        notes: notes,
        checkin_at: new Date().toISOString(),
      };
      
      if (location) {
        updateData.checkin_lat = location.lat;
        updateData.checkin_lng = location.lng;
      }
      
      await base44.entities.Activity.update(activity.id, updateData);
      
      // Create audit log
      await base44.entities.Audit.create({
        action: 'checkin',
        entity_type: 'Activity',
        entity_id: activity.id,
        description: `Check-in realizado para actividad: ${activity.title || activity.activity_type}`,
        trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      // Create mock event
      await base44.entities.MockEvent.create({
        event_type: 'activity',
        source: 'checkin',
        payload: JSON.stringify({ action: 'checkin', activity_id: activity.id, location }),
        trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      toast.success('Check-in realizado correctamente');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing activity:', error);
      toast.error('Error al completar actividad');
    } finally {
      setLoading(false);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Check-in de Actividad
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium">{activity.title || activity.activity_type}</p>
            <p className="text-sm text-slate-500">{activity.client_name}</p>
            <p className="text-sm text-slate-500">
              {moment(activity.scheduled_at).format('DD/MM/YYYY HH:mm')}
            </p>
          </div>
          
          {/* Location */}
          <div>
            <Label className="mb-2 block">Ubicación</Label>
            {location ? (
              <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={getLocation}
                disabled={gettingLocation}
                className="w-full"
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Obtener Ubicación
              </Button>
            )}
          </div>
          
          {/* Result */}
          <div>
            <Label>Resultado</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="successful">Exitosa</SelectItem>
                <SelectItem value="no_contact">Sin Contacto</SelectItem>
                <SelectItem value="rescheduled">Reprogramada</SelectItem>
                <SelectItem value="not_interested">Sin Interés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de la visita..."
              rows={3}
            />
          </div>
          
          {/* Document Upload */}
          <div>
            <Label>Adjuntar Documento</Label>
            <div className="mt-2">
              {file ? (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 truncate">{file.name}</span>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="p-4 border-2 border-dashed rounded-lg text-center hover:bg-slate-50 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 mx-auto animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                        <p className="text-sm text-slate-500">Click para subir</p>
                      </>
                    )}
                  </div>
                  <Input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enviado al repositorio (simulado)
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Completar Check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}