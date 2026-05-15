import { supabase } from './supabase';

export interface Client {
  id: string;
  name: string;
  handle: string;
  sector: string;
  color: string;
  initials: string;
  monthlyRetainer: number;
  retainerLabel: string;
  email: string;
  since: string;
  palette: string[];
}

export interface Work {
  id: string;
  clientId: string;
  type: string;
  title: string;
  date: Date;
  status: string;
  price: number;
  thumb: string | null;
  notes: string | null;
}

function mapClient(c: any): Client {
  return {
    ...c,
    monthlyRetainer: c.monthly_retainer,
    retainerLabel: c.retainer_label
  };
}

function mapWork(w: any): Work {
  return {
    ...w,
    clientId: w.client_id,
    date: new Date(w.date)
  };
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return (data || []).map(mapClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }
  return mapClient(data);
}

export async function getWorks(): Promise<Work[]> {
  const { data, error } = await supabase.from('works').select('*');
  if (error) {
    console.error('Error fetching works:', error);
    return [];
  }
  return (data || []).map(mapWork);
}

export async function getWorksForClient(clientId: string): Promise<Work[]> {
  const { data, error } = await supabase.from('works').select('*').eq('client_id', clientId);
  if (error) {
    console.error('Error fetching works for client:', error);
    return [];
  }
  return (data || []).map(mapWork);
}
