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
  phone?: string | null;
  since: string;
  palette: string[];
  logoUrl: string | null;
  startDate: Date | null;
  brandTone?: string | null;
  accessInfo?: string | null;
  nextMeeting?: string | null;
  brandToneFileUrl?: string | null;
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

export interface WorkType {
  id: string;
  name: string;
  price: number;
  unit: string;
  group: string;
  icon: string;
}

function mapClient(c: any): Client {
  return {
    ...c,
    monthlyRetainer: c.monthly_retainer,
    retainerLabel: c.retainer_label,
    logoUrl: c.logo_url ?? null,
    startDate: c.start_date ? new Date(c.start_date) : null,
    brandTone: c.brand_tone ?? null,
    accessInfo: c.access_info ?? null,
    nextMeeting: c.next_meeting ?? null,
    brandToneFileUrl: c.brand_tone_file_url ?? null,
  };
}

function mapWork(w: any): Work {
  return {
    ...w,
    clientId: w.client_id,
    date: new Date(w.date)
  };
}

function mapWorkType(wt: any): WorkType {
  return {
    id: wt.id,
    name: wt.name,
    price: Number(wt.price),
    unit: wt.unit,
    group: wt.group_name,
    icon: wt.icon,
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

export async function getWorkTypes(): Promise<WorkType[]> {
  const { data, error } = await supabase.from('work_types').select('*');
  if (error) {
    console.error('Error fetching work types:', error);
    return [];
  }
  return (data || []).map(mapWorkType);
}

export async function saveWorkType(workType: WorkType, isNew: boolean): Promise<WorkType | null> {
  const payload = {
    id: workType.id,
    name: workType.name,
    price: workType.price,
    unit: workType.unit,
    group_name: workType.group,
    icon: workType.icon,
  };

  const { data, error } = isNew
    ? await supabase.from('work_types').insert([payload]).select().single()
    : await supabase.from('work_types').update(payload).eq('id', workType.id).select().single();

  if (error) {
    console.error('Error saving work type:', error);
    return null;
  }
  return mapWorkType(data);
}
