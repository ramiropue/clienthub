"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/lib/supabase';
import { Client, getWorkTypes, WorkType, createNotification } from '@/lib/data';
import { STATUS, eur } from '@/lib/mock-data';

interface EditWorkModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  work: any;
  onUpdated: () => void;
}

export function EditWorkModal({ open, onClose, clients, work, onUpdated }: EditWorkModalProps) {
  const [clientId, setClientId] = useState(work?.clientId || clients[0]?.id || '');
  const [typeId, setTypeId]     = useState(work?.type || 'reel');
  const [title, setTitle]       = useState(work?.title || '');
  const [date, setDate]         = useState(work ? new Date(work.date).toISOString().split('T')[0] : '');
  const [status, setStatus]     = useState(work?.status || 'borrador');
  const [notes, setNotes]       = useState(work?.notes || '');
  const [price, setPrice]       = useState(work?.price || 65);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  // Fetch work types
  useEffect(() => {
    getWorkTypes().then(setWorkTypes);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (open && work) {
      setClientId(work.clientId);
      setTypeId(work.type);
      setTitle(work.title);
      setNotes(work.notes || '');
      setStatus(work.status);
      setDate(new Date(work.date).toISOString().split('T')[0]);
      setPrice(work.price);
      setError('');
    }
  }, [open, work]);



  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (overrideStatus?: 'borrador' | 'aprobado' | 'publicado') => {
    const finalStatus = overrideStatus || status;
    const type = workTypes.find(w => w.id === typeId);
    const workTitle = title.trim() || (type?.name ?? typeId);
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('works').update({
      client_id: clientId,
      type: typeId,
      title: workTitle,
      date,
      status: finalStatus,
      price,
      notes: notes.trim() || null,
    }).eq('id', work.id);

    setSaving(false);

    if (err) {
      setError('Error al actualizar: ' + err.message);
      return;
    }

    onUpdated();
    onClose();
  };



  const selectedType = workTypes.find(w => w.id === typeId);
  const isContenido = !selectedType || selectedType.group === 'contenido';

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Head ── */}
        <div className="modal-head">
          <div>
            <h2>Editar trabajo</h2>
            <div className="sub">Modifica los detalles de este trabajo.</div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body">
          <div className="col gap-4">

            {/* Cliente */}
            <div className="field">
              <label>Cliente</label>
              <div className="row gap-2">
                {clients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClientId(c.id)}
                    className="btn"
                    style={{
                      background: clientId === c.id ? 'var(--ink)' : 'var(--card)',
                      color: clientId === c.id ? '#fff' : 'var(--ink)',
                      border: '1px solid ' + (clientId === c.id ? 'var(--ink)' : 'var(--line)'),
                      flex: 1,
                      justifyContent: 'flex-start',
                      padding: '8px 12px'
                    }}
                  >
                    <AvatarCustom name={c.name} color={c.color} initials={c.initials} size="sm" />
                    <span style={{ fontSize: 13 }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de trabajo */}
            <div className="field">
              <label>Tipo de trabajo</label>
              <div className="type-grid">
                {workTypes.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`type-card ${typeId === t.id ? 'selected' : ''}`}
                    onClick={() => setTypeId(t.id)}
                  >
                    <div className="row gap-2">
                      <Icon name={t.icon} size={14} />
                      <span className="t-name">{t.name}</span>
                    </div>
                    <span className="t-price">{eur(t.price)} / {t.unit}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div className="field">
              <label>Título / descripción</label>
              <input
                className="input"
                placeholder="Ej. Reel rutina matinal — 30s"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Fecha y precio */}
            <div className="row gap-3">
              <div className="field flex-1">
                <label>Fecha publicación</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="field flex-1">
                <label>Precio (€)</label>
                <input
                  className="input mono"
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            {/* Estado */}
            {isContenido && (
              <div className="field">
                <label>Estado</label>
                <div className="status-picker">
                  {(Object.entries(STATUS) as [string, { label: string; className: string }][]).map(([k, s]) => (
                    <span
                      key={k}
                      className={`badge ${s.className} ${status === k ? 'selected' : ''}`}
                      onClick={() => setStatus(k as 'borrador' | 'aprobado' | 'publicado')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="dot" /> {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}



            {/* Notas */}
            <div className="field">
              <label>Notas para el cliente</label>
              <textarea
                className="textarea"
                placeholder="Opcional: contexto, ideas, links…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 4 }}>{error}</div>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <ButtonCustom type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonCustom>
          <ButtonCustom
            type="button"
            variant="accent"
            icon="check"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </ButtonCustom>
        </div>
      </div>
    </div>
  );
}
