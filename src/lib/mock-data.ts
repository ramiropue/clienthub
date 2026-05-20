export const TODAY = new Date('2026-05-15');
export const CURRENT_MONTH = { year: 2026, month: 4 }; // mayo (0-indexed)

export const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

export const WORK_TYPES = [
  { id: 'reel',     name: 'Reel',                 price: 65, unit: 'ud',   group: 'contenido', icon: 'video' },
  { id: 'post',     name: 'Post de feed',         price: 35, unit: 'ud',   group: 'contenido', icon: 'image' },
  { id: 'carrusel', name: 'Carrusel',             price: 50, unit: 'ud',   group: 'contenido', icon: 'layers' },
  { id: 'estrategia', name: 'Estrategia mensual', price: 250, unit: 'mes', group: 'estrategia', icon: 'compass' },
  { id: 'reunion',  name: 'Reunión / consultoría', price: 45, unit: 'hora', group: 'estrategia', icon: 'mic' },
  { id: 'community', name: 'Gestión comunidad',   price: 180, unit: 'sem',  group: 'estrategia', icon: 'chat' },
  { id: 'herramientas', name: 'Herramientas',     price: 0,   unit: 'mes',  group: 'extras', icon: 'wrench' }
];

export const CLIENTS: any[] = [];

export const WORKS_INIT: any[] = [];

export const STATUS = {
  borrador:  { label: 'Borrador',  className: 'badge-warn' },
  aprobado:  { label: 'Aprobado',  className: 'badge-info' },
  publicado: { label: 'Publicado', className: 'badge-ok' }
} as const;

export function getType(id: string) { return WORK_TYPES.find(t => t.id === id); }
export function getClient(id: string) { return CLIENTS.find(c => c.id === id); }

export function eur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
export function eurFull(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

export function worksFor(works: any[], clientId: string, year: number, month: number) {
  return works.filter(w => w.clientId === clientId && w.date.getFullYear() === year && w.date.getMonth() === month);
}

export function totalFor(works: any[], clientId: string, year: number, month: number) {
  const client = getClient(clientId);
  if (!client) return { retainer: 0, variable: 0, total: 0, count: 0 };
  const list = worksFor(works, clientId, year, month);
  const variable = list.reduce((s, w) => s + w.price, 0);
  return { retainer: client.monthlyRetainer, variable, total: client.monthlyRetainer + variable, count: list.length };
}

export function weekOf(d: Date) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const diff = (d.getTime() - onejan.getTime() + (onejan.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
  return Math.ceil((diff + onejan.getDay() + 1) / 7);
}

export function weekRange(d: Date) {
  const day = d.getDay() || 7; 
  const monday = new Date(d); monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (x: Date) => `${x.getDate()} ${MONTH_NAMES[x.getMonth()].slice(0,3).toLowerCase()}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export function groupByWeek(list: any[]) {
  const groups: Record<number, any> = {};
  list.forEach(w => {
    const k = weekOf(w.date);
    if (!groups[k]) groups[k] = { week: k, range: weekRange(w.date), items: [] };
    groups[k].items.push(w);
  });
  return Object.values(groups).sort((a: any, b: any) => b.week - a.week);
}
