import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            activity_id, 
            result, 
            notes, 
            related_product,
            location,
            document_url 
        } = await req.json();

        if (!activity_id) {
            return Response.json({ 
                error: 'activity_id is required' 
            }, { status: 400 });
        }

        // Get activity
        const activities = await base44.entities.Activity.filter({ id: activity_id });
        const activity = activities[0];
        
        if (!activity) {
            return Response.json({ error: 'Activity not found' }, { status: 404 });
        }

        const traceId = `CHK-${Date.now().toString(36).toUpperCase()}`;
        const checkinTime = new Date().toISOString();

        // Update activity
        const updateData = {
            status: 'completed',
            result: result || 'successful',
            related_product: related_product || null,
            notes: notes || activity.notes,
            checkin_at: checkinTime,
        };

        if (location) {
            updateData.checkin_lat = location.lat;
            updateData.checkin_lng = location.lng;
        }

        await base44.entities.Activity.update(activity_id, updateData);

        // Validate location if provided (check if within expected radius)
        let locationValid = true;
        let locationMessage = '';
        
        if (location && activity.lat && activity.lng) {
            // Simple distance calculation (in km)
            const R = 6371;
            const dLat = (location.lat - activity.lat) * Math.PI / 180;
            const dLon = (location.lng - activity.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(activity.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c * 1000; // in meters

            locationValid = distance <= 500; // 500 meters radius
            locationMessage = locationValid 
                ? `Ubicación verificada (${distance.toFixed(0)}m del punto esperado)`
                : `Ubicación fuera del rango esperado (${distance.toFixed(0)}m)`;
        }

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'checkin',
            entity_type: 'Activity',
            entity_id: activity_id,
            description: `Check-in: ${activity.title || activity.activity_type} - ${result || 'successful'}`,
            trace_id: traceId,
            meta_json: JSON.stringify({
                location,
                location_valid: locationValid,
                result,
            }),
        });

        // Create event
        await base44.entities.MockEvent.create({
            event_type: 'activity',
            source: 'checkin_service',
            payload: JSON.stringify({
                action: 'checkin',
                activity_id,
                result: result || 'successful',
                location,
                location_valid: locationValid,
            }),
            status: 'processed',
            trace_id: traceId,
        });

        // Evaluate rules after checkin
        const rulesResponse = await base44.functions.invoke('evaluateRules', {
            activity_id,
            client_id: activity.client_id,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            activity_id,
            status: 'completed',
            result: result || 'successful',
            checkin_at: checkinTime,
            location_validated: locationValid,
            location_message: locationMessage,
            rules_evaluated: rulesResponse.data?.rules_evaluated || 0,
            timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error('Error processing checkin:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});