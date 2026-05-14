/* global window */
// ───────────── Mock data ─────────────

const TODAY = new Date('2026-05-15');
const CURRENT_MONTH = { year: 2026, month: 4 }; // mayo (0-indexed)

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const WORK_TYPES = [
  { id: 'reel',     name: 'Reel',                 price: 65, unit: 'ud',   group: 'contenido', icon: 'video' },
  { id: 'post',     name: 'Post de feed',         price: 35, unit: 'ud',   group: 'contenido', icon: 'image' },
  { id: 'carrusel', name: 'Carrusel',             price: 50, unit: 'ud',   group: 'contenido', icon: 'layers' },
  { id: 'estrategia', name: 'Estrategia mensual', price: 250, unit: 'mes', group: 'estrategia', icon: 'compass' },
  { id: 'reunion',  name: 'Reunión / consultoría', price: 45, unit: 'hora', group: 'estrategia', icon: 'mic' },
  { id: 'community', name: 'Gestión comunidad',   price: 180, unit: 'sem',  group: 'estrategia', icon: 'chat' },
  { id: 'herramientas', name: 'Herramientas',     price: 0,   unit: 'mes',  group: 'extras', icon: 'wrench' }
];

const CLIENTS = [
  {
    id: 'pilar',
    name: 'Studio Pilar',
    handle: '@studiopilar',
    sector: 'Yoga & bienestar',
    color: '#1F3D2E', // deep green
    initials: 'SP',
    monthlyRetainer: 450,            // iguala fija
    retainerLabel: 'Iguala plan Esencial',
    email: 'hola@studiopilar.es',
    since: 'Sep 2025',
    palette: ['#1F3D2E', '#D6C6A8', '#E8421A']
  },
  {
    id: 'aceite',
    name: 'Hermanos Aceite',
    handle: '@hermanos.aceite',
    sector: 'AOVE premium',
    color: '#5A3A1A',
    initials: 'HA',
    monthlyRetainer: 380,
    retainerLabel: 'Iguala plan Esencial',
    email: 'marina@hermanosaceite.com',
    since: 'Ene 2026',
    palette: ['#5A3A1A', '#C9A864', '#E8421A']
  }
];

// Helpers
const date = (y, m, d) => new Date(y, m, d);
const isoDay = (d) => `${d.getDate().toString().padStart(2,'0')} ${MONTH_NAMES[d.getMonth()].slice(0,3).toLowerCase()}.`;

