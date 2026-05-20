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
  publishedBy?: string | null;
  publishedAt?: Date | null;
}

export interface WorkType {
  id: string;
  name: string;
  price: number;
  unit: string;
  group: string;
  icon: string;
}

export interface Settings {
  id: string;
  profileName: string;
  profileRole: string;
  profileColor: string;
  profileImageUrl: string | null;
  companyName: string | null;
  companyId: string | null;
  companyAddress: string | null;
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
    date: new Date(w.date),
    publishedBy: w.published_by ?? null,
    publishedAt: w.published_at ? new Date(w.published_at) : null
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

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
  if (error || !data) {
    console.error('Error fetching settings:', error);
    return {
      id: 'global',
      profileName: 'Ramiro',
      profileRole: 'Social Media · Freelance',
      profileColor: '#161311',
      profileImageUrl: null,
      companyName: null,
      companyId: null,
      companyAddress: null,
    };
  }
  return {
    id: data.id,
    profileName: data.profile_name,
    profileRole: data.profile_role,
    profileColor: data.profile_color,
    profileImageUrl: data.profile_image_url,
    companyName: data.company_name,
    companyId: data.company_id,
    companyAddress: data.company_address,
  };
}

export async function saveSettings(settings: Settings): Promise<Settings | null> {
  const payload = {
    id: settings.id,
    profile_name: settings.profileName,
    profile_role: settings.profileRole,
    profile_color: settings.profileColor,
    profile_image_url: settings.profileImageUrl,
    company_name: settings.companyName,
    company_id: settings.companyId,
    company_address: settings.companyAddress,
  };

  const { data, error } = await supabase
    .from('settings')
    .update(payload)
    .eq('id', settings.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating settings:', error);
    return null;
  }

  return {
    id: data.id,
    profileName: data.profile_name,
    profileRole: data.profile_role,
    profileColor: data.profile_color,
    profileImageUrl: data.profile_image_url,
    companyName: data.company_name,
    companyId: data.company_id,
    companyAddress: data.company_address,
  };
}

export interface AppNotification {
  id: string;
  clientId: string;
  recipient: 'admin' | 'client';
  title: string;
  message: string;
  type: 'estado' | 'mensaje' | 'nuevo_trabajo';
  workId?: string | null;
  read: boolean;
  createdAt: Date;
}

function mapNotification(n: any): AppNotification {
  return {
    id: n.id,
    clientId: n.client_id,
    recipient: n.recipient as 'admin' | 'client',
    title: n.title,
    message: n.message,
    type: n.type as 'estado' | 'mensaje' | 'nuevo_trabajo',
    workId: n.work_id ?? null,
    read: n.read,
    createdAt: new Date(n.created_at)
  };
}

export async function getNotifications(recipient: 'admin' | 'client', clientId?: string): Promise<AppNotification[]> {
  let query = supabase.from('notifications').select('*').eq('recipient', recipient);
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data || []).map(mapNotification);
}

export async function createNotification(n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): Promise<AppNotification | null> {
  const payload = {
    client_id: n.clientId,
    recipient: n.recipient,
    title: n.title,
    message: n.message,
    type: n.type,
    work_id: n.workId || null,
    read: false
  };

  const { data, error } = await supabase.from('notifications').insert([payload]).select().single();
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  return mapNotification(data);
}

export async function markNotificationsAsRead(ids: string[]): Promise<boolean> {
  const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids);
  if (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
  return true;
}
