// =====================================================
// SUPABASE CONFIG — DECA Coop de Barranquitas
// =====================================================

const SUPABASE_URL = 'https://cnybxlfjnejsrorgzhhz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueWJ4bGZqbmVqc3Jvcmd6aGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDQzODMsImV4cCI6MjA4Nzg4MDM4M30.PCTK9GmgD2njM0JmWXgQSy3tOQg1g7UgOAw2WDjfpzM';

let _supabaseClient = null;

function getSupabase() {
  if (_supabaseClient) return _supabaseClient;
  if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) {
    console.warn('getSupabase: SDK de Supabase no disponible todavía');
    return null;
  }
  _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: { eventsPerSecond: 5 }
    }
  });
  return _supabaseClient;
}

if (typeof window !== 'undefined') {
  window.getSupabase = getSupabase;
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
}
