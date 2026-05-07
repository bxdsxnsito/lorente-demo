import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { client_id } = await req.json();

        if (!client_id) {
            return Response.json({ 
                error: 'client_id is required' 
            }, { status: 400 });
        }

        // Fetch all client data in parallel
        const [
            clients,
            accounts,
            transactions,
            cards,
            loans,
            activities,
            opportunities,
            documents
        ] = await Promise.all([
            base44.entities.Client.filter({ id: client_id }),
            base44.entities.Account.filter({ client_id }),
            base44.entities.Transaction.filter({ client_id }, '-created_date', 50),
            base44.entities.Card.filter({ client_id }),
            base44.entities.Loan.filter({ client_id }),
            base44.entities.Activity.filter({ client_id }, '-scheduled_at', 20),
            base44.entities.Opportunity.filter({ client_id }),
            base44.entities.Document.filter({ client_id }),
        ]);

        const client = clients[0];
        
        if (!client) {
            return Response.json({ error: 'Client not found' }, { status: 404 });
        }

        // Calculate summary metrics
        const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
        const totalCreditLimit = cards.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
        const totalCreditUsed = cards.reduce((sum, c) => sum + (c.used_amount || 0), 0);
        const totalLoans = loans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);
        
        const completedActivities = activities.filter(a => a.status === 'completed').length;
        const pendingActivities = activities.filter(a => a.status === 'pending').length;
        
        const wonOpportunities = opportunities.filter(o => o.stage === 'closed_won');
        const activeOpportunities = opportunities.filter(o => !['closed_won', 'closed_lost'].includes(o.stage));

        // Calculate transaction metrics
        const deposits = transactions.filter(t => t.type === 'deposit' || t.type === 'transfer_in');
        const withdrawals = transactions.filter(t => t.type === 'withdrawal' || t.type === 'transfer_out');
        const totalDeposits = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);

        const traceId = `CS-${Date.now().toString(36).toUpperCase()}`;

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'view',
            entity_type: 'Client',
            entity_id: client_id,
            description: `Vista 360° del cliente: ${client.name}`,
            trace_id: traceId,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            client: {
                id: client.id,
                name: client.name,
                document: client.document,
                document_type: client.document_type,
                segment: client.segment,
                client_type: client.client_type,
                risk_score: client.risk_score,
                status: client.status,
                email: client.email,
                phone: client.phone,
                address: client.address,
                occupation: client.occupation,
                monthly_income: client.monthly_income,
            },
            summary: {
                total_balance: totalBalance,
                total_credit_limit: totalCreditLimit,
                available_credit: totalCreditLimit - totalCreditUsed,
                total_loans_outstanding: totalLoans,
                accounts_count: accounts.length,
                cards_count: cards.length,
                active_cards: cards.filter(c => c.status === 'active').length,
                loans_count: loans.length,
                active_loans: loans.filter(l => ['disbursed', 'approved'].includes(l.status)).length,
            },
            activity_summary: {
                total_activities: activities.length,
                completed: completedActivities,
                pending: pendingActivities,
                completion_rate: activities.length > 0 
                    ? ((completedActivities / activities.length) * 100).toFixed(1)
                    : 0,
            },
            opportunity_summary: {
                total_opportunities: opportunities.length,
                active: activeOpportunities.length,
                won: wonOpportunities.length,
                pipeline_value: activeOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
                won_value: wonOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
            },
            transaction_summary: {
                total_transactions: transactions.length,
                total_deposits: totalDeposits,
                total_withdrawals: totalWithdrawals,
                net_flow: totalDeposits - totalWithdrawals,
            },
            documents_count: documents.length,
            accounts,
            cards,
            loans,
            recent_activities: activities.slice(0, 10),
            opportunities,
        });
        
    } catch (error) {
        console.error('Error getting client summary:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});