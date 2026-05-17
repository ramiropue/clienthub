"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getClient, getWorksForClient, Client, Work } from '@/lib/data';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { WorkRow } from '@/components/shared/work-row';
import { MiniCalendar } from '@/components/shared/mini-calendar';
import { NewWorkModal } from '@/components/admin/new-work-modal';
import { NewClientModal } from '@/components/admin/new-client-modal';
import { supabase } from '@/lib/supabase';
import { eur, STATUS } from '@/lib/mock-data';

// Helper for filtering works
function worksFor(works: Work[], clientId: string, year: number, month: number) {
  return works.filter(w => 
    w.clientId === clientId && 
    w.date.getFullYear() === year && 
    w.date.getMonth() === month
  );
}

// Helper for calculating totals
function totalFor(works: Work[], clientId: string, year: number, month: number, retainer: number) {
  const list = worksFor(works, clientId, year, month);
  const variable = list.reduce((s, w) => s + w.price, 0);
  return {
    retainer,
    variable,
    total: retainer + variable,
    count: list.length
  };
}

// Helper for grouping works by week
function groupByWeek(works: Work[]) {
  const grouped: Record<number, Work[]> = {};
  works.forEach(w => {
    const d = w.date.getDate();
    const week = Math.ceil(d / 7);
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push(w);
  });
  
  return Object.keys(grouped).map(k => {
    const weekNum = parseInt(k, 10);
    const start = (weekNum - 1) * 7 + 1;
    const end = Math.min(weekNum * 7, 31);
    return {
      week: weekNum,
      range: `Del ${start} al ${end}`,
      items: grouped[weekNum].sort((a, b) => b.date.getTime() - a.date.getTime())
    };
  }).sort((a, b) => a.week - b.week);
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;

  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [tab, setTab] = useState('trabajos');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [toast, setToast] = useState('');

  // UI States
  const [currentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('Todo');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [preselectDateForNewWork, setPreselectDateForNewWork] = useState<string | null>(null);
  
  // Notes state
  const [notesState, setNotesState] = useState({ brandTone: '', accessInfo: '', nextMeeting: '', brandToneFileUrl: '' });
  const invoiceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorks();
  }, [clientId]);

  async function loadWorks() {
    try {
      const [c, w] = await Promise.all([getClient(clientId), getWorksForClient(clientId)]);
      setClient(c);
      setWorks(w);
      if (c) {
        setNotesState({
          brandTone: c.brandTone || '',
          accessInfo: c.accessInfo || '',
          nextMeeting: c.nextMeeting || '',
          brandToneFileUrl: c.brandToneFileUrl || ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const updateWorkStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('works').update({ status: newStatus }).eq('id', id);
    if (error) { alert("Error actualizando trabajo"); return; }
    
    setWorks(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
    setToast(`Estado actualizado: ${(STATUS as any)[newStatus]?.label || newStatus}`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleNoteChange = (field: string, value: string) => {
    setNotesState(prev => ({ ...prev, [field]: value }));
  };

  const handleNoteBlur = async (field: string) => {
    if (!client) return;
    const value = notesState[field as keyof typeof notesState];
    const { error } = await supabase.from('clients').update({
       brand_tone: field === 'brandTone' ? value : undefined,
       access_info: field === 'accessInfo' ? value : undefined,
       next_meeting: field === 'nextMeeting' ? value : undefined,
    }).eq('id', clientId);
    
    if (error) {
      setToast('Error guardando nota');
    } else {
      setToast('Nota guardada correctamente');
    }
    setTimeout(() => setToast(''), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    const path = `files/${clientId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage.from('client-logos').upload(path, file);
    if (error) { setToast('Error subiendo archivo'); return; }
    
    const { data } = supabase.storage.from('client-logos').getPublicUrl(path);
    const url = data.publicUrl;
    setNotesState(prev => ({ ...prev, brandToneFileUrl: url }));
    
    await supabase.from('clients').update({ brand_tone_file_url: url }).eq('id', clientId);
    setToast('Archivo adjuntado correctamente');
    setTimeout(() => setToast(''), 2000);
  };

  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth();

  const monthWorksAll = worksFor(works, clientId, currentYear, currentMonthNum).sort((a, b) => b.date.getTime() - a.date.getTime());
  const monthWorksFiltered = monthWorksAll.filter(w => filterStatus === 'Todo' || w.status.toLowerCase() === filterStatus.toLowerCase());
  const groups = groupByWeek(monthWorksFiltered);
  
  const totals = totalFor(works, clientId, currentYear, currentMonthNum, client?.monthlyRetainer || 0);

  const monthsHistory = [
    { y: currentYear, m: currentMonthNum, label: `${MONTH_NAMES[currentMonthNum]} ${currentYear}`, isCurrent: true },
    { y: currentMonthNum === 0 ? currentYear - 1 : currentYear, m: currentMonthNum === 0 ? 11 : currentMonthNum - 1 },
    { y: currentMonthNum <= 1 ? currentYear - 1 : currentYear, m: currentMonthNum <= 1 ? 12 + currentMonthNum - 2 : currentMonthNum - 2 }
  ].map((item, i) => i === 0 ? item : { ...item, label: `${MONTH_NAMES[item.m]} ${item.y}`, isCurrent: false });

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      setToast('Generando PDF...');
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: 15,
        filename: `Factura_${client?.name?.replace(/ /g, '_')}_${MONTH_NAMES[currentMonthNum]}_${currentYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // We temporarily show the element to capture it
      invoiceRef.current.style.display = 'block';

      // Workaround for html2canvas crashing on modern CSS colors like lab()
      // We temporarily remove all stylesheets from the document, render the PDF (since our invoice uses inline styles it works fine), and then restore them.
      const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      const parentMap = new Map();
      styleElements.forEach(el => {
        if (el.parentNode) {
          parentMap.set(el, el.parentNode);
          el.parentNode.removeChild(el);
        }
      });

      await html2pdf().set(opt).from(invoiceRef.current).save();
      
      // Restore styles
      styleElements.forEach(el => {
        const p = parentMap.get(el);
        if (p) p.appendChild(el);
      });

      invoiceRef.current.style.display = 'none';
      setToast('');
    } catch (err) {
      console.error(err);
      setToast('Error al generar PDF');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const openGmail = async () => {
    if (!client) return;
    try {
      setToast('Generando y subiendo PDF para adjuntar...');
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: 15,
        filename: `Factura_${client?.name?.replace(/ /g, '_')}_${MONTH_NAMES[currentMonthNum]}_${currentYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      if (!invoiceRef.current) return;
      invoiceRef.current.style.display = 'block';

      // Workaround for html2canvas
      const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      const parentMap = new Map();
      styleElements.forEach(el => {
        if (el.parentNode) {
          parentMap.set(el, el.parentNode);
          el.parentNode.removeChild(el);
        }
      });

      const pdfBlob = await html2pdf().set(opt).from(invoiceRef.current).output('blob');
      
      // Restore styles
      styleElements.forEach(el => {
        const p = parentMap.get(el);
        if (p) p.appendChild(el);
      });

      invoiceRef.current.style.display = 'none';

      const path = `invoices/${clientId}-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from('client-logos').upload(path, pdfBlob, { contentType: 'application/pdf' });
      if (error) { setToast('Error subiendo PDF'); return; }
      
      const { data } = supabase.storage.from('client-logos').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const text = `Hola! Aquí tienes el resumen de facturación de ${MONTH_NAMES[currentMonthNum]} ${currentYear}. \n\nTotal: ${eur(totals.total)}.\n\nPuedes descargar tu recibo detallado aquí:\n${publicUrl}`;
      const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent(`Resumen Facturación - ${MONTH_NAMES[currentMonthNum]} ${currentYear}`)}&body=${encodeURIComponent(text)}`;
      window.open(mailtoUrl, '_blank');
      setToast('');
    } catch (e) {
      console.error(e);
      setToast('Error al preparar email');
    }
  };

  const openWhatsApp = () => {
    if (!client) return;
    const text = `Hola! Aquí tienes el resumen de facturación de ${MONTH_NAMES[currentMonthNum]} ${currentYear}. Total a facturar: ${eur(totals.total)}.`;
    const phone = client.phone?.replace(/[^0-9]/g, '') || '';
    if (!phone) { alert("Este cliente no tiene un teléfono guardado."); return; }
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;
  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  return (
    <>
      <div>
        <div className="main-header">
          <div className="col gap-2">
            <button onClick={() => router.push('/admin/clients')} className="row gap-2" style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 12, padding: 0, cursor: 'pointer' }}>
              <Icon name="chevron_left" size={14} /> Volver a clientes
            </button>
            <div className="client-header" style={{ padding: 0, border: 0, margin: 0, marginTop: 4 }}>
              <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="xl" logoUrl={client.logoUrl} />
              <div>
                <div className="name">{client.name}</div>
                <div className="sub">{client.handle} · {client.sector} · cliente desde {client.since}</div>
              </div>
            </div>
          </div>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <button className="btn-icon"><Icon name="bell" size={16} /></button>
            
            {/* Three dots dropdown */}
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
                <Icon name="more" size={16} />
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
                  padding: '6px', zIndex: 100, width: 160, boxShadow: 'var(--shadow-lg)'
                }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--ink)' }}
                    onClick={() => { setMenuOpen(false); setModalEditOpen(true); }}
                  >
                    <Icon name="pencil" size={14} /> Editar cliente
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--warn)', marginTop: 2 }}
                    onClick={() => { setMenuOpen(false); alert("Función de eliminar próximamente") }}
                  >
                    <Icon name="trash" size={14} /> Eliminar
                  </button>
                </div>
              )}
            </div>

            <ButtonCustom variant="accent" icon="plus" onClick={() => setModalOpen(true)}>Añadir trabajo</ButtonCustom>
          </div>
        </div>

        <div className="main-content">
          <div className="tabs">
            <div className={`tab ${tab === 'trabajos' ? 'active' : ''}`} onClick={() => setTab('trabajos')}>
              Trabajos del mes <span className="badge badge-muted" style={{ marginLeft: 6 }}>{monthWorksAll.length}</span>
            </div>
            <div className={`tab ${tab === 'calendario' ? 'active' : ''}`} onClick={() => setTab('calendario')}>Calendario</div>
            <div className={`tab ${tab === 'historico' ? 'active' : ''}`} onClick={() => setTab('historico')}>Histórico</div>
            <div className={`tab ${tab === 'notas' ? 'active' : ''}`} onClick={() => setTab('notas')}>Notas</div>
          </div>

          <div className="detail-grid">
            <div>
              {tab === 'trabajos' && (
                <>
                  <div className="row between mb-4" style={{ alignItems: 'center' }}>
                    <div className="pills">
                      {['Todo', 'Borrador', 'Aprobado', 'Publicado'].map(s => (
                        <span 
                          key={s} 
                          className={`pill ${filterStatus === s ? 'active' : ''}`}
                          onClick={() => setFilterStatus(s)}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="segment">
                      <button className="active">Mes</button>
                      <button>Semana</button>
                    </div>
                  </div>

                  {groups.length === 0 ? (
                    <div className="placeholder card card-pad">No hay trabajos con el filtro actual</div>
                  ) : (
                    groups.map(g => (
                      <div className="week-group" key={g.week}>
                        <div className="week-head">
                          <div className="label">Semana {g.week}</div>
                          <div className="range">{g.range}</div>
                        </div>
                        <div className="work-list">
                          {g.items.map((w: any) => (
                            <WorkRow
                              key={w.id}
                              work={w}
                              onClick={() => {
                                router.push(`/admin/work/${w.id}`);
                              }}
                              onStatusChange={(newStatus: string) => updateWorkStatus(w.id, newStatus)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {tab === 'calendario' && (
                <div className="card card-pad">
                  <div className="row between mb-4" style={{ alignItems: 'baseline' }}>
                    <div>
                      <h3 className="h3 m-0">{MONTH_NAMES[currentMonthNum]} {currentYear}</h3>
                      <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{monthWorksAll.length} piezas programadas</div>
                    </div>
                    <div className="segment">
                      <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Mes</button>
                      <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Semana</button>
                    </div>
                  </div>
                  <MiniCalendar 
                    year={currentYear} 
                    month={currentMonthNum} 
                    works={works.filter(w => w.type !== 'herramientas')} 
                    onPickDay={(d) => setSelectedCalendarDate(d)}
                    viewMode={viewMode}
                  />
                  <div className="row gap-4 mt-6" style={{ fontSize: 12 }}>
                    <span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--warn)' }} /> Borrador</span>
                    <span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} /> Aprobado</span>
                    <span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ok)' }} /> Publicado</span>
                  </div>
                  
                  {selectedCalendarDate && (
                    <div className="modal-overlay" onClick={() => setSelectedCalendarDate(null)}>
                      <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
                        <div className="row between mb-4">
                          <h3 className="h3 m-0">Trabajos del {selectedCalendarDate.getDate()} de {MONTH_NAMES[selectedCalendarDate.getMonth()]} de {selectedCalendarDate.getFullYear()}</h3>
                          <button className="btn-icon" onClick={() => setSelectedCalendarDate(null)}><Icon name="x" size={20} /></button>
                        </div>
                        
                        <div className="mb-4">
                          <ButtonCustom 
                            variant="primary" 
                            icon="plus" 
                            onClick={() => {
                              setPreselectDateForNewWork(`${selectedCalendarDate.getFullYear()}-${(selectedCalendarDate.getMonth()+1).toString().padStart(2,'0')}-${selectedCalendarDate.getDate().toString().padStart(2,'0')}`);
                              setModalOpen(true);
                            }}
                            style={{ width: '100%' }}
                          >
                            Añadir trabajo
                          </ButtonCustom>
                        </div>

                        <div className="work-list" style={{ border: 'none', background: 'transparent' }}>
                          {works.filter(w => w.type !== 'herramientas' && w.date.getDate() === selectedCalendarDate.getDate() && w.date.getMonth() === selectedCalendarDate.getMonth() && w.date.getFullYear() === selectedCalendarDate.getFullYear()).map(w => (
                            <WorkRow
                              key={w.id}
                              work={w}
                              onClick={() => router.push(`/admin/work/${w.id}`)}
                              onStatusChange={(newStatus: string) => updateWorkStatus(w.id, newStatus)}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'historico' && (
                <div className="card" style={{ overflow: 'hidden' }}>
                  {monthsHistory.map(m => {
                    const t = totalFor(works, clientId, m.y, m.m, client.monthlyRetainer);
                    return (
                      <div key={m.label} className="history-row fade-in" style={{ padding: '18px 22px' }}>
                        <div className="col" style={{ gap: 2, flex: 1 }}>
                          <div className="h-month">{m.label}</div>
                          <div className="h-meta">{t.count} piezas · iguala {eur(t.retainer)}</div>
                        </div>
                        {m.isCurrent && <span className="badge badge-accent"><span className="dot" /> En curso</span>}
                        <div className="h-amount">{eur(t.total)}</div>
                        <Icon name="chevron_right" size={16} className="h-arrow" />
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'notas' && (
                <div className="card card-pad">
                  <div className="eyebrow mb-2">Notas internas (editables)</div>
                  <div className="col gap-4 mt-4">
                    <div className="field">
                      <div className="row between" style={{ alignItems: 'baseline' }}>
                        <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Branding</label>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '2px 8px', fontSize: 11 }}
                        >
                          <Icon name="link" size={12} /> Adjuntar guía
                        </button>
                        <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                      </div>
                      <textarea 
                        className="textarea" 
                        placeholder="Ej. Cercano, sin tecnicismos..."
                        value={notesState.brandTone}
                        onChange={e => handleNoteChange('brandTone', e.target.value)}
                        onBlur={() => handleNoteBlur('brandTone')}
                        style={{ minHeight: 60 }}
                      />
                      {notesState.brandToneFileUrl && (
                        <div className="mt-2 row gap-2" style={{ fontSize: 12 }}>
                          <Icon name="document" size={14} className="text-accent" />
                          <a href={notesState.brandToneFileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Ver documento adjunto</a>
                        </div>
                      )}
                    </div>
                    
                    <div className="divider" />
                    
                    <div className="field">
                      <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Accesos & contraseñas</label>
                      <textarea 
                        className="textarea" 
                        placeholder="Ej. Instagram: vía Meta Business Suite..."
                        value={notesState.accessInfo}
                        onChange={e => handleNoteChange('accessInfo', e.target.value)}
                        onBlur={() => handleNoteBlur('accessInfo')}
                        style={{ minHeight: 60 }}
                      />
                    </div>
                    
                    <div className="divider" />
                    
                    <div className="field">
                      <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Próxima reunión (vinculado a calendario)</label>
                      <input 
                        type="date"
                        className="input" 
                        value={notesState.nextMeeting}
                        onChange={e => handleNoteChange('nextMeeting', e.target.value)}
                        onBlur={() => handleNoteBlur('nextMeeting')}
                        style={{ maxWidth: 220 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: invoice summary */}
            <div className="invoice-card">
              <div className="eyebrow">Facturación · {MONTH_NAMES[currentMonthNum]} {currentYear}</div>
              <div className="total">
                {eur(totals.total).replace('€','')}<em>€</em>
              </div>
              <div className="total-sub">{totals.count} trabajos + iguala mensual</div>

              <div className="line-item">
                <span className="label">{client.retainerLabel || 'Iguala'}</span>
                <span className="amount">{eur(totals.retainer)}</span>
              </div>
              <div className="line-item">
                <span className="label">Trabajos extra</span>
                <span className="amount">{eur(totals.variable)}</span>
              </div>
              <div className="line-item total-line">
                <span className="label">Total a facturar</span>
                <span className="amount">{eur(totals.total)}</span>
              </div>

              <div className="actions">
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={handleDownloadPDF}><Icon name="download" size={13} /> PDF</button>
                <div style={{ position: 'relative', display: 'flex', flex: 1, gap: 4 }}>
                  <button className="btn btn-accent btn-sm" style={{ flex: 1, padding: '0 4px' }} onClick={openGmail}>
                    <Icon name="mail" size={13} /> Gmail
                  </button>
                  <button className="btn btn-accent btn-sm" style={{ flex: 1, padding: '0 4px' }} onClick={openWhatsApp}>
                    <Icon name="chat" size={13} /> Wsp
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                {monthsHistory.slice(1).map(m => (
                  <div key={m.label} className="row between mt-2" style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                    <span>{m.label}</span>
                    <span className="mono">{eur(totalFor(works, clientId, m.y, m.m, client.monthlyRetainer).total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Invoice Template for PDF generation */}
      <div style={{ display: 'none' }}>
        <div ref={invoiceRef} style={{ width: '800px', padding: '60px', background: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px', alignItems: 'flex-start' }}>
            <div>
              <strong style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>Antía Vázquez</strong>
              <div style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                Social media & estrategia<br />
                hola@antiav.studio
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Facturado a</div>
              <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>{client.name}</strong>
              <div style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                {client.handle}<br />
                {client.email}<br/>
                {client.phone && <span>{client.phone}</span>}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 8px 0', fontWeight: 600 }}>Recibo</h1>
            <div style={{ fontSize: '16px', color: '#555' }}>Periodo: {MONTH_NAMES[currentMonthNum]} {currentYear}</div>
            <div style={{ fontSize: '14px', color: '#777', marginTop: '4px' }}>N.º 2026-05-{client.id.slice(0, 4)}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 0', borderBottom: '2px solid #222', textAlign: 'left', fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px' }}>Concepto</th>
                <th style={{ padding: '12px 0', borderBottom: '2px solid #222', textAlign: 'right', fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', width: '80px' }}>Cant.</th>
                <th style={{ padding: '12px 0', borderBottom: '2px solid #222', textAlign: 'right', fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', width: '120px' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {/* Retainer Line */}
              <tr>
                <td style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 500, fontSize: '15px' }}>{client.retainerLabel || 'Iguala mensual'}</div>
                  <div style={{ color: '#777', fontSize: '13px', marginTop: '4px' }}>Cuota fija acordada</div>
                </td>
                <td style={{ padding: '20px 0', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '15px' }}>1</td>
                <td style={{ padding: '20px 0', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '15px', fontWeight: 500 }}>{eur(totals.retainer)}</td>
              </tr>
              
              {/* Extra works grouped by title or just individually? The design groups by type, but we can list them individually or as "Trabajos extra" */}
              {monthWorksAll.length > 0 && (
                <tr>
                  <td style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 500, fontSize: '15px' }}>Trabajos Extra / Piezas del mes</div>
                    <div style={{ color: '#777', fontSize: '13px', marginTop: '4px' }}>
                      {monthWorksAll.slice(0, 5).map(w => w.title).join(' · ')}{monthWorksAll.length > 5 ? '...' : ''}
                    </div>
                  </td>
                  <td style={{ padding: '20px 0', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '15px' }}>{totals.count}</td>
                  <td style={{ padding: '20px 0', borderBottom: '1px solid #eee', textAlign: 'right', fontSize: '15px', fontWeight: 500 }}>{eur(totals.variable)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #222', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', fontWeight: 600 }}>Total a pagar</span>
                <span style={{ fontSize: '32px', fontWeight: 600 }}>{eur(totals.total)}</span>
              </div>
              <div style={{ color: '#777', fontSize: '12px', textAlign: 'right', marginTop: '8px' }}>
                Pago en metálico a la entrega / fin de mes.
              </div>
            </div>
          </div>
        </div>
      </div>

      {client && (
        <NewWorkModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setPreselectDateForNewWork(null);
          }}
          clients={[client]}
          preselectClientId={clientId}
          preselectDate={preselectDateForNewWork}
          onCreated={() => {
            loadWorks();
            setPreselectDateForNewWork(null);
          }}
        />
      )}
      
      {client && (
        <NewClientModal
          open={modalEditOpen}
          onClose={() => setModalEditOpen(false)}
          onCreated={loadWorks}
          initialData={client}
        />
      )}
      
      {toast && (
        <div className="toast">
          <span className="toast-dot" /> {toast}
        </div>
      )}
    </>
  );
}
