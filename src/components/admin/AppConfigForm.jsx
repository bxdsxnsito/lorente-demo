import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, Upload, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppConfigForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    appName: 'Bancop',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#1565C0',
    secondaryColor: '#0D47A1',
    isActive: true
  });

  // Fetch existing config
  const { data: configs, isLoading } = useQuery({
    queryKey: ['appConfig'],
    queryFn: () => base44.entities.AppConfig.list(),
  });

  // Set form data when config loads
  useEffect(() => {
    if (configs && configs.length > 0) {
      const config = configs[0];
      setFormData({
        id: config.id,
        appName: config.appName || 'Banca Digital',
        logoUrl: config.logoUrl || '',
        faviconUrl: config.faviconUrl || '',
        primaryColor: config.primaryColor || '#0B63FF',
        secondaryColor: config.secondaryColor || '#0A4DB6',
        isActive: config.isActive ?? true
      });
    }
  }, [configs]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.AppConfig.update(data.id, data);
      } else {
        return base44.entities.AppConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appConfig']);
      toast.success('Configuración actualizada correctamente');
      // Force reload to apply changes immediately if needed, 
      // or rely on Layout to pick up changes via query
      setTimeout(() => window.location.reload(), 1000); 
    },
    onError: () => {
      toast.error('Error al guardar la configuración');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateConfigMutation.mutate(formData);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Subiendo imagen...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
      toast.success('Imagen subida', { id: toastId });
    } catch (error) {
      toast.error('Error al subir imagen', { id: toastId });
      console.error('Upload error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Configuración Global</CardTitle>
        <CardDescription>Personaliza la apariencia y branding de la aplicación</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre de la Aplicación</Label>
              <Input 
                value={formData.appName} 
                onChange={(e) => setFormData({...formData, appName: e.target.value})}
                placeholder="Banca Digital"
              />
            </div>

            <div className="space-y-2">
              <Label>Favicon (Icono de navegador)</Label>
              <div className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded border flex items-center justify-center overflow-hidden bg-white">
                  {formData.faviconUrl ? (
                    <img src={formData.faviconUrl} alt="Favicon" className="h-6 w-6 object-contain" />
                  ) : (
                    <div className="h-4 w-4 bg-slate-200 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/png, image/ico, image/svg+xml"
                    className="hidden" 
                    id="favicon-upload"
                    onChange={(e) => handleFileUpload(e, 'faviconUrl')}
                  />
                  <Label 
                    htmlFor="favicon-upload"
                    className="cursor-pointer inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-100"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Subir Icono
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo Principal (Sidebar y Header)</Label>
              <div className="flex gap-4 items-center">
                 <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center overflow-hidden">
                    {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
                    ) : (
                        <span className="text-white font-bold text-xs">Logo</span>
                    )}
                 </div>
                 <div className="flex-1">
                    <Input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        id="logo-upload"
                        onChange={(e) => handleFileUpload(e, 'logoUrl')}
                    />
                    <Label 
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-100"
                    >
                        <Upload className="mr-2 h-4 w-4" /> Subir Logo
                    </Label>
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Colores del Tema</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Color Primario (Degradado Inicio)</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="color" 
                            value={formData.primaryColor}
                            className="w-12 h-10 p-1 px-1"
                            onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        />
                        <Input 
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                            className="font-mono"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Color Secundario (Degradado Fin)</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="color" 
                            value={formData.secondaryColor}
                            className="w-12 h-10 p-1 px-1"
                            onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                        />
                        <Input 
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                            className="font-mono"
                        />
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
                type="submit" 
                disabled={updateConfigMutation.isPending}
                className="bg-[#1565C0] hover:bg-[#0D47A1]"
            >
                {updateConfigMutation.isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                    </>
                )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}