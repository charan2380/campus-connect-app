import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'
import { corsHeaders } from '../_shared/cors.ts'
// This library will help us parse the PDF content on the server
import pdf from 'npm:pdf-parse/lib/pdf-parse.js'

const API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
const genAI = new GoogleGenerativeAI(API_KEY!)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filePath } = await req.json()
    if (!filePath) throw new Error('No file path provided')

    // 1. Create a Supabase admin client to download the private file
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // 2. Download the PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('pdfs')
      .download(filePath)
      
    if (downloadError) throw new Error(`Failed to download PDF: ${downloadError.message}`)

    // 3. Extract text from the PDF buffer
    const pdfBuffer = await fileData.arrayBuffer()
    const pdfText = (await pdf(pdfBuffer)).text

    if (!pdfText) throw new Error("Could not extract text from the PDF.")

    // 4. Send the extracted text to the AI for summarization
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `Please provide a concise summary of the following document:\n\n${pdfText}`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const summary = response.text()

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in PDF summarization function:', error)
    return new Response(JSON.stringify({ error: `Summarization failed: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})