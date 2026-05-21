// supabaseClient.js
const SUPABASE_URL = "https://wgszratizlxpxifngrrs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnc3pyYXRpemx4cHhpZm5ncnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTg0MjMsImV4cCI6MjA5NDYzNDQyM30.oishFeiIfY5qH0eF2bKbsWi-sP__bzZCnMZuuyE3vKQ";

// CDN global can vary; handle both safely.
const SupabaseLib =
  (window.supabase && window.supabase.createClient && window.supabase) ||
  (window.supabaseJs && window.supabaseJs.createClient && window.supabaseJs) ||
  null;

if (!SupabaseLib) {
  console.error("❌ Supabase library not found. CDN didn't load or global name changed.");
} else {
  window.supabaseClient = SupabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ supabaseClient ready:", !!window.supabaseClient);
}
