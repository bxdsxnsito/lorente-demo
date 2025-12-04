import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Target,
  Zap,
  Users
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AIAnalysis() {
  // Mock data for AI generated opportunities
  const aiOpportunities = [
    {
      id: 1,
      client: "Juan Pérez",
      product: "Fondo Mutuo Conservador",
      confidence: 92,
      reason: "Exceso de liquidez en cuenta de ahorros (> $50k) por 3 meses.",
      potential_value: 50000,
      status: "new"
    },
    {
      id: 2,
      client: "Empresa Constructora SA",
      product: "Leasing Maquinaria",
      confidence: 88,
      reason: "Patrón de gastos indica alquiler frecuente de maquinaria pesada.",
      potential_value: 120000,
      status: "new"
    },
    {
      id: 3,
      client: "Maria González",
      product: "Tarjeta Black",
      confidence: 85,
      reason: "Aumento de viajes internacionales y gastos en moneda extranjera.",
      potential_value: 5000,
      status: "pending"
    },
    {
      id: 4,
      client: "Tecnología e Innovación EIRL",
      product: "Factoring",
      confidence: 78,
      reason: "Ciclo de cobro extendido (60+ días) detectado en últimos 2 meses.",
      potential_value: 25000,
      status: "new"
    },
    {
      id: 5,
      client: "Carlos Ruiz",
      product: "Seguro Vehicular",
      confidence: 95,
      reason: "Compra reciente de vehículo detectada en transacciones.",
      potential_value: 800,
      status: "new"
    }
  ];

  const churnRisks = [
    {
      id: 1,
      client: "Distribuidora Norte",
      risk_score: 85,
      reason: "Disminución del 40% en flujo de caja vs mes anterior.",
      trend: "down"
    },
    {
      id: 2,
      client: "Ana Lopez",
      risk_score: 72,
      reason: "Cancelación de 2 productos secundarios en la última semana.",
      trend: "stable"
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title="Análisis IA"
        subtitle="Insights y Oportunidades detectadas por Inteligencia Artificial"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 font-medium mb-1">Potencial Detectado</p>
                <h3 className="text-3xl font-bold">$200,800</h3>
                <p className="text-xs text-indigo-200 mt-2 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  5 oportunidades de alto valor
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium mb-1">Efectividad de Modelos</p>
                <h3 className="text-3xl font-bold text-slate-900">87%</h3>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.4% vs mes anterior
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium mb-1">Alertas de Fuga</p>
                <h3 className="text-3xl font-bold text-slate-900">12</h3>
                <p className="text-xs text-red-600 mt-2 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  2 de prioridad alta
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Opportunities Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Oportunidades Sugeridas (Next Best Action)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Producto Sugerido</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aiOpportunities.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="font-medium">{opp.client}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {opp.product}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{opp.confidence}%</span>
                          <Progress value={opp.confidence} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs">
                        {opp.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-[#0B63FF] hover:bg-[#0A4DB6]">
                          Contactar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Side Column - Risk & Insights */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Riesgo de Fuga (Churn)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {churnRisks.map((risk) => (
                <div key={risk.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-900">{risk.client}</span>
                    <Badge className="bg-red-200 text-red-800 hover:bg-red-200 border-0">
                      Riesgo: {risk.risk_score}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{risk.reason}</p>
                  <Button variant="outline" size="sm" className="w-full border-red-200 text-red-700 hover:bg-red-100">
                    Ver Detalles
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-slate-200 border-0">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Insight del Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                El análisis sectorial indica un aumento en la demanda de créditos de capital de trabajo en el sector construcción para el próximo trimestre. Se recomienda priorizar clientes de este segmento.
              </p>
              <Button variant="secondary" size="sm" className="w-full mt-4">
                Ver Segmento Construcción
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}