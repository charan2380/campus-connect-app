// /supabase/functions/_shared/cors.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  
  // --- ADD THESE HEADERS FOR STREAMING ---
  'Connection': 'keep-alive',
  'Content-Encoding': 'none'
};