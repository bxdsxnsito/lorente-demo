import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Building,
  Save,
  Loader2,
  Camera,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    avatar_url: '',
    specialty: '',
    department: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Fetch linked AppUser
        const appUsers = await base44.entities.AppUser.list();
        const linked = appUsers.find(au => au.user_id === currentUser.id || au.email === currentUser.email);
        
        if (linked) {
          setAppUser(linked);
          setFormData({
            phone: linked.phone || '',
            avatar_url: linked.avatar_url || '',
            specialty: linked.specialty || '',
            department: linked.department || ''
          });
        }
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (appUser) {
        return base44.entities.AppUser.update(appUser.id, data);
      } else {
        // Create new AppUser if doesn't exist (though typically handled by Admin)
        // For now we'll just update if exists, or error
        throw new Error("No se encontró perfil de AppUser vinculado. Contacte al administrador.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appUser']);
      toast.success('Perfil actualizado correctamente');
    },
    onError: (err) => {
      toast.error('Error al actualizar perfil: ' + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        icon={User}
        title="Mi Perfil"
        subtitle="Gestiona tu información personal y profesional"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-0 shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg mx-auto">
                <AvatarImage src={formData.avatar_url || user.avatar_url} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                  {getInitials(appUser?.full_name || user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-slate-100 cursor-pointer hover:bg-slate-50">
                <Camera className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900">{appUser?.full_name || user.full_name}</h2>
            <p className="text-sm text-slate-500 mb-4">{appUser?.position || 'Usuario'}</p>
            
            <div className="flex justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                {appUser?.role || 'User'}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Activo
              </span>
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{formData.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Building className="h-4 w-4 text-slate-400" />
                <span>{appUser?.branch || 'Oficina Central'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Actualiza la información de tu perfil profesional visible para otros usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input 
                    id="fullName" 
                    value={appUser?.full_name || user.full_name || ''} 
                    disabled 
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">Gestionado por Recursos Humanos</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input 
                    id="email" 
                    value={user.email} 
                    disabled 
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo / Posición</Label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <Input 
                      id="position" 
                      value={appUser?.position || ''} 
                      disabled 
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Sucursal</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <Input 
                      id="branch" 
                      value={appUser?.branch || ''} 
                      disabled 
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de Contacto</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+51 999 999 999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">URL de Avatar</Label>
                  <Input 
                    id="avatar_url" 
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input 
                    id="department" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input 
                    id="specialty" 
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <p>
                  Cierta información como el cargo y la sucursal solo pueden ser modificados por un administrador.
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}