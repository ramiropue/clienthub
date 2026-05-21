"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateClientAction(id: string, payload: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  if (!data || data.length === 0) {
    return { success: false, error: 'No se pudo actualizar el cliente. Verifica permisos.' };
  }

  // Revalidate the client detail page to bust Next.js cache
  revalidatePath(`/admin/client/${id}`);
  revalidatePath('/admin/clients');
  revalidatePath('/admin');
  revalidatePath('/admin/calendar');
  
  return { success: true, data: data[0] };
}
