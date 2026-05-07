import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            account_id, 
            type, 
            amount, 
            description,
            destination_account 
        } = await req.json();

        if (!account_id || !type || !amount) {
            return Response.json({ 
                error: 'account_id, type, and amount are required' 
            }, { status: 400 });
        }

        // Get source account
        const accounts = await base44.entities.Account.filter({ id: account_id });
        const account = accounts[0];
        
        if (!account) {
            return Response.json({ error: 'Account not found' }, { status: 404 });
        }

        const traceId = `TRX-${Date.now().toString(36).toUpperCase()}`;
        
        // Validate transaction
        const isDebit = ['withdrawal', 'transfer_out', 'payment', 'charge'].includes(type);
        
        if (isDebit && account.available_balance < amount) {
            // Create failed event
            await base44.entities.MockEvent.create({
                event_type: 'transaction',
                source: 'core_banking',
                payload: JSON.stringify({
                    action: type,
                    account_id,
                    amount,
                    status: 'failed',
                    reason: 'insufficient_funds',
                }),
                status: 'failed',
                trace_id: traceId,
            });

            return Response.json({
                success: false,
                error: 'Insufficient funds',
                trace_id: traceId,
                available_balance: account.available_balance,
            }, { status: 400 });
        }

        // Calculate new balance
        const newBalance = isDebit 
            ? account.balance - amount 
            : account.balance + amount;
        
        const newAvailableBalance = isDebit
            ? account.available_balance - amount
            : account.available_balance + amount;

        // Create transaction record
        const transaction = await base44.entities.Transaction.create({
            account_id,
            client_id: account.client_id,
            type,
            amount,
            currency: account.currency || 'USD',
            reference: traceId,
            description: description || `${type} via API`,
            balance_after: newBalance,
            destination_account: destination_account || null,
            status: 'completed',
            channel: 'api',
        });

        // Update account balance
        await base44.entities.Account.update(account_id, {
            balance: newBalance,
            available_balance: newAvailableBalance,
        });

        // Handle destination account for transfers
        if (type === 'transfer_out' && destination_account) {
            const destAccounts = await base44.entities.Account.filter({ 
                account_number: destination_account 
            });
            
            if (destAccounts.length > 0) {
                const destAccount = destAccounts[0];
                
                // Create incoming transaction on destination
                await base44.entities.Transaction.create({
                    account_id: destAccount.id,
                    client_id: destAccount.client_id,
                    type: 'transfer_in',
                    amount,
                    currency: account.currency || 'USD',
                    reference: traceId,
                    description: `Transfer from ${account.account_number}`,
                    balance_after: destAccount.balance + amount,
                    status: 'completed',
                    channel: 'api',
                });

                // Update destination account
                await base44.entities.Account.update(destAccount.id, {
                    balance: destAccount.balance + amount,
                    available_balance: destAccount.available_balance + amount,
                });
            }
        }

        // Create audit log
        await base44.entities.Audit.create({
            user_id: user.id,
            user_email: user.email,
            action: 'transfer',
            entity_type: 'Transaction',
            entity_id: transaction.id,
            description: `${type}: ${amount} ${account.currency || 'USD'}`,
            trace_id: traceId,
        });

        // Create success event
        await base44.entities.MockEvent.create({
            event_type: 'transaction',
            source: 'core_banking',
            payload: JSON.stringify({
                action: type,
                account_id,
                amount,
                new_balance: newBalance,
                transaction_id: transaction.id,
            }),
            status: 'processed',
            trace_id: traceId,
        });

        return Response.json({
            success: true,
            trace_id: traceId,
            transaction_id: transaction.id,
            type,
            amount,
            currency: account.currency || 'USD',
            new_balance: newBalance,
            new_available_balance: newAvailableBalance,
            timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error('Error processing transaction:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});