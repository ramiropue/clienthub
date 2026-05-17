"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { StatusBadge } from '@/components/ui/status-badge';
import { eur, STATUS, getType } from '@/lib/mock-data';
import { Work, Client, getClient } from '@/lib/data';

export default function AdminWorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const workId = unwrappedParams.id;

  const [work, setWork] = useState<Work | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Editable fields
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [workId]);

  async function loadData() {
    try {
      const { data: w } = await supabase.from('works').select('*').eq('id', workId).single();
      if (w) {
        const mappedWork = {
          ...w,
          clientId: w.client_id,
          date: new Date(w.date)
        };
        setWork(mappedWork);
        setNotes(mappedWork.notes || '');
        const c = await getClient(mappedWork.clientId);
        setClient(c);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!work) return;
    const { error } = await supabase.from('works').update({ status: newStatus }).eq('id', work.id);
    if (!error) {
      setWork({ ...work, status: newStatus });
      setToast('Estado actualizado');
      setTimeout(() => setToast(''), 2000);
    }
  };

  const handleSaveNotes = async () => {
    if (!work) return;
    setSaving(true);
    const { error } = await supabase.from('works').update({ notes }).eq('id', work.id);
    setSaving(false);
    if (!error) {
      setToast('Notas guardadas');
      setTimeout(() => setToast(''), 2000);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Cargando trabajo...</div>;
  if (!work) return <div style={{ padding: 40 }}>Trabajo no encontrado</div>;

  const typeDef = getType(work.type);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <button 
        onClick={() => router.push(`/admin/client/${work.clientId}`)} 
        className="row gap-2 mb-6" 
        style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 13, padding: 0, cursor: 'pointer' }}
      >
        <Icon name="chevron_left" size={14} /> Volver a {client?.name || 'cliente'}
      </button>

      <div className="card card-pad fade-in">
        <div className="row between mb-6" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="row gap-2 mb-2">
              <span className="badge" style={{ background: 'var(--card-hover)' }}>{typeDef?.name}</span>
              <StatusBadge status={work.status} />
            </div>
            <h1 className="h2 m-0">{work.title}</h1>
            <div className="text-muted mt-2">
              Programado para: {work.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted" style={{ fontSize: 13 }}>Importe</div>
            <div className="h3 m-0" style={{ color: 'var(--accent)' }}>{eur(work.price)}</div>
          </div>
        </div>

        <div className="divider mb-6" />

        <div className="mb-6">
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Cambiar estado</label>
          <div className="row gap-3">
            {['borrador', 'aprobado', 'publicado'].map(s => (
              <button 
                key={s}
                className={`btn ${work.status === s ? 'btn-accent' : 'btn-outline'}`}
                onClick={() => handleUpdateStatus(s)}
              >
                {STATUS[s as keyof typeof STATUS]?.label || s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Notas / Instrucciones del trabajo</label>
          <textarea 
            className="textarea" 
            placeholder="Escribe aquí notas sobre este trabajo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: 120 }}
          />
          <div className="row end mt-3">
            <ButtonCustom variant="accent" onClick={handleSaveNotes} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar notas'}
            </ButtonCustom>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast">
          <span className="toast-dot" /> {toast}
        </div>
      )}
    </div>
  );
}
