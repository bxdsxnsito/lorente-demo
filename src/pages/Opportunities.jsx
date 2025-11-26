import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  MoreVertical,
  ArrowRight,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/ui/page-header';
import StatusBadge from '@/components/common/StatusBadge';
import OpportunityFormDialog from '@/components/opportunities/OpportunityFormDialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'qualified', label: 'Calificado', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Propuesta', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negociación', color: 'bg-amber-500' },
  { id: 'closed_won', label: 'Ganada', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'Perdida', color: 'bg-red-500' },
];

export default function Opportunities() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading, refetch } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Opportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
    },
  });

  const filteredOpportunities = opportunities.filter(opp => 
    opp.title?.toLowerCase().includes(search.toLowerCase()) ||
    opp.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getOpportunitiesByStage = (stageId) => {
    return filteredOpportunities.filter(opp => opp.stage === stageId);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const getTotalByStage = (stageId) => {
    return getOpportunitiesByStage(stageId).reduce((sum, opp) => sum + (opp.amount || 0), 0);
  };

  const totalPipeline = opportunities.reduce((sum, opp) => {
    if (opp.stage !== 'closed_lost') {
      return sum + (opp.amount || 0);
    }
    return sum;
  }, 0);

  const wonOpportunities = opportunities.filter(o => o.stage === 'closed_won');
  const totalWon = wonOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
  const conversionRate = opportunities.length > 0 
    ? ((wonOpportunities.length / opportunities.length) * 100).toFixed(1) 
    : 0;

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const opportunityId = result.draggableId;
    const newStage = result.destination.droppableId;
    
    await updateMutation.mutateAsync({
      id: opportunityId,
      data: { stage: newStage }
    });
    
    // Create mock event
    await base44.entities.MockEvent.create({
      event_type: 'opportunity',
      source: 'pipeline',
      payload: JSON.stringify({ 
        action: 'stage_change', 
        opportunity_id: opportunityId,
        new_stage: newStage 
      }),
      trace_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
  };

  const handleEdit = (opp) => {
    setSelectedOpportunity(opp);
    setShowForm(true);
  };

  const handleDelete = async (opp) => {
    if (confirm('¿Está seguro de eliminar esta oportunidad?')) {
      await deleteMutation.mutateAsync(opp.id);
    }
  };

  const OpportunityCard = ({ opportunity, index }) => (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white rounded-lg border shadow-sm p-4 mb-3 transition-shadow ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div 
              {...provided.dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 ml-2">
              <h4 className="font-medium text-slate-900 text-sm">{opportunity.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{opportunity.client_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {opportunity.product_type}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-slate-900">
                  {formatCurrency(opportunity.amount)}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-12 bg-slate-100 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${opportunity.probability}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500">{opportunity.probability}%</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(opportunity)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(opportunity)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Target}
        title="Pipeline de Oportunidades"
        subtitle="Gestión de oportunidades comerciales"
      >
        <Button 
          className="bg-[#0B63FF] hover:bg-[#0A4DB6] gap-2"
          onClick={() => { setSelectedOpportunity(null); setShowForm(true); }}
        >
          <Plus className="h-4 w-4" />
          Nueva Oportunidad
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pipeline</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPipeline)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Oportunidades</p>
              <p className="text-2xl font-bold text-slate-900">{opportunities.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Ganadas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalWon)}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Conversión</p>
              <p className="text-2xl font-bold text-slate-900">{conversionRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <ArrowRight className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar oportunidades..."
          className="pl-10 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage.id} className="min-w-[250px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${stage.color}`}></div>
                  <span className="font-medium text-slate-700">{stage.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {getOpportunitiesByStage(stage.id).length}
                  </Badge>
                </div>
              </div>
              <div className="text-sm font-medium text-slate-500 mb-3">
                {formatCurrency(getTotalByStage(stage.id))}
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-slate-50'
                    }`}
                  >
                    {getOpportunitiesByStage(stage.id).map((opp, index) => (
                      <OpportunityCard 
                        key={opp.id} 
                        opportunity={opp} 
                        index={index} 
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <OpportunityFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        opportunity={selectedOpportunity}
        clients={clients}
        onSuccess={refetch}
      />
    </div>
  );
}