import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey

// Server-side client — bypasses RLS, used in API routes only
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Browser client — uses anon key, used in frontend components
// Singleton to avoid multiple GoTrueClient instances on the same storage key
let browserClient: ReturnType<typeof createClient> | null = null
export function createBrowserSupabase() {
  if (browserClient) return browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  browserClient = createClient(url, key)
  return browserClient
}
