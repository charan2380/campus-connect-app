import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { userId } = await req.json()
    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY')
    if (!userId) throw new Error('User ID is required.');
    if (!clerkSecretKey) throw new Error('Server misconfiguration.');

    const clerkApiUrl = `https://api.clerk.com/v1/users/${userId}`
    const response = await fetch(clerkApiUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${clerkSecretKey}` },
    })

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Clerk API Error: ${errorData.errors[0].message}`);
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