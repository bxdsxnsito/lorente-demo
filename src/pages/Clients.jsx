import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Building,
  User,
  Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import RiskBadge from '@/components/common/RiskBadge';
import SegmentBadge from '@/components/common/SegmentBadge';
import StatusBadge from '@/components/common/StatusBadge';
import ClientFormDialog from '@/components/clients/ClientFormDialog';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.document?.includes(search) ||
      client.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSegment = segmentFilter === 'all' || client.segment === segmentFilter;
    const matchesType = typeFilter === 'all' || client.client_type === typeFilter;
    
    return matchesSearch && matchesSegment && matchesType;
  });

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      await base44.entities.Client.delete(client.id);
      refetch();
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const handleExport = () => {
    const segmentLabels = {
      corp_agricola: 'Corp. Agrícola', corp_com_ind_serv: 'Corp. Com/Ind/Serv',
      corp_ganadero: 'Corp. Ganadero', inv_ifis: 'IFIs',
      inv_institucional: 'Inv. Institucional', inv_personal: 'Inv. Personal',
      personas_consumo: 'Personas Consumo', pyme_agricola: 'Pyme Agrícola',
      pyme_com_ind_serv: 'Pyme Com/Ind/Serv', pyme_ganadera: 'Pyme Ganadera',
      sin_productos: 'Sin Productos',
    };
    const typeLabels = {
      com_mayor: 'Com. Mayor', com_mayor_vin: 'Com. Mayor Vin.', com_menor: 'Com. Menor',
      gd_com: 'GD Com.', microcredito: 'Microcrédito',
      personal_consumo: 'Personal Consumo', personal_vivienda: 'Personal Vivienda',
    };
    const rows = filteredClients.map(c => ({
      'Nombre': c.name || '',
      'Documento': c.document || '',
      'Tipo Documento': c.document_type || '',
      'Tipo Cliente': typeLabels[c.client_type] || c.client_type || '',
      'Segmento': segmentLabels[c.segment] || c.segment || '',
      'Score Riesgo': c.risk_score ?? '',
      'Email': c.email || '',
      'Teléfono': c.phone || '',
      'Dirección': c.address || '',
      'Ocupación': c.occupation || '',
      'Ingreso Mensual': c.monthly_income ?? '',
      'Estado': c.status || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Users}
        title="Clientes"
        subtitle="Gestión de cartera de clientes"
      >
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        <Button 
          className="bg-[#0B63FF] hover:bg-[#0A4DB6] gap-2"
          onClick={() => { setSelectedClient(null); setShowForm(true); }}
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, documento o email..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los segmentos</SelectItem>
                <SelectItem value="corp_agricola">Corp. Agrícola</SelectItem>
                <SelectItem value="corp_com_ind_serv">Corp. Com/Ind/Serv</SelectItem>
                <SelectItem value="corp_ganadero">Corp. Ganadero</SelectItem>
                <SelectItem value="inv_ifis">IFIs</SelectItem>
                <SelectItem value="inv_institucional">Inv. Institucional</SelectItem>
                <SelectItem value="inv_personal">Inv. Personal</SelectItem>
                <SelectItem value="personas_consumo">Personas Consumo</SelectItem>
                <SelectItem value="pyme_agricola">Pyme Agrícola</SelectItem>
                <SelectItem value="pyme_com_ind_serv">Pyme Com/Ind/Serv</SelectItem>
                <SelectItem value="pyme_ganadera">Pyme Ganadera</SelectItem>
                <SelectItem value="sin_productos">Sin Productos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="com_mayor">Com. Mayor</SelectItem>
                <SelectItem value="com_mayor_vin">Com. Mayor Vin.</SelectItem>
                <SelectItem value="com_menor">Com. Menor</SelectItem>
                <SelectItem value="gd_com">GD Com.</SelectItem>
                <SelectItem value="microcredito">Microcrédito</SelectItem>
                <SelectItem value="personal_consumo">Personal Consumo</SelectItem>
                <SelectItem value="personal_vivienda">Personal Vivienda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
              <TableHead className="font-semibold text-slate-700">Documento</TableHead>
              <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
              <TableHead className="font-semibold text-slate-700">Segmento</TableHead>
              <TableHead className="font-semibold text-slate-700">Riesgo</TableHead>
              <TableHead className="font-semibold text-slate-700">Contacto</TableHead>
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
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No se encontraron clientes</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Link 
                      to={createPageUrl(`Client360?id=${client.id}`)}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="h-10 w-10 border-2 border-slate-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {client.name}
                        </p>
                        <p className="text-sm text-slate-500">{client.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">{client.document}</p>
                      <p className="text-slate-500">{client.document_type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {client.client_type === 'pyme' || client.client_type === 'corporativo' ? (
                        <Building className="h-4 w-4 text-slate-400" />
                      ) : (
                        <User className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-sm capitalize">{client.client_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SegmentBadge segment={client.segment} size="sm" />
                  </TableCell>
                  <TableCell>
                    <RiskBadge score={client.risk_score || 750} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {client.phone && (
                        <a href={`tel:${client.phone}`} className="text-slate-400 hover:text-blue-600 transition-colors">
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="text-slate-400 hover:text-blue-600 transition-colors">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status || 'active'} size="sm" />
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
                          <Link to={createPageUrl(`Client360?id=${client.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
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

      <ClientFormDialog 
        open={showForm} 
        onOpenChange={setShowForm}
        client={selectedClient}
        onSuccess={refetch}
      />
    </div>
  );
}