import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { activity_id, new_official_id, reason } = await req.json();

        if (!activity_id || !new_official_id) {
            return Response.json({ 
                error: 'activity_id and new_official_id are required' 
            }, { status: 400 });
        }

        // Get activity
        const activities = await base44.entities.Activity.filter({ id: activity_id });
        const activity = activities[0];
        
        if (!activity) {
            return Response.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Get new official (AppUser)
        const appUsers = await base44.entities.AppUser.list();
        const newOfficial = appUsers.find(u => u.id === new_official_id);
        
        if (!newOfficial) {
            return Response.json({ error: 'Official not found' }, { status: 404 });
        }

        const traceId = `ASN-${Date.now().toString(36).toUpperCase()}`;
        const previousOfficialId = activity.official_id;
        const previousOfficialName = activity.official_name;

        // Check new official's workload
        const newOfficialActivities = await base44.entities.Activity.filter({ 
            official_id: new_official_id,
            status: 'pending'
        });
        
        const workloadWarning = newOfficialActivities.length >= 15;

        // Update activity
        await base44.entities.Activity.update(activity_id, {
            official_id: new_official_id,
            official_name: newOfficial.full_name,
        });

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'update',
            entity_type: 'Activity',
            entity_id: activity_id,
            description: `Reasignación: ${previousOfficialName} → ${newOfficial.full_name}. ${reason || ''}`,
            trace_id: traceId,
            meta_json: JSON.stringify({
                previous_official_id: previousOfficialId,
                new_official_id,
                reason,
            }),
        });

        // Create event
        await base44.entities.MockEvent.create({
            event_type: 'activity',
            source: 'assignment_service',
            payload: JSON.stringify({
                action: 'reassign',
                activity_id,
                from_official: previousOfficialId,
                to_official: new_official_id,
                workload_warning: workloadWarning,
            }),
            status: 'processed',
            trace_id: traceId,
        });

        // If workload is high, create notification event
        if (workloadWarning) {
            await base44.entities.MockEvent.create({
                event_type: 'notification',
                source: 'workload_monitor',
                payload: JSON.stringify({
                    type: 'workload_warning',
                    official_id: new_official_id,
                    pending_activities: newOfficialActivities.length + 1,
                    message: `${newOfficial.full_name} tiene ${newOfficialActivities.length + 1} actividades pendientes`,
                }),
                status: 'pending',
                trace_id: traceId,
            });
        }

        return Response.json({
            success: true,
            trace_id: traceId,
            activity_id,
            previous_official: {
                id: previousOfficialId,
                name: previousOfficialName,
            },
            new_official: {
                id: new_official_id,
                name: newOfficial.full_name,
                pending_activities: newOfficialActivities.length + 1,
            },
            workload_warning: workloadWarning,
            timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error('Error assigning activity:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});