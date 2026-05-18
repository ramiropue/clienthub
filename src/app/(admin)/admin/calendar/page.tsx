"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, getWorks, Client, Work } from '@/lib/data';
import { MiniCalendar } from '@/components/shared/mini-calendar';
import { Icon } from '@/components/ui/icon';
import { WorkRow } from '@/components/shared/work-row';
import { supabase } from '@/lib/supabase';
import { NewWorkModal } from '@/components/admin/new-work-modal';
import { ButtonCustom } from '@/components/ui/button-custom';
import { AvatarCustom } from '@/components/ui/avatar-custom';

export default function AdminCalendarPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showNewWorkModal, setShowNewWorkModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [c, w] = await Promise.all([getClients(), getWorks()]);
    setClients(c);
    setWorks(w);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateWorkStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('works').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setWorks(works.map(w => w.id === id ? { ...w, status: newStatus } : w));
    }
  };

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;

  const monthWorks = works.filter(w => w.date.getFullYear() === 2026 && w.date.getMonth() === 4);

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Calendario editorial</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>Mayo 2026</h1>
        </div>
        <div className="row gap-2">
          <div className="segment">
            <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Mes</button>
            <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Semana</button>
          </div>
        </div>
      </div>
      <div className="main-content row gap-6" style={{ alignItems: 'flex-start' }}>
        <div className="card card-pad" style={{ flex: 1, position: 'sticky', top: 24 }}>
          <MiniCalendar 
            year={2026} 
            month={4} 
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
              <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="row between mb-4">
                  <h3 className="h3 m-0">Trabajos del {selectedCalendarDate.getDate()} de {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][selectedCalendarDate.getMonth()]} de {selectedCalendarDate.getFullYear()}</h3>
                  <button className="btn-icon" onClick={() => setSelectedCalendarDate(null)}><Icon name="close" size={20} /></button>
                </div>
                
                <div className="mb-4">
                  <ButtonCustom 
                    variant="primary" 
                    icon="plus" 
                    onClick={() => {
                      setShowNewWorkModal(true);
                    }}
                    style={{ width: '100%' }}
                  >
                    Añadir trabajo
                  </ButtonCustom>
                </div>

                <div className="work-list" style={{ border: 'none', background: 'transparent' }}>
                  {works
                    .filter(w => w.type !== 'herramientas' && w.date.getDate() === selectedCalendarDate.getDate() && w.date.getMonth() === selectedCalendarDate.getMonth() && w.date.getFullYear() === selectedCalendarDate.getFullYear())
                    .map(w => {
                      const client = clients.find(c => c.id === w.clientId);
                      return (
                        <div key={w.id} className="mb-4">
                          <div 
                            className="row gap-2 mb-2" 
                            style={{ fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                            onClick={() => router.push(`/admin/client/${client?.id}`)}
                          >
                            {client && <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="sm" logoUrl={client.logoUrl} />}
                            {client?.name || 'Cliente desconocido'}
                          </div>
                          <WorkRow
                            work={w}
                            onClick={() => router.push(`/admin/work/${w.id}`)}
                            onStatusChange={(newStatus: string) => updateWorkStatus(w.id, newStatus)}
                            compact
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="col gap-4" style={{ flex: 1 }}>
          {clients.map(c => {
            const list = monthWorks.filter(w => w.clientId === c.id);
            return (
              <div 
                key={c.id} 
                className="card card-pad" 
                style={{ cursor: 'pointer' }} 
                onClick={() => router.push(`/admin/client/${c.id}`)}
              >
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <AvatarCustom name={c.name} color={c.color} initials={c.initials} />
                  <div className="flex-1">
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{list.length} piezas en mayo</div>
                  </div>
                  <Icon name="chevron_right" size={16} className="text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewWorkModal
        open={showNewWorkModal}
        onClose={() => setShowNewWorkModal(false)}
        clients={clients}
        preselectDate={selectedCalendarDate ? `${selectedCalendarDate.getFullYear()}-${(selectedCalendarDate.getMonth()+1).toString().padStart(2,'0')}-${selectedCalendarDate.getDate().toString().padStart(2,'0')}` : null}
        onCreated={() => {
          setShowNewWorkModal(false);
          fetchAll();
        }}
      />
    </div>
  );
}
