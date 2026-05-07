import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { activity_id, client_id } = await req.json();

        // Get active rules
        const rules = await base44.entities.Rule.filter({ active: true });
        
        // Get client data if provided
        let client = null;
        if (client_id) {
            const clients = await base44.entities.Client.filter({ id: client_id });
            client = clients[0];
        }

        // Evaluate each rule
        const results = [];
        
        for (const rule of rules) {
            let applied = false;
            let message = '';

            // Simple rule evaluation logic based on rule type
            switch (rule.rule_type) {
                case 'priority':
                    applied = client && (client.segment === 'preferente' || client.segment === 'premium');
                    message = applied 
                        ? 'Cliente pertenece a segmento prioritario. Se recomienda atención preferencial.'
                        : 'Cliente en segmento regular. Atención estándar.';
                    break;
                    
                case 'preapproval':
                    applied = client && (client.risk_score || 0) >= 700;
                    message = applied
                        ? `Cliente con score ${client?.risk_score || 0} califica para pre-aprobación automática.`
                        : `Score de riesgo ${client?.risk_score || 0} requiere evaluación manual.`;
                    break;
                    
                case 'assignment':
                    // Check if official has too many pending activities
                    const officialActivities = await base44.entities.Activity.filter({ 
                        official_id: user.id,
                        status: 'pending'
                    });
                    applied = officialActivities.length < 15;
                    message = applied
                        ? `Oficial tiene ${officialActivities.length} actividades pendientes. Puede recibir nuevas asignaciones.`
                        : `Oficial tiene ${officialActivities.length} actividades. Se recomienda redistribuir carga.`;
                    break;
                    
                case 'notification':
                    applied = true;
                    message = 'Se programará recordatorio 24 horas antes de la actividad.';
                    break;
                    
                case 'validation':
                    applied = client && client.status === 'active';
                    message = applied
                        ? 'Cliente activo con documentación verificada.'
                        : 'Cliente requiere actualización de documentación.';
                    break;
                    
                default:
                    applied = false;
                    message = 'Tipo de regla no reconocido.';
            }

            results.push({
                rule_id: rule.id,
                rule_name: rule.name,
                rule_type: rule.rule_type,
                applied,
                message,
                condition: rule.condition,
                action: rule.action,
            });
        }

        // Create audit log
        const traceId = `RULES-${Date.now().toString(36).toUpperCase()}`;
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'view',
            entity_type: 'Rule',
            entity_id: activity_id || 'batch',
            description: `Evaluación de ${rules.length} reglas. ${results.filter(r => r.applied).length} aplicadas.`,
            trace_id: traceId,
        });

        // Create event
        await base44.entities.MockEvent.create({
            event_type: 'system',
            source: 'rules_engine',
            payload: JSON.stringify({
                action: 'evaluate',
                activity_id,
                client_id,
                rules_evaluated: rules.length,
                rules_applied: results.filter(r => r.applied).length,
            }),
            status: 'processed',
            trace_id: traceId,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            rules_evaluated: rules.length,
            rules_applied: results.filter(r => r.applied).length,
            results,
        });
        
    } catch (error) {
        console.error('Error evaluating rules:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});