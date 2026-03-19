import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  CreditCard,
  DollarSign,
  FileText,
  Target,
  ArrowLeft,
  Edit,
  MoreVertical,
  Plus,
  TrendingUp,
  TrendingDown,
  Building,
  Clock,
  CheckCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import RiskBadge from '@/components/common/RiskBadge';
import SegmentBadge from '@/components/common/SegmentBadge';
import StatusBadge from '@/components/common/StatusBadge';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import ActivityFormDialog from '@/components/agenda/ActivityFormDialog';
import moment from 'moment';

export default function Client360() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  // Use backend function to get consolidated client data
  const { data: clientSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['clientSummary', clientId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getClientSummary', { client_id: clientId });
      return response.data;
    },
    enabled: !!clientId,
  });

  // Extract data from summary
  const client = clientSummary?.client;
  const accounts = clientSummary?.accounts || [];
  const cards = clientSummary?.cards || [];
  const loans = clientSummary?.loans || [];
  const activities = clientSummary?.recent_activities || [];
  const opportunities = clientSummary?.opportunities || [];
  const summary = clientSummary?.summary || {};

  // Separate queries for transactions and documents (not in summary)
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', clientId],
    queryFn: () => base44.entities.Transaction.filter({ client_id: clientId }, '-created_date', 50),
    enabled: !!clientId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', clientId],
    queryFn: () => base44.entities.Document.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: currency 
    }).format(value || 0);
  };

  // Use pre-calculated values from backend when available
  const totalBalance = summary.total_balance || accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalCreditLimit = summary.total_credit_limit || cards.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalCreditUsed = (summary.total_credit_limit - summary.available_credit) || cards.reduce((sum, c) => sum + (c.used_amount || 0), 0);
  const totalLoans = summary.total_loans_outstanding || loans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);

  if (summaryLoading || !client) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-500">Cargando datos del cliente...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Clients')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Vista 360° del Cliente</h1>
          <p className="text-slate-500">Información consolidada (simulado)</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
        <Button className="bg-[#0B63FF] hover:bg-[#0A4DB6] gap-2">
          <Plus className="h-4 w-4" />
          Nueva Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Profile */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 border-4 border-blue-100">
                  <AvatarFallback className="bg-gradient-to-br from-[#0B63FF] to-[#0A4DB6] text-white text-2xl font-bold">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold text-slate-900">{client.name}</h2>
                <p className="text-slate-500">{client.document_type}: {client.document}</p>
                
                <div className="flex gap-2 mt-3">
                  <SegmentBadge segment={client.segment} />
                  <Badge variant="outline" className="capitalize">
                    {client.client_type}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <RiskBadge score={client.risk_score || 750} />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{client.phone || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{client.email || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{client.address || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{client.occupation || 'No registrado'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Saldo Total</span>
                </div>
                <span className="font-bold text-green-700">{formatCurrency(totalBalance)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Crédito Disponible</span>
                </div>
                <span className="font-bold text-blue-700">{formatCurrency(totalCreditLimit - totalCreditUsed)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">Préstamos Vigentes</span>
                </div>
                <span className="font-bold text-amber-700">{formatCurrency(totalLoans)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="accounts" className="space-y-4">
            <TabsList className="bg-white border p-1">
              <TabsTrigger value="accounts">Cuentas</TabsTrigger>
              <TabsTrigger value="transactions">Movimientos</TabsTrigger>
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="activities">Actividades</TabsTrigger>
              <TabsTrigger value="opportunities">Pipeline</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-4">
              {accounts.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm p-8 text-center">
                  <Wallet className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No hay cuentas registradas</p>
                </Card>
              ) : (
                accounts.map((account) => (
                  <Card key={account.id} className="bg-white border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{account.product_type}</Badge>
                            <StatusBadge status={account.status} size="sm" />
                          </div>
                          <p className="mt-2 font-mono text-sm text-slate-600">{account.account_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(account.balance, account.currency)}
                          </p>
                          <p className="text-sm text-slate-500">
                            Disponible: {formatCurrency(account.available_balance, account.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <DollarSign className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No hay movimientos</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {moment(tx.created_date).format('DD/MM/YYYY HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.type === 'deposit' || tx.type === 'transfer_in' ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">{tx.description || tx.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-500">
                            {tx.reference}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            tx.type === 'deposit' || tx.type === 'transfer_in' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'transfer_in' ? '+' : '-'}
                            {formatCurrency(tx.amount, tx.currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Tarjetas
              </h3>
              {cards.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm p-6 text-center">
                  <p className="text-slate-500">No hay tarjetas registradas</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {cards.map((card) => (
                    <Card key={card.id} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-slate-300 capitalize">{card.card_type} {card.brand}</p>
                            <p className="font-mono text-lg mt-1">{card.card_number_masked}</p>
                          </div>
                          <StatusBadge status={card.status} size="sm" />
                        </div>
                        <div className="mt-4 flex justify-between">
                          <div>
                            <p className="text-xs text-slate-400">Límite</p>
                            <p className="font-bold">{formatCurrency(card.credit_limit)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Usado</p>
                            <p className="font-bold">{formatCurrency(card.used_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Disponible</p>
                            <p className="font-bold text-green-400">
                              {formatCurrency(card.available_credit || (card.credit_limit - card.used_amount))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <h3 className="font-semibold text-slate-700 flex items-center gap-2 mt-6">
                <TrendingUp className="h-5 w-5" /> Préstamos
              </h3>
              {loans.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm p-6 text-center">
                  <p className="text-slate-500">No hay préstamos registrados</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {loans.map((loan) => (
                    <Card key={loan.id} className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="capitalize">{loan.product_code?.replace('_', ' ')}</Badge>
                            <StatusBadge status={loan.status} size="sm" className="ml-2" />
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                              {formatCurrency(loan.principal)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">{loan.term_months} meses</p>
                            <p className="font-medium">{loan.interest_rate}% TEA</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Cuota Mensual</p>
                            <p className="font-medium">{formatCurrency(loan.monthly_installment)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Saldo Pendiente</p>
                            <p className="font-medium">{formatCurrency(loan.outstanding_balance)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Próximo Pago</p>
                            <p className="font-medium">{loan.next_payment_date ? moment(loan.next_payment_date).format('DD/MM/YYYY') : '-'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities">
              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Oficial</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No hay actividades</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="text-sm">
                            {moment(activity.scheduled_at).format('DD/MM/YYYY HH:mm')}
                          </TableCell>
                          <TableCell className="capitalize">{activity.activity_type}</TableCell>
                          <TableCell>{activity.official_name || '-'}</TableCell>
                          <TableCell><StatusBadge status={activity.status} size="sm" /></TableCell>
                          <TableCell><StatusBadge status={activity.result} size="sm" /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities">
              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Negocio</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Probabilidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Target className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No hay oportunidades</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      opportunities.map((opp) => (
                        <TableRow key={opp.id}>
                          <TableCell className="font-medium">{opp.title}</TableCell>
                          <TableCell className="capitalize">{opp.product_type}</TableCell>
                          <TableCell>{formatCurrency(opp.amount)}</TableCell>
                          <TableCell><StatusBadge status={opp.stage} size="sm" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${opp.probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{opp.probability}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500">No hay documentos</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="p-4 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <FileText className="h-8 w-8 text-blue-600 mb-2" />
                          <p className="font-medium text-sm truncate">{doc.filename}</p>
                          <p className="text-xs text-slate-500 capitalize">{doc.document_type}</p>
                          <StatusBadge status={doc.status} size="sm" className="mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}