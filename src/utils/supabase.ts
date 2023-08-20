import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from "../types/db.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_KEY') ?? '';

export const supabaseClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false } }
);
