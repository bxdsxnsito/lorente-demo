import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Globe,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [formData, setFormData] = useState({
    setting_key: '',
    value: '',
    description: '',
    category: 'general',
    is_enabled: true
  });

  const queryClient = useQueryClient();

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

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['userSettings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.UserSetting.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserSetting.create({ ...data, user_id: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['userSettings']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('Configuración creada');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserSetting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userSettings']);
      setIsDialogOpen(false);
      setEditingSetting(null);
      resetForm();
      toast.success('Configuración actualizada');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserSetting.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['userSettings']);
      toast.success('Configuración eliminada');
    }
  });

  const resetForm = () => {
    setFormData({
      setting_key: '',
      value: '',
      description: '',
      category: 'general',
      is_enabled: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (setting) => {
    setEditingSetting(setting);
    setFormData({
      setting_key: setting.setting_key,
      value: setting.value,
      description: setting.description,
      category: setting.category,
      is_enabled: setting.is_enabled
    });
    setIsDialogOpen(true);
  };

  const toggleSetting = (setting) => {
    updateMutation.mutate({ 
      id: setting.id, 
      data: { is_enabled: !setting.is_enabled } 
    });
  };

  const categories = {
    general: { icon: Globe, label: 'General', color: 'text-blue-600 bg-blue-100' },
    notifications: { icon: Bell, label: 'Notificaciones', color: 'text-amber-600 bg-amber-100' },
    appearance: { icon: Moon, label: 'Apariencia', color: 'text-purple-600 bg-purple-100' },
    security: { icon: Shield, label: 'Seguridad', color: 'text-green-600 bg-green-100' }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const cat = setting.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(setting);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title="Configuración"
        subtitle="Preferencias y ajustes del sistema"
      >
        <Button 
            className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
            onClick={() => {
                setEditingSetting(null);
                resetForm();
                setIsDialogOpen(true);
            }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Configuración
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <SettingsIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Sin configuraciones</h3>
          <p className="text-slate-500 mt-1 mb-4">No tienes configuraciones personalizadas guardadas.</p>
          <Button onClick={() => setIsDialogOpen(true)}>Crear Primera Configuración</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => {
            const CatIcon = categories[category]?.icon || Globe;
            return (
              <Card key={category} className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${categories[category]?.color || 'bg-slate-100'}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <CardTitle className="capitalize">{categories[category]?.label || category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {categorySettings.map((setting, index) => (
                    <div 
                      key={setting.id} 
                      className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${
                        index !== categorySettings.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-slate-900">{setting.setting_key}</h4>
                          <Badge variant={setting.is_enabled ? 'default' : 'secondary'} className={setting.is_enabled ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500'}>
                            {setting.is_enabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">{setting.description || 'Sin descripción'}</p>
                        <p className="text-xs font-mono text-slate-400 bg-slate-100 inline-block px-2 py-0.5 rounded">
                          Valor: {setting.value}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSetting(setting)}
                          className={setting.is_enabled ? "text-green-600" : "text-slate-400"}
                          title={setting.is_enabled ? "Desactivar" : "Activar"}
                        >
                          {setting.is_enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(setting)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if(confirm('¿Eliminar esta configuración?')) deleteMutation.mutate(setting.id);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetting ? 'Editar Configuración' : 'Nueva Configuración'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Clave (Key)</Label>
              <Input
                id="key"
                placeholder="ej. dark_mode, email_notifications"
                value={formData.setting_key}
                onChange={(e) => setFormData({...formData, setting_key: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                placeholder="Valor de la configuración"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({...formData, category: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="notifications">Notificaciones</SelectItem>
                  <SelectItem value="appearance">Apariencia</SelectItem>
                  <SelectItem value="security">Seguridad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Para qué sirve esta configuración"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="enabled"
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({...formData, is_enabled: checked})}
              />
              <Label htmlFor="enabled">Habilitado</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#0B63FF]">{editingSetting ? 'Guardar Cambios' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}