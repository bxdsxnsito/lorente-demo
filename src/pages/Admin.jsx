import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Users,
  Shield,
  Zap,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';

export default function Admin() {
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: appUsers = [], refetch: refetchAppUsers } = useQuery({
    queryKey: ['appUsers'],
    queryFn: () => base44.entities.AppUser.list(),
  });

  const { data: baseUsers = [] } = useQuery({
    queryKey: ['baseUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const linkUserMutation = useMutation({
    mutationFn: ({ appUserId, baseUserId }) => base44.entities.AppUser.update(appUserId, { user_id: baseUserId }),
    onSuccess: () => {
      refetchAppUsers();
      toast.success('Usuario vinculado correctamente');
    },
  });

  const { data: rules = [], refetch: refetchRules } = useQuery({
    queryKey: ['rules'],
    queryFn: () => base44.entities.Rule.list(),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rules']);
      toast.success('Regla actualizada');
    },
  });

  const toggleRule = async (rule) => {
    await updateRuleMutation.mutateAsync({
      id: rule.id,
      data: { active: !rule.active }
    });
  };

  const getPositionLabel = (position) => {
    const labels = {
      oficial: 'Oficial de Negocios',
      supervisor: 'Supervisor',
      gerente: 'Gerente Comercial',
      admin: 'Administrador'
    };
    return labels[position] || 'Usuario';
  };

  const getPositionColor = (position) => {
    const colors = {
      oficial: 'bg-blue-100 text-blue-700',
      supervisor: 'bg-purple-100 text-purple-700',
      gerente: 'bg-amber-100 text-amber-700',
      admin: 'bg-red-100 text-red-700'
    };
    return colors[position] || 'bg-slate-100 text-slate-700';
  };

  const getRuleTypeColor = (type) => {
    const colors = {
      priority: 'bg-blue-100 text-blue-700',
      preapproval: 'bg-green-100 text-green-700',
      assignment: 'bg-purple-100 text-purple-700',
      notification: 'bg-amber-100 text-amber-700',
      validation: 'bg-cyan-100 text-cyan-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Settings}
        title="Administración"
        subtitle="Configuración del sistema y reglas de negocio"
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white border p-1">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Personal (AppUsers)
          </TabsTrigger>
          <TabsTrigger value="linking" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Homologación
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Zap className="h-4 w-4" />
            Reglas de Negocio
          </TabsTrigger>
        </TabsList>

        {/* AppUsers Tab */}
        <TabsContent value="users">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Personal del Banco (AppUsers)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Rol / Cargo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Vinculación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{user.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit">
                            {user.role}
                          </Badge>
                          <span className="text-xs text-slate-500">{getPositionLabel(user.position)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{user.branch || '-'}</p>
                          <p className="text-xs text-slate-500">{user.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                         {user.user_id ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Vinculado</Badge>
                         ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200">Pendiente</Badge>
                         )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          user.status === 'active' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-slate-50 text-slate-600'
                        }>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linking Tab */}
        <TabsContent value="linking">
           <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Homologación de Identidades</CardTitle>
              <p className="text-sm text-slate-500">Vincular usuarios del sistema (Auth) con perfiles de negocio (AppUser)</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Perfil de Negocio (AppUser)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuario de Sistema (Auth)</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appUsers.map((appUser) => {
                    const linkedBaseUser = baseUsers.find(bu => bu.id === appUser.user_id);
                    return (
                      <TableRow key={appUser.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={appUser.avatar_url} />
                                <AvatarFallback>{appUser.full_name?.[0]}</AvatarFallback>
                             </Avatar>
                             <div>
                               <p className="font-medium">{appUser.full_name}</p>
                               <p className="text-xs text-slate-500">{appUser.email}</p>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {appUser.user_id ? (
                             <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Vinculado</Badge>
                          ) : (
                             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">No vinculado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {linkedBaseUser ? (
                            <div className="flex items-center gap-2">
                               <div className="h-2 w-2 rounded-full bg-green-500" />
                               <span className="text-sm">{linkedBaseUser.email}</span>
                               <span className="text-xs text-slate-400">({linkedBaseUser.role})</span>
                            </div>
                          ) : (
                            <Select onValueChange={(val) => linkUserMutation.mutate({ appUserId: appUser.id, baseUserId: val })}>
                              <SelectTrigger className="w-[250px] h-8">
                                <SelectValue placeholder="Seleccionar usuario auth..." />
                              </SelectTrigger>
                              <SelectContent>
                                {baseUsers
                                  .filter(bu => !appUsers.find(au => au.user_id === bu.id)) // Filter out already linked users
                                  .map(bu => (
                                    <SelectItem key={bu.id} value={bu.id}>
                                      {bu.email} ({bu.full_name})
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {appUser.user_id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => linkUserMutation.mutate({ appUserId: appUser.id, baseUserId: null })}
                            >
                              Desvincular
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
           </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Motor de Reglas de Negocio (Simulado)</CardTitle>
              <Button 
                className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
                onClick={() => { setSelectedRule(null); setShowRuleDialog(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Regla
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No hay reglas configuradas</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => { setSelectedRule(null); setShowRuleDialog(true); }}
                    >
                      Crear primera regla
                    </Button>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div 
                      key={rule.id}
                      className={`p-4 rounded-lg border ${
                        rule.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                            <Badge className={`${getRuleTypeColor(rule.rule_type)} border-0 text-xs capitalize`}>
                              {rule.rule_type}
                            </Badge>
                            {rule.active ? (
                              <Badge className="bg-green-100 text-green-700 border-0 text-xs gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Activa
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 border-0 text-xs gap-1">
                                <XCircle className="h-3 w-3" />
                                Inactiva
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{rule.description}</p>
                          {rule.condition && (
                            <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono text-slate-600">
                              {rule.condition}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.active}
                            onCheckedChange={() => toggleRule(rule)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedRule(rule); setShowRuleDialog(true); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regla' : 'Nueva Regla de Negocio'}
            </DialogTitle>
          </DialogHeader>
          
          <RuleForm 
            rule={selectedRule}
            onSuccess={() => {
              refetchRules();
              setShowRuleDialog(false);
            }}
            onCancel={() => setShowRuleDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RuleForm({ rule, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    rule_type: rule?.rule_type || 'priority',
    condition: rule?.condition || '',
    action: rule?.action || '',
    active: rule?.active ?? true,
    priority: rule?.priority || 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (rule) {
        await base44.entities.Rule.update(rule.id, formData);
      } else {
        await base44.entities.Rule.create(formData);
      }
      toast.success(rule ? 'Regla actualizada' : 'Regla creada');
      onSuccess();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Error al guardar regla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Nombre de la regla"
          required
        />
      </div>
      
      <div>
        <Label>Tipo de Regla</Label>
        <Select 
          value={formData.rule_type} 
          onValueChange={(v) => setFormData({...formData, rule_type: v})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priorización</SelectItem>
            <SelectItem value="preapproval">Pre-aprobación</SelectItem>
            <SelectItem value="assignment">Asignación</SelectItem>
            <SelectItem value="notification">Notificación</SelectItem>
            <SelectItem value="validation">Validación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Descripción</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descripción de la regla"
          rows={2}
        />
      </div>
      
      <div>
        <Label>Condición (expresión simulada)</Label>
        <Textarea
          value={formData.condition}
          onChange={(e) => setFormData({...formData, condition: e.target.value})}
          placeholder="ej: client.segment == 'preferente' AND client.risk_score >= 700"
          rows={2}
          className="font-mono text-sm"
        />
      </div>
      
      <div>
        <Label>Acción</Label>
        <Input
          value={formData.action}
          onChange={(e) => setFormData({...formData, action: e.target.value})}
          placeholder="ej: SET priority = HIGH"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({...formData, active: checked})}
        />
        <Label>Regla activa</Label>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
          disabled={loading}
        >
          {rule ? 'Guardar Cambios' : 'Crear Regla'}
        </Button>
      </DialogFooter>
    </form>
  );
}