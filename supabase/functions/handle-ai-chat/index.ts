import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
// --- 1. THIS IS THE CORRECT, OFFICIAL IMPORT ---
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    if (!prompt) throw new Error('No prompt provided')
    if (!API_KEY) throw new Error('Server misconfiguration: GOOGLE_AI_API_KEY')

    // --- 2. INITIALIZE THE CLIENT AS PER THE LATEST DOCS ---
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // --- 3. USE THE LATEST RECOMMENDED MODEL ---
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in AI chat function:', error)
    return new Response(JSON.stringify({ error: `AI service error: ${error.message || 'Unknown error'}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})