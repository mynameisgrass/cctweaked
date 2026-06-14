import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials from your dashboard settings
const SUPABASE_URL = 'https://vpecyvklywdgmomodjpc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Fe-G0hRWAPN6eU8CIaWU9w_DJ0C5kGP';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // Add CORS headers so you can call this from any web browser dashboard
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. SENDING A MESSAGE FROM WEB UI TO DATABASE
    if (req.method === 'POST') {
        const { player, message } = req.body;
        
        if (!player || !message) {
            return res.status(400).json({ error: 'Missing player or message' });
        }

        const { error } = await supabase
            .from('pending_messages')
            .insert([{ player, message }]);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
    }

    // 2. MINECRAFT PINGING TO FETCH AND CLEAR NEXT MESSAGE
    if (req.method === 'GET') {
        // Get oldest message
        const { data, error } = await supabase
            .from('pending_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) return res.status(500).json({ error: error.message });

        if (data && data.length > 0) {
            const nextMessage = data[0];

            // Delete it immediately so no other computer pulls it
            await supabase
                .from('pending_messages')
                .delete()
                .eq('id', nextMessage.id);

            return res.status(200).json({ 
                player: nextMessage.player, 
                message: nextMessage.message 
            });
        }

        // Return empty if no messages are waiting
        return res.status(200).json({ message: null });
    }
}