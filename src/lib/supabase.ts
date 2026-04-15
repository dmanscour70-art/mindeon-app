import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes.\n' +
    'Copiez .env.example en .env et renseignez vos clés Supabase.'
  )
}

// Wrap fetch to abort hanging REST/RPC data queries after 10 s.
// Auth, Storage and Realtime URLs are excluded so they are never cut short.
function fetchWithDataTimeout(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const s = String(url)
  const isDataCall = s.includes('/rest/v1') || s.includes('/rpc/')
  if (!isDataCall) return fetch(url, options)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: { fetch: fetchWithDataTimeout },
})
