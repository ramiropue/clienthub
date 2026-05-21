const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ramirotecnologia@gmail.com',
    password: 'password123'
  });
  if (error) {
    console.error("Login failed:", error.message);
    return;
  }
  
  const { data: settings, error: sErr } = await supabase.from('settings').select('*').eq('id', 'global').single();
  console.log("Settings:", settings, sErr);
}
run();
