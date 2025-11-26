import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { card_id, action, otp_code } = await req.json();

        if (!card_id || !action) {
            return Response.json({ 
                error: 'card_id and action are required' 
            }, { status: 400 });
        }

        // Validate action
        const validActions = ['block', 'unblock', 'request_replacement', 'change_pin', 'update_limit'];
        if (!validActions.includes(action)) {
            return Response.json({ 
                error: `Invalid action. Valid actions: ${validActions.join(', ')}` 
            }, { status: 400 });
        }

        // Get card
        const cards = await base44.entities.Card.filter({ id: card_id });
        const card = cards[0];
        
        if (!card) {
            return Response.json({ error: 'Card not found' }, { status: 404 });
        }

        const traceId = `CARD-${Date.now().toString(36).toUpperCase()}`;

        // Validate OTP for sensitive operations
        const requiresOtp = ['unblock', 'change_pin', 'update_limit'].includes(action);
        if (requiresOtp && !otp_code) {
            // Generate OTP (in real system, this would send SMS/email)
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            
            await base44.entities.MockEvent.create({
                event_type: 'notification',
                source: 'otp_service',
                payload: JSON.stringify({
                    action: 'otp_generated',
                    card_id,
                    otp: generatedOtp, // In production, never expose OTP in logs
                    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                }),
                status: 'processed',
                trace_id: traceId,
            });

            return Response.json({
                success: false,
                requires_otp: true,
                message: 'OTP required for this operation. Code sent to registered phone.',
                trace_id: traceId,
                // For demo purposes only:
                demo_otp: generatedOtp,
            });
        }

        // Validate OTP (simplified for demo - in production use secure validation)
        if (requiresOtp && otp_code) {
            // For demo, accept any 6-digit code
            if (otp_code.length !== 6) {
                return Response.json({
                    success: false,
                    error: 'Invalid OTP code',
                    trace_id: traceId,
                }, { status: 400 });
            }
        }

        // Process action
        let newStatus = card.status;
        let updateData = {};
        let resultMessage = '';

        switch (action) {
            case 'block':
                newStatus = 'blocked';
                updateData = { status: 'blocked' };
                resultMessage = 'Card blocked successfully';
                break;
                
            case 'unblock':
                newStatus = 'active';
                updateData = { status: 'active' };
                resultMessage = 'Card unblocked successfully';
                break;
                
            case 'request_replacement':
                // In real system, this would create a card request
                resultMessage = 'Card replacement requested. New card will be delivered in 5-7 business days.';
                break;
                
            case 'change_pin':
                resultMessage = 'PIN change successful. New PIN is active immediately.';
                break;
                
            case 'update_limit':
                // Could receive new limit in request
                resultMessage = 'Credit limit update request submitted for approval.';
                break;
        }

        // Update card if needed
        if (Object.keys(updateData).length > 0) {
            await base44.entities.Card.update(card_id, updateData);
        }

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'update',
            entity_type: 'Card',
            entity_id: card_id,
            description: `Card ${action}: ${card.card_number_masked}`,
            trace_id: traceId,
        });

        // Create event
        await base44.entities.MockEvent.create({
            event_type: 'card',
            source: 'card_management',
            payload: JSON.stringify({
                action,
                card_id,
                previous_status: card.status,
                new_status: newStatus,
            }),
            status: 'processed',
            trace_id: traceId,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            action,
            card_id,
            card_number_masked: card.card_number_masked,
            previous_status: card.status,
            new_status: newStatus,
            message: resultMessage,
            timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error('Error managing card:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});