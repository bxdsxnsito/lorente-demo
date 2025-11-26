import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  RefreshCw,
  Database,
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Server,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import moment from 'moment';

export default function DeveloperControls() {
  const [generating, setGenerating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [transactionCount, setTransactionCount] = useState(5);
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.MockEvent.list('-created_date', 50),
  });

  const { data: audits = [], refetch: refetchAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: () => base44.entities.Audit.list('-created_date', 50),
  });

  const generateTransactions = async () => {
    if (!selectedAccount) {
      toast.error('Seleccione una cuenta');
      return;
    }
    
    setGenerating(true);
    
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      const transactions = [];
      let balance = account.balance || 10000;
      
      for (let i = 0; i < transactionCount; i++) {
        const isDebit = Math.random() > 0.5;
        const amount = Math.floor(Math.random() * 1000) + 100;
        
        balance = isDebit ? balance - amount : balance + amount;
        
        transactions.push({
          account_id: selectedAccount,
          client_id: account.client_id,
          type: isDebit ? 'withdrawal' : 'deposit',
          amount: amount,
          currency: account.currency || 'USD',
          reference: `TRX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          description: isDebit ? 'Retiro simulado' : 'Depósito simulado',
          balance_after: Math.max(0, balance),
          status: 'completed',
          channel: 'api',
        });
      }
      
      await base44.entities.Transaction.bulkCreate(transactions);
      
      // Update account balance
      await base44.entities.Account.update(selectedAccount, { balance: Math.max(0, balance) });
      
      // Create event
      await base44.entities.MockEvent.create({
        event_type: 'transaction',
        source: 'developer_controls',
        payload: JSON.stringify({ action: 'bulk_generate', count: transactionCount }),
        trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
      refetchEvents();
      toast.success(`${transactionCount} transacciones generadas`);
    } catch (error) {
      console.error('Error generating transactions:', error);
      toast.error('Error al generar transacciones');
    } finally {
      setGenerating(false);
    }
  };

  const resetAccount = async () => {
    if (!selectedAccount) {
      toast.error('Seleccione una cuenta');
      return;
    }
    
    try {
      await base44.entities.Account.update(selectedAccount, { 
        balance: 10000,
        available_balance: 10000 
      });
      
      // Create event
      await base44.entities.MockEvent.create({
        event_type: 'system',
        source: 'developer_controls',
        payload: JSON.stringify({ action: 'reset_account', account_id: selectedAccount }),
        trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      queryClient.invalidateQueries(['accounts']);
      refetchEvents();
      toast.success('Cuenta reseteada a $10,000');
    } catch (error) {
      console.error('Error resetting account:', error);
      toast.error('Error al resetear cuenta');
    }
  };

  const forceApproval = async () => {
    if (!selectedLoan) {
      toast.error('Seleccione un préstamo');
      return;
    }
    
    try {
      await base44.entities.Loan.update(selectedLoan, { 
        status: 'approved',
        probability: 100 
      });
      
      // Create event
      await base44.entities.MockEvent.create({
        event_type: 'loan',
        source: 'developer_controls',
        payload: JSON.stringify({ action: 'force_approval', loan_id: selectedLoan }),
        trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      // Create audit
      await base44.entities.Audit.create({
        action: 'approve',
        entity_type: 'Loan',
        entity_id: selectedLoan,
        description: 'Aprobación forzada desde controles de desarrollo',
        trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      
      queryClient.invalidateQueries(['loans']);
      refetchEvents();
      refetchAudits();
      toast.success('Préstamo aprobado');
    } catch (error) {
      console.error('Error approving loan:', error);
      toast.error('Error al aprobar préstamo');
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      transaction: 'bg-green-100 text-green-700',
      activity: 'bg-blue-100 text-blue-700',
      opportunity: 'bg-purple-100 text-purple-700',
      loan: 'bg-amber-100 text-amber-700',
      card: 'bg-pink-100 text-pink-700',
      notification: 'bg-cyan-100 text-cyan-700',
      system: 'bg-slate-100 text-slate-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getClientName = (clientId) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={FileText}
        title="Controles de Desarrollo"
        subtitle="Panel de control para manipular datos de demo"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Generator */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Generador de Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cuenta</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_number} - {getClientName(account.client_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Cantidad de Transacciones</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={transactionCount}
                onChange={(e) => setTransactionCount(parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={generateTransactions}
                className="flex-1 bg-[#0B63FF] hover:bg-[#0A4DB6]"
                disabled={generating}
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Transacciones
              </Button>
              <Button variant="outline" onClick={resetAccount}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loan Controls */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Control de Préstamos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Préstamo</Label>
              <Select value={selectedLoan} onValueChange={setSelectedLoan}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar préstamo" />
                </SelectTrigger>
                <SelectContent>
                  {loans.filter(l => l.status !== 'approved' && l.status !== 'disbursed').map(loan => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.product_code} - ${loan.principal?.toLocaleString()} ({loan.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={forceApproval}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!selectedLoan}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Forzar Aprobación
            </Button>
            
            <p className="text-xs text-slate-500">
              Esta acción simulará la aprobación del préstamo seleccionado sin pasar por el flujo normal de evaluación.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-white border p-1">
          <TabsTrigger value="events" className="gap-2">
            <Activity className="h-4 w-4" />
            Event Log (Kafka Simulado)
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Server className="h-4 w-4" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Últimos 50 Eventos</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchEvents()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Trace ID</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Activity className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No hay eventos registrados</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-slate-500">
                            {moment(event.created_date).format('DD/MM HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getEventTypeColor(event.event_type)} border-0 text-xs capitalize`}>
                              {event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{event.source}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {event.trace_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              event.status === 'processed' 
                                ? 'bg-green-50 text-green-700' 
                                : event.status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }>
                              {event.status || 'pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registro de Auditoría</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchAudits()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Trace ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Server className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No hay registros de auditoría</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      audits.map((audit) => (
                        <TableRow key={audit.id}>
                          <TableCell className="text-sm text-slate-500">
                            {moment(audit.created_date).format('DD/MM HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {audit.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{audit.entity_type}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {audit.description}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {audit.trace_id}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Nota sobre los Controles de Desarrollo</p>
              <p className="mt-1 text-blue-700">
                Este panel simula operaciones que en producción serían manejadas por sistemas externos 
                (Core Bancario, Kafka, Motor de Reglas). Use estos controles para demostrar el flujo 
                completo de la aplicación durante presentaciones de demo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}