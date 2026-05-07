import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { report_type, filters } = await req.json();

        if (!report_type) {
            return Response.json({ 
                error: 'report_type is required' 
            }, { status: 400 });
        }

        const traceId = `RPT-${Date.now().toString(36).toUpperCase()}`;
        let reportData = {};

        switch (report_type) {
            case 'dashboard_summary': {
                // Get all relevant data
                const [clients, activities, opportunities, loans, transactions] = await Promise.all([
                    base44.entities.Client.list(),
                    base44.entities.Activity.list(),
                    base44.entities.Opportunity.list(),
                    base44.entities.Loan.list(),
                    base44.entities.Transaction.list('-created_date', 100),
                ]);

                const completedActivities = activities.filter(a => a.status === 'completed');
                const pendingActivities = activities.filter(a => a.status === 'pending');
                const wonOpportunities = opportunities.filter(o => o.stage === 'closed_won');
                const activeLoan = loans.filter(l => l.status === 'disbursed');
                
                const totalSales = transactions
                    .filter(t => t.type === 'deposit' || t.type === 'transfer_in')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const pipelineValue = opportunities
                    .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
                    .reduce((sum, o) => sum + (o.amount || 0), 0);

                reportData = {
                    summary: {
                        total_clients: clients.length,
                        active_clients: clients.filter(c => c.status === 'active').length,
                        total_activities: activities.length,
                        completed_activities: completedActivities.length,
                        pending_activities: pendingActivities.length,
                        completion_rate: activities.length > 0 
                            ? ((completedActivities.length / activities.length) * 100).toFixed(1)
                            : 0,
                    },
                    sales: {
                        total_sales: totalSales,
                        transaction_count: transactions.length,
                        average_transaction: transactions.length > 0 
                            ? (totalSales / transactions.length).toFixed(2)
                            : 0,
                    },
                    pipeline: {
                        total_opportunities: opportunities.length,
                        pipeline_value: pipelineValue,
                        won_opportunities: wonOpportunities.length,
                        won_value: wonOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
                        conversion_rate: opportunities.length > 0
                            ? ((wonOpportunities.length / opportunities.length) * 100).toFixed(1)
                            : 0,
                    },
                    loans: {
                        total_loans: loans.length,
                        active_loans: activeLoan.length,
                        total_disbursed: activeLoan.reduce((sum, l) => sum + (l.principal || 0), 0),
                        total_outstanding: activeLoan.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0),
                    },
                    segments: {
                        normal: clients.filter(c => c.segment === 'normal').length,
                        preferente: clients.filter(c => c.segment === 'preferente').length,
                        premium: clients.filter(c => c.segment === 'premium').length,
                        pyme: clients.filter(c => c.segment === 'pyme').length,
                    },
                };
                break;
            }

            case 'team_performance': {
                const [users, activities, opportunities] = await Promise.all([
                    base44.entities.User.list(),
                    base44.entities.Activity.list(),
                    base44.entities.Opportunity.list(),
                ]);

                const officials = users.filter(u => u.position === 'oficial');
                
                reportData = {
                    team_stats: officials.map(official => {
                        const officialActivities = activities.filter(a => a.official_id === official.id);
                        const officialOpportunities = opportunities.filter(o => o.official_id === official.id);
                        const completed = officialActivities.filter(a => a.status === 'completed').length;
                        
                        return {
                            official_id: official.id,
                            official_name: official.full_name,
                            total_activities: officialActivities.length,
                            completed_activities: completed,
                            pending_activities: officialActivities.filter(a => a.status === 'pending').length,
                            completion_rate: officialActivities.length > 0
                                ? ((completed / officialActivities.length) * 100).toFixed(1)
                                : 0,
                            total_opportunities: officialOpportunities.length,
                            pipeline_value: officialOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
                            won_opportunities: officialOpportunities.filter(o => o.stage === 'closed_won').length,
                        };
                    }),
                };
                break;
            }

            case 'client_risk': {
                const clients = await base44.entities.Client.list();
                
                const riskDistribution = {
                    low_risk: clients.filter(c => (c.risk_score || 0) >= 700).length,
                    medium_risk: clients.filter(c => (c.risk_score || 0) >= 500 && (c.risk_score || 0) < 700).length,
                    high_risk: clients.filter(c => (c.risk_score || 0) < 500).length,
                };

                reportData = {
                    risk_distribution: riskDistribution,
                    average_risk_score: clients.length > 0
                        ? (clients.reduce((sum, c) => sum + (c.risk_score || 0), 0) / clients.length).toFixed(0)
                        : 0,
                    clients_by_risk: {
                        low: clients.filter(c => (c.risk_score || 0) >= 700).map(c => ({
                            id: c.id,
                            name: c.name,
                            risk_score: c.risk_score,
                            segment: c.segment,
                        })),
                        medium: clients.filter(c => (c.risk_score || 0) >= 500 && (c.risk_score || 0) < 700).map(c => ({
                            id: c.id,
                            name: c.name,
                            risk_score: c.risk_score,
                            segment: c.segment,
                        })),
                        high: clients.filter(c => (c.risk_score || 0) < 500).map(c => ({
                            id: c.id,
                            name: c.name,
                            risk_score: c.risk_score,
                            segment: c.segment,
                        })),
                    },
                };
                break;
            }

            default:
                return Response.json({ 
                    error: `Unknown report type: ${report_type}` 
                }, { status: 400 });
        }

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'view',
            entity_type: 'Report',
            entity_id: report_type,
            description: `Generated report: ${report_type}`,
            trace_id: traceId,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            report_type,
            generated_at: new Date().toISOString(),
            generated_by: user.email,
            data: reportData,
        });
        
    } catch (error) {
        console.error('Error generating report:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});