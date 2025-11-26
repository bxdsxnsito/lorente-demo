import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  CreditCard,
  Plus,
  Search,
  Lock,
  Unlock,
  MoreVertical,
  Eye,
  AlertCircle,
  DollarSign,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/page-header';
import StatusBadge from '@/components/common/StatusBadge';
import { toast } from 'sonner';

export default function Cards() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [blockDialog, setBlockDialog] = useState({ open: false, card: null });
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['cards'],
    queryFn: () => base44.entities.Card.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Card.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cards']);
    },
  });

  const filteredCards = cards.filter(card => {
    const client = clients.find(c => c.id === card.client_id);
    const matchesSearch = 
      client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      card.card_number_masked?.includes(search);
    
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    const matchesType = typeFilter === 'all' || card.card_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente no encontrado';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const handleBlockCard = async () => {
    if (!blockDialog.card) return;
    
    const newStatus = blockDialog.card.status === 'blocked' ? 'active' : 'blocked';
    
    await updateMutation.mutateAsync({
      id: blockDialog.card.id,
      data: { status: newStatus }
    });
    
    // Create audit log
    await base44.entities.Audit.create({
      action: newStatus === 'blocked' ? 'update' : 'update',
      entity_type: 'Card',
      entity_id: blockDialog.card.id,
      description: `Tarjeta ${newStatus === 'blocked' ? 'bloqueada' : 'desbloqueada'}: ${blockDialog.card.card_number_masked}`,
      trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
    
    // Create mock event
    await base44.entities.MockEvent.create({
      event_type: 'card',
      source: 'card_management',
      payload: JSON.stringify({ 
        action: newStatus === 'blocked' ? 'block' : 'unblock',
        card_id: blockDialog.card.id 
      }),
      trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
    
    toast.success(newStatus === 'blocked' ? 'Tarjeta bloqueada' : 'Tarjeta desbloqueada');
    setBlockDialog({ open: false, card: null });
  };

  // Stats
  const totalLimit = cards.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalUsed = cards.reduce((sum, c) => sum + (c.used_amount || 0), 0);
  const activeCards = cards.filter(c => c.status === 'active').length;
  const blockedCards = cards.filter(c => c.status === 'blocked').length;

  const getCardGradient = (brand) => {
    const gradients = {
      visa: 'from-blue-600 to-blue-800',
      mastercard: 'from-orange-500 to-red-600',
      amex: 'from-slate-700 to-slate-900',
    };
    return gradients[brand] || 'from-slate-600 to-slate-800';
  };

  const CardComponent = ({ card }) => {
    const client = clients.find(c => c.id === card.client_id);
    const usagePercent = card.credit_limit > 0 
      ? ((card.used_amount / card.credit_limit) * 100).toFixed(0) 
      : 0;

    return (
      <div className="relative group">
        <div className={`bg-gradient-to-br ${getCardGradient(card.brand)} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
          {card.status === 'blocked' && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <div className="bg-red-500 px-4 py-2 rounded-lg flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="font-medium">BLOQUEADA</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm opacity-75 capitalize">{card.card_type}</p>
              <p className="font-bold text-lg capitalize">{card.brand}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl(`Client360?id=${card.client_id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Cliente
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setBlockDialog({ open: true, card })}
                  className={card.status === 'blocked' ? 'text-green-600' : 'text-red-600'}
                >
                  {card.status === 'blocked' ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Desbloquear
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Bloquear
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <p className="font-mono text-xl tracking-wider mb-6">{card.card_number_masked}</p>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-75">TITULAR</p>
              <p className="font-medium truncate max-w-[150px]">{client?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">VENCE</p>
              <p className="font-medium">{card.expiry_date || '12/26'}</p>
            </div>
          </div>
        </div>
        
        {/* Card Details */}
        <Card className="mt-4 bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Límite de Crédito</span>
                <span className="font-semibold">{formatCurrency(card.credit_limit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Utilizado</span>
                <span className="font-semibold text-red-600">{formatCurrency(card.used_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Disponible</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency((card.credit_limit || 0) - (card.used_amount || 0))}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Uso del Límite</span>
                  <span className="font-medium">{usagePercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      usagePercent > 80 ? 'bg-red-500' : 
                      usagePercent > 50 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={CreditCard}
        title="Tarjetas"
        subtitle="Gestión de tarjetas de débito y crédito"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Límite Total</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalLimit)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Utilizado</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalUsed)}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <Percent className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tarjetas Activas</p>
              <p className="text-2xl font-bold text-green-600">{activeCards}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Bloqueadas</p>
              <p className="text-2xl font-bold text-amber-600">{blockedCards}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente o número..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="prepaid">Prepago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-slate-200 rounded-2xl"></div>
              <div className="mt-4 h-32 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredCards.length === 0 ? (
        <Card className="p-12 bg-white border-0 shadow-sm text-center">
          <CreditCard className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No se encontraron tarjetas</h3>
          <p className="text-slate-500 mt-1">No hay tarjetas que coincidan con los filtros</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map(card => (
            <CardComponent key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Block/Unblock Dialog */}
      <AlertDialog open={blockDialog.open} onOpenChange={(open) => setBlockDialog({ ...blockDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {blockDialog.card?.status === 'blocked' ? (
                <Unlock className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-red-600" />
              )}
              {blockDialog.card?.status === 'blocked' ? 'Desbloquear Tarjeta' : 'Bloquear Tarjeta'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockDialog.card?.status === 'blocked' 
                ? '¿Está seguro de desbloquear esta tarjeta? El cliente podrá usarla nuevamente.'
                : '¿Está seguro de bloquear esta tarjeta? El cliente no podrá realizar transacciones hasta que se desbloquee.'}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="font-mono">{blockDialog.card?.card_number_masked}</p>
                <p className="text-sm mt-1">Cliente: {getClientName(blockDialog.card?.client_id)}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockCard}
              className={blockDialog.card?.status === 'blocked' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {blockDialog.card?.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}