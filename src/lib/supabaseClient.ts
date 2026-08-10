import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * `true` only when both env vars are present. Every Supabase-backed feature
 * must check this before touching `supabase` and fall back to a local-only
 * mode when it's `false` — never assume the backend is there.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * `null` when unconfigured. Only the anon key is ever read here — the
 * service_role key must never be referenced from frontend code.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false },
    })
  : null
