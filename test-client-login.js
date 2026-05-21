const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ramiropue08@gmail.com',
    password: 'password123'
  });
  if (error) {
    console.error("Login failed:", error.message);
    return;
  }
  
  console.log("Login success! User ID:", data.user.id);
  const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  if (profErr) {
    console.error("Profile fetch error:", profErr.message);
  } else {
    console.log("Profile fetched:", profile);
  }

  const { data: clientData, error: clientErr } = await supabase.from('clients').select('*');
  console.log("Client fetch:", clientData, clientErr?.message);
}
run();
