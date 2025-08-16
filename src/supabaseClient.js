import { createClient } from '@supabase/supabase-js';

// This is our central function to create a Supabase client that is
// authenticated with the current user's Clerk token.
const createClerkSupabaseClient = async (getToken) => {
  // getToken is a function passed from Clerk's useAuth hook.
  // We call it with the "supabase" template we created in the Clerk dashboard.
  const supabaseToken = await getToken({ template: 'supabase' });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Create and return a new client for every request.
  // This ensures the token is fresh.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseToken}`,
      },
    },
  });

  return supabase;
};

export default createClerkSupabaseClient;