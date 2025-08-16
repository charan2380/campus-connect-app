import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, newRole } = await req.json()
    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY')
    
    if (!userId || !newRole) throw new Error('User ID and new role are required');
    if (!clerkSecretKey) throw new Error('Server misconfiguration: CLERK_SECRET_KEY');

    // --- STEP 1: Update the user's metadata in Clerk ---
    const metadataUrl = `https://api.clerk.com/v1/users/${userId}/metadata`
    const metadataResponse = await fetch(metadataUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clerkSecretKey}` },
      body: JSON.stringify({ public_metadata: { role: newRole } }),
    })
    if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(`Clerk Metadata API Error: ${errorData.errors[0].message}`);
    }
    const updatedUser = await metadataResponse.json()

    // --- STEP 2: Securely update the role in the public.profiles table ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('user_id', userId)
    if (profileError) {
      throw new Error(`Supabase Profile Update Error: ${profileError.message}`);
    }

    // --- STEP 3: Revoke all of the user's active sessions ---
    // This is a "best-effort" step. We don't want to fail the whole operation if it doesn't work.
    try {
        const getSessionsUrl = `https://api.clerk.com/v1/sessions?user_id=${userId}`
        const sessionsResponse = await fetch(getSessionsUrl, {
            headers: { 'Authorization': `Bearer ${clerkSecretKey}` }
        });
        if (sessionsResponse.ok) {
            const sessions = await sessionsResponse.json();
            const revokePromises = sessions.map(session => {
                const revokeUrl = `https://api.clerk.com/v1/sessions/${session.id}/revoke`;
                return fetch(revokeUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${clerkSecretKey}` } });
            });
            await Promise.all(revokePromises);
            console.log(`Successfully revoked ${sessions.length} sessions for user ${userId}.`);
        }
    } catch (revokeError) {
        console.warn(`Could not revoke sessions for user ${userId}:`, revokeError.message);
    }

    return new Response(JSON.stringify(updatedUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})