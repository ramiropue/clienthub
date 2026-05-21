import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  const email = 'ramiropue08@gmail.com';
  // Let's first try to reset the password directly to see if updateUser works when authenticated
  // Wait, I can't authenticate without the password.
  // But I can check if the user exists.
  console.log("Checking user...");
}

test();
