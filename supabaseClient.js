// supabaseClient.js
const SUPABASE_URL = "https://sqlmvlqwezdjoyijqhqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbG12bHF3ZXpkam95aWpxaHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjczMjksImV4cCI6MjA4NDcwMzMyOX0.DRMF2r73c7qNqAMQ_YItk01kA_6cRoVJDJ2H9Z8GqwA";

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
