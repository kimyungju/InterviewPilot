import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

// This client runs client-side using the Supabase anon key. Supabase Storage
// RLS policies must be configured on the `interview-videos` bucket to restrict
// access per user (e.g. allow inserts/selects only when auth.uid() matches the
// user's folder path). Without proper RLS, any authenticated user could read or
// overwrite another user's recordings.
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
