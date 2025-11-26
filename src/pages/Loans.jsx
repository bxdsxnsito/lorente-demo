import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  TrendingUp,
  Plus,
  Search,
  Calculator,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  FileText,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/ui/page-header';
import StatusBadge from '@/components/common/StatusBadge';
import LoanRequestDialog from '@/components/loans/LoanRequestDialog';
import LoanSimulatorDialog from '@/components/loans/LoanSimulatorDialog';
import moment from 'moment';

export default function Loans() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRequest, setShowRequest] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading, refetch } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const filteredLoans = loans.filter(loan => {
    const client = clients.find(c => c.id === loan.client_id);
    const matchesSearch = 
      client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      loan.product_code?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente no encontrado';
  };

  // Stats
  const totalDisbursed = loans
    .filter(l => l.status === 'disbursed')
    .reduce((sum, l) => sum + (l.principal || 0), 0);
  
  const totalPending = loans
    .filter(l => l.status === 'in_review' || l.status === 'preapproved')
    .reduce((sum, l) => sum + (l.principal || 0), 0);
  
  const preapprovedCount = loans.filter(l => l.status === 'preapproved').length;
  const inReviewCount = loans.filter(l => l.status === 'in_review').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={TrendingUp}
        title="Créditos"
        subtitle="Gestión de préstamos y solicitudes"
      >
        <Button 
          variant="outline"
          className="gap-2"
          onClick={() => setShowSimulator(true)}
        >
          <Calculator className="h-4 w-4" />
          Simulador
        </Button>
        <Button 
          className="bg-[#0B63FF] hover:bg-[#0A4DB6] gap-2"
          onClick={() => setShowRequest(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Desembolsado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDisbursed)}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">En Trámite</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pre-aprobados</p>
              <p className="text-2xl font-bold text-emerald-600">{preapprovedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">En Revisión</p>
              <p className="text-2xl font-bold text-blue-600">{inReviewCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <AlertCircle className="h-5 w-5 text-blue-600" />
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
              placeholder="Buscar por cliente o producto..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="preapproved">Pre-aprobado</SelectItem>
              <SelectItem value="in_review">En Revisión</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="disbursed">Desembolsado</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Loans Table */}
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
              <TableHead className="font-semibold text-slate-700">Producto</TableHead>
              <TableHead className="font-semibold text-slate-700">Monto</TableHead>
              <TableHead className="font-semibold text-slate-700">Plazo</TableHead>
              <TableHead className="font-semibold text-slate-700">Tasa</TableHead>
              <TableHead className="font-semibold text-slate-700">Cuota</TableHead>
              <TableHead className="font-semibold text-slate-700">Estado</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 bg-slate-200 rounded-full mb-2"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No se encontraron créditos</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLoans.map((loan) => (
                <TableRow key={loan.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Link 
                      to={createPageUrl(`Client360?id=${loan.client_id}`)}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {getClientName(loan.client_id)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {loan.product_code?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(loan.principal)}
                  </TableCell>
                  <TableCell>
                    {loan.term_months} meses
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3 text-slate-400" />
                      {loan.interest_rate}% TEA
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(loan.monthly_installment)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={loan.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl(`Client360?id=${loan.client_id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Cliente
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Contrato
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <LoanRequestDialog
        open={showRequest}
        onOpenChange={setShowRequest}
        clients={clients}
        onSuccess={refetch}
      />

      <LoanSimulatorDialog
        open={showSimulator}
        onOpenChange={setShowSimulator}
      />
    </div>
  );
}