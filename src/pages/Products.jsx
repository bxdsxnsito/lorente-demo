import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Briefcase,
  CreditCard,
  TrendingUp,
  Wallet,
  Shield,
  PiggyBank,
  ArrowRight,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const PRODUCTS = [
  {
    id: 'accounts',
    name: 'Cuentas',
    icon: Wallet,
    color: 'from-blue-500 to-blue-600',
    description: 'Cuentas de ahorro, corriente y más',
    features: ['Sin comisión de mantenimiento', 'Transferencias ilimitadas', 'Banca móvil gratis'],
    types: [
      { name: 'Ahorro', rate: '2.5% TEA' },
      { name: 'Corriente', rate: 'Sin interés' },
      { name: 'Plazo Fijo', rate: '5.5% TEA' },
    ]
  },
  {
    id: 'cards',
    name: 'Tarjetas',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    description: 'Tarjetas de crédito y débito',
    features: ['Cashback hasta 5%', 'Millas de viaje', 'Seguro de compras'],
    types: [
      { name: 'Clásica', rate: '35% TEA' },
      { name: 'Gold', rate: '30% TEA' },
      { name: 'Platinum', rate: '25% TEA' },
    ]
  },
  {
    id: 'loans',
    name: 'Créditos',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    description: 'Préstamos personales, hipotecarios y más',
    features: ['Aprobación en 24 horas', 'Tasa preferencial', 'Sin penalidad por prepago'],
    types: [
      { name: 'Personal', rate: 'desde 15% TEA' },
      { name: 'Hipotecario', rate: 'desde 8% TEA' },
      { name: 'Vehicular', rate: 'desde 12% TEA' },
    ]
  },
  {
    id: 'insurance',
    name: 'Seguros',
    icon: Shield,
    color: 'from-amber-500 to-amber-600',
    description: 'Protección para ti y tu familia',
    features: ['Cobertura amplia', 'Asistencia 24/7', 'Proceso de reclamo sencillo'],
    types: [
      { name: 'Vida', rate: 'desde $10/mes' },
      { name: 'Hogar', rate: 'desde $15/mes' },
      { name: 'Vehículo', rate: 'desde $25/mes' },
    ]
  },
  {
    id: 'investments',
    name: 'Inversiones',
    icon: PiggyBank,
    color: 'from-cyan-500 to-cyan-600',
    description: 'Fondos mutuos y depósitos a plazo',
    features: ['Asesoría personalizada', 'Diversificación de portafolio', 'Rentabilidad competitiva'],
    types: [
      { name: 'Conservador', rate: '4-6% anual' },
      { name: 'Moderado', rate: '6-10% anual' },
      { name: 'Agresivo', rate: '10-15% anual' },
    ]
  },
];

export default function Products() {
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => base44.entities.Card.list(),
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list(),
  });

  const getProductStats = (productId) => {
    switch (productId) {
      case 'accounts':
        return { count: accounts.length, label: 'cuentas activas' };
      case 'cards':
        return { count: cards.length, label: 'tarjetas emitidas' };
      case 'loans':
        return { count: loans.length, label: 'créditos vigentes' };
      default:
        return { count: 0, label: 'productos' };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Briefcase}
        title="Productos Bancarios"
        subtitle="Catálogo de productos y servicios"
      />

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => {
          const Icon = product.icon;
          const stats = getProductStats(product.id);
          
          return (
            <Card key={product.id} className="bg-white border-0 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
              <div className={`h-2 bg-gradient-to-r ${product.color}`}></div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${product.color} bg-opacity-10`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {stats.count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {stats.count} {stats.label}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{product.name}</CardTitle>
                <p className="text-sm text-slate-500">{product.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      <span className="text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  {product.types.map((type, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">{type.name}</span>
                      <span className="font-medium text-slate-900">{type.rate}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 group-hover:bg-slate-50"
                  asChild
                >
                  <Link to={createPageUrl(product.id === 'accounts' ? 'Clients' : 
                    product.id === 'cards' ? 'Cards' : 
                    product.id === 'loans' ? 'Loans' : 'Dashboard')}>
                    Ver Más
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">Resumen de Productos (simulado)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Cuentas</span>
              </div>
              <p className="text-2xl font-bold">{accounts.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Tarjetas</span>
              </div>
              <p className="text-2xl font-bold">{cards.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Créditos</span>
              </div>
              <p className="text-2xl font-bold">{loans.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Volumen Total</span>
              </div>
              <p className="text-2xl font-bold">
                ${((accounts.reduce((s, a) => s + (a.balance || 0), 0) + 
                    loans.reduce((s, l) => s + (l.principal || 0), 0)) / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}