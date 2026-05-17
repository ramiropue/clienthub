"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/lib/supabase';
import { Client, getWorkTypes, WorkType } from '@/lib/data';
import { STATUS, eur } from '@/lib/mock-data';
import { useGooglePicker } from '@/hooks/use-google-picker';

interface NewWorkModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  preselectClientId?: string | null;
  preselectDate?: string | null;
  onCreated: () => void; // callback to refresh parent data
}

const today = new Date().toISOString().split('T')[0];

export function NewWorkModal({ open, onClose, clients, preselectClientId, preselectDate, onCreated }: NewWorkModalProps) {
  const [clientId, setClientId] = useState(preselectClientId || clients[0]?.id || '');
  const [typeId, setTypeId]     = useState('reel');
  const [title, setTitle]       = useState('');
  const [date, setDate]         = useState(preselectDate || today);
  const [status, setStatus]     = useState<'borrador' | 'aprobado' | 'publicado'>('aprobado');
  const [notes, setNotes]       = useState('');
  const [price, setPrice]       = useState(65);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  // Fetch work types
  useEffect(() => {
    getWorkTypes().then(setWorkTypes);
  }, []);

  // Update clientId if preselectClientId changes
  useEffect(() => {
    if (preselectClientId) setClientId(preselectClientId);
    else if (clients[0]?.id) setClientId(clients[0].id);
  }, [preselectClientId, clients]);

  // Auto-set price when work type changes
  useEffect(() => {
    const t = workTypes.find(w => w.id === typeId);
    if (t) setPrice(t.price);
  }, [typeId, workTypes]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setNotes('');
      setStatus('aprobado');
      setDate(preselectDate || today);
      setError('');
      setPreviewUrl(null);
      setPreviewName(null);
      setPreviewIcon(null);
      setPickerError(null);
    }
  }, [open]);

  const handlePick = useCallback((file: { id: string; name: string; url: string; mimeType: string; iconUrl: string }) => {
    setPreviewUrl(file.url);
    setPreviewName(file.name);
    setPreviewIcon(file.iconUrl);
    setPickerError(null);
  }, []);

  const { openPicker } = useGooglePicker({ onPick: handlePick, onError: setPickerError });

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
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('works').insert({
      id: 'w-' + Date.now(),
      client_id: clientId,
      type: typeId,
      title: title.trim() || (type?.name ?? typeId),
      date,
      status: finalStatus,
      price,
      notes: notes.trim() || null,
      preview_url: previewUrl || null,
    });

    setSaving(false);

    if (err) {
      setError('Error al guardar: ' + err.message);
      return;
    }

    onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Head ── */}
        <div className="modal-head">
          <div>
            <h2>Nuevo trabajo</h2>
            <div className="sub">Registra una pieza para añadir a la facturación del mes.</div>
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

            {/* Adjunto */}
            <div className="field">
              <label>Adjuntar previsualización</label>

              {previewUrl ? (
                /* ── File selected ── */
                <div
                  className="drop-zone"
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    gap: 10,
                    cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    {previewIcon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewIcon} alt="" width={18} height={18} style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {previewName}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label="Quitar archivo"
                    onClick={() => { setPreviewUrl(null); setPreviewName(null); setPreviewIcon(null); }}
                    style={{ flexShrink: 0 }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ) : (
                /* ── Empty drop-zone — click to open Drive picker ── */
                <div
                  className="drop-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Seleccionar archivo de Google Drive"
                  onClick={openPicker}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker(); }}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon name="image" size={20} /><br />
                  <span>
                    Arrastra una imagen o{' '}
                    <strong style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      busca un archivo en Drive
                    </strong>
                  </span>
                  <br />
                  <span style={{ fontSize: 11 }}>JPG, PNG, MP4, PDF</span>
                </div>
              )}

              {pickerError && (
                <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{pickerError}</p>
              )}
            </div>

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

        {/* ── Footer ── */}
        <div className="modal-foot">
          <ButtonCustom variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonCustom>
          <ButtonCustom
            variant="primary"
            onClick={() => handleSubmit('borrador')}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar borrador'}
          </ButtonCustom>
          <ButtonCustom
            variant="accent"
            icon="check"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Añadir trabajo'}
          </ButtonCustom>
        </div>
      </div>
    </div>
  );
}
