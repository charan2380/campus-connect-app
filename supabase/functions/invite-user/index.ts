import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from "invite-user" Edge Function!')

const clerkApiUrl = 'https://api.clerk.com/v1/invitations'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role } = await req.json()
    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY')

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email and role are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!clerkSecretKey) {
      throw new Error('Server misconfiguration: Clerk Secret Key is not set.')
    }

    // --- THIS IS THE CORRECTED REQUEST BODY ---
    // We REMOVE the `redirect_url`. Clerk will now use the URL
    // configured in your Clerk Dashboard, which is the correct behavior.
    const response = await fetch(clerkApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clerkSecretKey}`,
      },
      body: JSON.stringify({
        email_address: email,
        public_metadata: {
          role: role,
        },
        // `redirect_url` has been removed.
      }),
    })
    // --- END OF CORRECTION ---

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Clerk API Error:', errorData);
        throw new Error(`Clerk API responded with status: ${response.status}`);
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
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