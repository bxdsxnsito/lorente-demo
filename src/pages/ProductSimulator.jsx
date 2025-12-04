import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Calculator, PiggyBank, CreditCard, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

import LoanSimulator from '@/components/simulators/LoanSimulator';
import SavingsSimulator from '@/components/simulators/SavingsSimulator';
import CreditCardSimulator from '@/components/simulators/CreditCardSimulator';

export default function ProductSimulator() {
  const [activeTab, setActiveTab] = useState('loans');

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Calculator}
        title="Simulador de Productos"
        subtitle="Herramientas de proyección financiera para clientes"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-center">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto p-1 bg-slate-100/80 backdrop-blur">
            <TabsTrigger 
              value="loans" 
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-medium">Préstamos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="savings" 
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <PiggyBank className="h-5 w-5" />
              <span className="text-xs font-medium">Ahorro e Inversión</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cards" 
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs font-medium">Tarjetas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="border-0 shadow-sm bg-white min-h-[600px]">
          <TabsContent value="loans" className="m-0 p-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LoanSimulator />
          </TabsContent>
          
          <TabsContent value="savings" className="m-0 p-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SavingsSimulator />
          </TabsContent>
          
          <TabsContent value="cards" className="m-0 p-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CreditCardSimulator />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}