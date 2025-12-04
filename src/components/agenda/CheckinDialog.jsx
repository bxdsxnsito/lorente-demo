import React, { useState, useEffect, useRef } from 'react';
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
import { MapPin, Upload, Loader2, CheckCircle, AlertCircle, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function CheckinDialog({ open, onOpenChange, activity, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState('successful');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (open && activity) {
      setResult(activity.result || 'successful');
      setNotes(activity.notes || '');
      setLocation(null);
      setFiles([]);
      setIsCameraOpen(false);
    }
    
    return () => {
      stopCamera();
    };
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

  const processFilesUpload = async (filesToUpload) => {
    if (filesToUpload.length === 0) return;
    
    setUploading(true);
    try {
      const newFiles = [];
      for (const selectedFile of filesToUpload) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
          
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
          newFiles.push({ name: selectedFile.name, url: file_url });
      }
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} documento(s) subido(s) correctamente`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFilesUpload(selectedFiles);
    e.target.value = '';
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      // Wait for modal to render video element
      setTimeout(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera", err);
      toast.error("No se pudo acceder a la cámara");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob(blob => {
        const file = new File([blob], `foto_${moment().format('YYYYMMDD_HHmmss')}.jpg`, { type: "image/jpeg" });
        processFilesUpload([file]);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Call backend function for check-in processing
      const response = await base44.functions.invoke('processCheckin', {
        activity_id: activity.id,
        result: result,
        notes: notes,
        location: location,
        document_urls: files.map(f => f.url),
      });
      
      const data = response.data;
      
      if (data.success) {
        toast.success(`Check-in realizado. ${data.location_message || ''}`);
        if (data.rules_evaluated > 0) {
          toast.info(`${data.rules_evaluated} reglas evaluadas`);
        }
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Error al procesar check-in');
      }
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
            <Label>Adjuntar Documentos / Fotos</Label>
            
            {/* File List */}
            {files.length > 0 && (
              <div className="mt-2 space-y-2 mb-3">
                {files.map((f, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-blue-700 truncate">{f.name}</span>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-blue-400 hover:text-blue-600"
                      onClick={() => removeFile(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-3">
               {/* Upload Button */}
               <div>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-auto py-4 flex flex-col gap-2"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    ) : (
                      <Upload className="h-5 w-5 text-slate-500" />
                    )}
                    <span className="text-xs">Subir Archivos</span>
                  </Button>
                  <Input 
                    id="file-upload"
                    type="file" 
                    multiple
                    className="hidden" 
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
               </div>

               {/* Camera Button */}
               <div>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-auto py-4 flex flex-col gap-2"
                    onClick={startCamera}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-500" />
                    )}
                    <span className="text-xs">Tomar Foto</span>
                  </Button>
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Los documentos y fotos se guardarán automáticamente.
            </p>
          </div>
          
          {/* Camera Overlay */}
          {isCameraOpen && (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-lg bg-black rounded-lg overflow-hidden aspect-[3/4] md:aspect-video">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                    onClick={stopCamera}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  
                  <Button 
                    size="icon"
                    className="h-16 w-16 rounded-full bg-white border-4 border-white/30 hover:bg-slate-100"
                    onClick={capturePhoto}
                  >
                    <div className="h-12 w-12 rounded-full border-2 border-black/10" />
                  </Button>
                  
                  <div className="w-12" /> {/* Spacer for balance */}
                </div>
              </div>
            </div>
          )}
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