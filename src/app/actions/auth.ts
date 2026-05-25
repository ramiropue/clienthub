"use server";

import { createClient } from '@supabase/supabase-js';

export async function inviteClient(email: string, clientId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'La variable SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor. Es necesaria para enviar invitaciones.' };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { role: 'client', client_id: clientId },
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password` : 'http://localhost:3000/reset-password'
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
