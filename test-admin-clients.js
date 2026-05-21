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
  
  const { data: clients, error: clientsErr } = await supabase.from('clients').select('*');
  if (clientsErr) {
    console.error("Fetch clients error:", clientsErr.message);
  } else {
    console.log("Clients fetched:", clients.length, clients);
  }
}
run();