// Generate works for current month + a couple historical months
function makeWorks() {
  const may = 4, apr = 3, mar = 2;
  return [
    // ────── Studio Pilar — Mayo
    { id: 'w1',  clientId: 'pilar', type: 'estrategia', title: 'Plan editorial mayo: serie "Movimiento consciente"', date: date(2026, may, 2),  status: 'aprobado',  price: 250, notes: '8 piezas + 3 reels + 1 carrusel guía. Eje: respiración y rutina matinal.' },
    { id: 'w2',  clientId: 'pilar', type: 'carrusel',   title: '6 posturas para empezar la mañana',                  date: date(2026, may, 4),  status: 'publicado', price: 50,  thumb: '#D6C6A8' },
    { id: 'w3',  clientId: 'pilar', type: 'post',       title: 'Cita semanal — Patanjali',                            date: date(2026, may, 5),  status: 'publicado', price: 35,  thumb: '#1F3D2E' },
    { id: 'w4',  clientId: 'pilar', type: 'reel',       title: 'Reel guiado: 60s respiración alternada',              date: date(2026, may, 7),  status: 'publicado', price: 65,  thumb: '#E8421A' },
    { id: 'w5',  clientId: 'pilar', type: 'community',  title: 'Gestión comunidad · semana 19',                       date: date(2026, may, 10), status: 'aprobado',  price: 180 },
    { id: 'w6',  clientId: 'pilar', type: 'post',       title: 'Anuncio clase abierta sábado',                        date: date(2026, may, 11), status: 'publicado', price: 35,  thumb: '#D6C6A8' },
    { id: 'w7',  clientId: 'pilar', type: 'reel',       title: 'Reel testimonio: Carla, 8 meses practicando',         date: date(2026, may, 13), status: 'aprobado',  price: 65,  thumb: '#1F3D2E' },
    { id: 'w8',  clientId: 'pilar', type: 'carrusel',   title: 'Guía: cómo elegir tu primera esterilla',              date: date(2026, may, 14), status: 'borrador',  price: 50,  thumb: '#5A3A1A', notes: 'Pendiente de aprobar copy de la portada.' },
    { id: 'w9',  clientId: 'pilar', type: 'reunion',    title: 'Sesión brief retiro de junio',                        date: date(2026, may, 14), status: 'aprobado',  price: 45,  notes: 'Reunión 1h vía Meet — preparación contenidos pre-retiro.' },
    { id: 'w10', clientId: 'pilar', type: 'post',       title: 'Behind the scenes — taller del sábado',               date: date(2026, may, 16), status: 'borrador',  price: 35,  thumb: '#E8421A' },
    { id: 'w11', clientId: 'pilar', type: 'community',  title: 'Gestión comunidad · semana 20',                       date: date(2026, may, 17), status: 'borrador',  price: 180 },
    { id: 'w12', clientId: 'pilar', type: 'herramientas', title: 'Canva Pro + Metricool',                             date: date(2026, may, 1),  status: 'aprobado',  price: 28 },

    // ────── Studio Pilar — Abril (histórico)
    { id: 'h1', clientId: 'pilar', type: 'estrategia', title: 'Plan editorial abril', date: date(2026, apr, 2), status: 'publicado', price: 250 },
    { id: 'h2', clientId: 'pilar', type: 'reel',       title: 'Reel "qué es ashtanga"', date: date(2026, apr, 8), status: 'publicado', price: 65 },
    { id: 'h3', clientId: 'pilar', type: 'reel',       title: 'Reel rutina post-trabajo', date: date(2026, apr, 18), status: 'publicado', price: 65 },
    { id: 'h4', clientId: 'pilar', type: 'carrusel',   title: 'Carrusel beneficios meditar', date: date(2026, apr, 22), status: 'publicado', price: 50 },
    { id: 'h5', clientId: 'pilar', type: 'post',       title: '4 posts de feed', date: date(2026, apr, 10), status: 'publicado', price: 140 },
    { id: 'h6', clientId: 'pilar', type: 'community',  title: 'Community management mes', date: date(2026, apr, 1), status: 'publicado', price: 720 },
    { id: 'h7', clientId: 'pilar', type: 'reunion',    title: 'Reuniones (3h)', date: date(2026, apr, 9), status: 'publicado', price: 135 },
    { id: 'h8', clientId: 'pilar', type: 'herramientas', title: 'Canva Pro + Metricool', date: date(2026, apr, 1), status: 'publicado', price: 28 },

    // ────── Studio Pilar — Marzo (histórico, totales agregados)
    { id: 'm1', clientId: 'pilar', type: 'estrategia', title: 'Plan editorial marzo', date: date(2026, mar, 3), status: 'publicado', price: 250 },
    { id: 'm2', clientId: 'pilar', type: 'reel',       title: '3 reels', date: date(2026, mar, 8), status: 'publicado', price: 195 },
    { id: 'm3', clientId: 'pilar', type: 'carrusel',   title: '2 carruseles', date: date(2026, mar, 14), status: 'publicado', price: 100 },
    { id: 'm4', clientId: 'pilar', type: 'post',       title: '5 posts de feed', date: date(2026, mar, 20), status: 'publicado', price: 175 },
    { id: 'm5', clientId: 'pilar', type: 'community',  title: 'Community management', date: date(2026, mar, 1), status: 'publicado', price: 720 },
    { id: 'm6', clientId: 'pilar', type: 'reunion',    title: 'Reuniones (2h)', date: date(2026, mar, 11), status: 'publicado', price: 90 },
    { id: 'm7', clientId: 'pilar', type: 'herramientas', title: 'Herramientas', date: date(2026, mar, 1), status: 'publicado', price: 28 },

    // ────── Hermanos Aceite — Mayo
    { id: 'a1', clientId: 'aceite', type: 'estrategia', title: 'Estrategia mayo: campaña "Sabor de cosecha"',        date: date(2026, may, 3),  status: 'aprobado',  price: 250, notes: 'Eje: trazabilidad + nuevo formato 250ml.' },
    { id: 'a2', clientId: 'aceite', type: 'reel',       title: 'Reel: del olivar a la mesa (30s)',                  date: date(2026, may, 6),  status: 'publicado', price: 65,  thumb: '#5A3A1A' },
    { id: 'a3', clientId: 'aceite', type: 'carrusel',   title: 'Cata: 5 notas que definen un AOVE',                 date: date(2026, may, 8),  status: 'publicado', price: 50,  thumb: '#C9A864' },
    { id: 'a4', clientId: 'aceite', type: 'post',       title: 'Receta semana — pan con tomate y AOVE',             date: date(2026, may, 9),  status: 'publicado', price: 35,  thumb: '#E8421A' },
    { id: 'a5', clientId: 'aceite', type: 'reel',       title: 'Reel formato 250ml — unboxing',                     date: date(2026, may, 12), status: 'aprobado',  price: 65,  thumb: '#5A3A1A' },
    { id: 'a6', clientId: 'aceite', type: 'community',  title: 'Gestión comunidad · semanas 19-20',                 date: date(2026, may, 1),  status: 'aprobado',  price: 360 },
    { id: 'a7', clientId: 'aceite', type: 'reunion',    title: 'Reunión equipo distribución',                       date: date(2026, may, 13), status: 'aprobado',  price: 45 },
    { id: 'a8', clientId: 'aceite', type: 'carrusel',   title: 'Maridajes para verano',                              date: date(2026, may, 15), status: 'borrador',  price: 50,  thumb: '#C9A864', notes: 'Esperando fotos del fotógrafo.' },
    { id: 'a9', clientId: 'aceite', type: 'herramientas', title: 'Canva Pro + Metricool',                            date: date(2026, may, 1),  status: 'aprobado',  price: 28 },

    // ────── Hermanos Aceite — Abril
    { id: 'ah1', clientId: 'aceite', type: 'estrategia', title: 'Estrategia abril', date: date(2026, apr, 2), status: 'publicado', price: 250 },
    { id: 'ah2', clientId: 'aceite', type: 'reel',       title: '2 reels',          date: date(2026, apr, 9), status: 'publicado', price: 130 },
    { id: 'ah3', clientId: 'aceite', type: 'carrusel',   title: '3 carruseles',     date: date(2026, apr, 17), status: 'publicado', price: 150 },
    { id: 'ah4', clientId: 'aceite', type: 'post',       title: '4 posts de feed',  date: date(2026, apr, 22), status: 'publicado', price: 140 },
    { id: 'ah5', clientId: 'aceite', type: 'community',  title: 'Community management', date: date(2026, apr, 1), status: 'publicado', price: 720 },
    { id: 'ah6', clientId: 'aceite', type: 'herramientas', title: 'Herramientas',   date: date(2026, apr, 1), status: 'publicado', price: 28 },
  ];
}

