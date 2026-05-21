const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runTest(email, password, role) {
  console.log(`\n--- Testing ${role} (${email}) ---`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Login failed:", error.message);
    return;
  }
  
  const { data: clients, error: cErr } = await supabase.from('clients').select('*');
  console.log("Clients:", clients?.length, cErr?.message || 'OK');

  const { data: works, error: wErr } = await supabase.from('works').select('*');
  console.log("Works:", works?.length, wErr?.message || 'OK');

  const { data: workTypes, error: wtErr } = await supabase.from('work_types').select('*');
  console.log("Work Types:", workTypes?.length, wtErr?.message || 'OK');
}

async function main() {
  await runTest('ramirotecnologia@gmail.com', 'password123', 'Admin');
  await runTest('ramiropue08@gmail.com', 'password123', 'Client');
}

main();
