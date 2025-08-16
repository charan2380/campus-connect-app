import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// --- THIS IS THE CORRECTED IMPORT ---
// We now import the 'svix' library directly from a trusted Deno package URL.
import { Webhook } from 'https://esm.sh/svix@1.24.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // This local import is correct

const CLERK_WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')

serve(async (req) => {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set in Supabase secrets.');
    return new Response('Server configuration error', { status: 500 });
  }

  try {
    const payloadString = await req.text()
    const svixHeaders = {
      'svix-id': req.headers.get('svix-id')!,
      'svix-timestamp': req.headers.get('svix-timestamp')!,
      'svix-signature': req.headers.get('svix-signature')!,
    }

    const wh = new Webhook(CLERK_WEBHOOK_SECRET)
    const payload = wh.verify(payloadString, svixHeaders) as { type: string, data: any }
    
    console.log(`Webhook event received: ${payload.type}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (payload.type === 'user.deleted') {
      const { id: userId } = payload.data;
      if (userId) {
        console.log(`Attempting to delete profile for user: ${userId}`);
        const { error } = await supabaseAdmin.from('profiles').delete().eq('user_id', userId);
        
        if (error) {
          console.error(`Error deleting profile for user ${userId}:`, error.message);
          return new Response(`Error deleting profile: ${error.message}`, { status: 500 });
        }
        
        console.log(`Successfully deleted profile for user ${userId}`);
      }
    }

    return new Response('Webhook received and processed.', { status: 200 })

  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Invalid signature', { status: 400 })
  }
})