const WORKS_INIT = makeWorks();

const STATUS = {
  borrador:  { label: 'Borrador',  className: 'badge-warn' },
  aprobado:  { label: 'Aprobado',  className: 'badge-info' },
  publicado: { label: 'Publicado', className: 'badge-ok' }
};

function getType(id) { return WORK_TYPES.find(t => t.id === id); }
function getClient(id) { return CLIENTS.find(c => c.id === id); }

function eur(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function eurFull(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

function worksFor(works, clientId, year, month) {
  return works.filter(w => w.clientId === clientId && w.date.getFullYear() === year && w.date.getMonth() === month);
}

function totalFor(works, clientId, year, month) {
  const client = getClient(clientId);
  const list = worksFor(works, clientId, year, month);
  const variable = list.reduce((s, w) => s + w.price, 0);
  return { retainer: client.monthlyRetainer, variable, total: client.monthlyRetainer + variable, count: list.length };
}

// week key e.g. "S20"
function weekOf(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const diff = (d - onejan + (onejan.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
  return Math.ceil((diff + onejan.getDay() + 1) / 7);
}
function weekRange(d) {
  const day = d.getDay() || 7; // mon=1..sun=7
  const monday = new Date(d); monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => `${x.getDate()} ${MONTH_NAMES[x.getMonth()].slice(0,3).toLowerCase()}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function groupByWeek(list) {
  const groups = {};
  list.forEach(w => {
    const k = weekOf(w.date);
    if (!groups[k]) groups[k] = { week: k, range: weekRange(w.date), items: [] };
    groups[k].items.push(w);
  });
  return Object.values(groups).sort((a, b) => b.week - a.week);
}

Object.assign(window, {
  TODAY, CURRENT_MONTH, MONTH_NAMES, WORK_TYPES, CLIENTS, WORKS_INIT, STATUS,
  getType, getClient, eur, eurFull, worksFor, totalFor, weekOf, weekRange, groupByWeek
});
