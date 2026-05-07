import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { client_id, product_code, principal } = await req.json();

        if (!client_id) {
            return Response.json({ error: 'client_id is required' }, { status: 400 });
        }

        // Get client data
        const clients = await base44.entities.Client.filter({ id: client_id });
        const client = clients[0];
        
        if (!client) {
            return Response.json({ error: 'Client not found' }, { status: 404 });
        }

        const traceId = `LOAN-${Date.now().toString(36).toUpperCase()}`;
        
        // Evaluation criteria based on risk score and other factors
        const riskScore = client.risk_score || 0;
        const monthlyIncome = client.monthly_income || 0;
        const requestedAmount = principal || 0;

        // Calculate debt capacity (simplified)
        const maxDebtRatio = 0.35; // 35% of income
        const maxMonthlyPayment = monthlyIncome * maxDebtRatio;
        
        // Determine max amount based on score
        let maxAmount = 0;
        let approved = false;
        let message = '';
        let probability = 0;

        if (riskScore >= 800) {
            maxAmount = Math.min(monthlyIncome * 20, 100000);
            approved = true;
            probability = 95;
            message = 'Cliente Premium - Pre-aprobación automática con condiciones preferenciales';
        } else if (riskScore >= 700) {
            maxAmount = Math.min(monthlyIncome * 15, 50000);
            approved = true;
            probability = 85;
            message = 'Cliente califica para pre-aprobación con condiciones estándar';
        } else if (riskScore >= 600) {
            maxAmount = Math.min(monthlyIncome * 10, 25000);
            approved = requestedAmount <= maxAmount;
            probability = 60;
            message = approved 
                ? 'Cliente califica para evaluación rápida' 
                : 'Monto solicitado excede capacidad de pago';
        } else if (riskScore >= 500) {
            maxAmount = 0;
            approved = false;
            probability = 30;
            message = 'Cliente requiere evaluación manual con garantías adicionales';
        } else {
            maxAmount = 0;
            approved = false;
            probability = 10;
            message = 'Cliente no califica en este momento. Score de riesgo insuficiente';
        }

        // Calculate suggested interest rate based on risk
        let suggestedRate = 18.5;
        if (riskScore >= 800) suggestedRate = 12.0;
        else if (riskScore >= 700) suggestedRate = 15.0;
        else if (riskScore >= 600) suggestedRate = 18.5;
        else suggestedRate = 24.0;

        // Add product-specific adjustments
        if (product_code === 'hipotecario') {
            suggestedRate = Math.max(8.0, suggestedRate - 6);
            maxAmount = Math.min(maxAmount * 5, 500000);
        } else if (product_code === 'vehicular') {
            suggestedRate = Math.max(10.0, suggestedRate - 4);
            maxAmount = Math.min(maxAmount * 2, 80000);
        } else if (product_code === 'capital_trabajo') {
            maxAmount = maxAmount * 3;
        }

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'view',
            entity_type: 'Loan',
            entity_id: client_id,
            description: `Pre-evaluación de crédito ${product_code}: ${approved ? 'Pre-aprobado' : 'Requiere evaluación'}`,
            trace_id: traceId,
        });

        // Create event
        await base44.entities.MockEvent.create({
            event_type: 'loan',
            source: 'preapproval_engine',
            payload: JSON.stringify({
                action: 'preapproval',
                client_id,
                product_code,
                approved,
                risk_score: riskScore,
                max_amount: maxAmount,
            }),
            status: 'processed',
            trace_id: traceId,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            approved,
            probability,
            message,
            risk_score: riskScore,
            max_amount: maxAmount,
            suggested_rate: suggestedRate,
            max_monthly_payment: maxMonthlyPayment,
            client_segment: client.segment,
            evaluation_timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error('Error evaluating pre-approval:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});