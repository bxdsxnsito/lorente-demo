import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Play,
  Zap,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function RulesEvaluationDialog({ open, onOpenChange, activity }) {
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState([]);
  const [traceId, setTraceId] = useState('');

  const { data: rules = [] } = useQuery({
    queryKey: ['rules'],
    queryFn: () => base44.entities.Rule.filter({ active: true }),
  });

  const evaluateRules = async () => {
    setEvaluating(true);
    setResults([]);
    
    try {
      // Call backend function for real rule evaluation
      const response = await base44.functions.invoke('evaluateRules', {
        activity_id: activity?.id,
        client_id: activity?.client_id,
      });
      
      const data = response.data;
      
      if (data.success) {
        const formattedResults = data.results.map(r => ({
          rule: r.rule_name,
          applied: r.applied,
          message: r.message,
          type: r.rule_type,
        }));
        setResults(formattedResults);
        setTraceId(data.trace_id);
      } else {
        toast.error('Error al evaluar reglas');
      }
    } catch (error) {
      console.error('Error evaluating rules:', error);
      toast.error('Error al conectar con motor de reglas');
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    if (open && activity) {
      setResults([]);
    }
  }, [open, activity]);

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Evaluación de Reglas de Negocio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium">{activity.title || activity.activity_type}</p>
            <p className="text-sm text-slate-500">{activity.client_name}</p>
          </div>
          
          {results.length === 0 && !evaluating && (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">
                Ejecuta el motor de reglas para evaluar esta actividad
              </p>
              <Button 
                onClick={evaluateRules}
                className="bg-[#0B63FF] hover:bg-[#0A4DB6]"
              >
                <Play className="h-4 w-4 mr-2" />
                Evaluar Reglas
              </Button>
            </div>
          )}
          
          {evaluating && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-3" />
              <p className="text-slate-500">Evaluando reglas de negocio...</p>
              <p className="text-sm text-slate-400 mt-1">
                Conectando con motor de reglas (simulado)
              </p>
            </div>
          )}
          
          {results.length > 0 && (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.applied 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.applied ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{result.rule}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize ${
                              result.applied 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {result.applied ? 'Aplicada' : 'No aplica'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{result.message}</p>
                        <Badge variant="outline" className="mt-2 text-xs capitalize">
                          {result.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Motor de Reglas Backend</p>
                    <p className="text-blue-600 mt-0.5">
                      Trace: {traceId}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {results.length > 0 && (
            <Button onClick={evaluateRules} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Re-evaluar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}