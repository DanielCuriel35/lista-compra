// Sustituye por los datos de tu proyecto
const SUPABASE_URL="https://raforfyswzxkvqgnglxn.supabase.co";
const SUPABASE_KEY="sb_publishable_mubK_fWCbHlrrQvXlqsZZg_fQzmGHXY";

// IMPORTANTE: usamos 'client', NO 'supabase'
const client = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
