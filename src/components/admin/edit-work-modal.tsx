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
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingObjectives, setMeetingObjectives] = useState('');
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
      setStatus(work.status);
      setPrice(work.price);
      setError('');
      
      const workDateObj = new Date(work.date);
      const offset = workDateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(workDateObj.getTime() - offset)).toISOString().split('T')[0];
      setDate(localISOTime);

      let initialNotes = work.notes || '';
      let mTime = '';
      let mLocation = '';
      let mLink = '';
      let mObjectives = '';

      if (work.type === 'reunion') {
        const timeMatch = initialNotes.match(/\*\*Hora:\*\* (.*)/);
        if (timeMatch) {
          mTime = timeMatch[1].trim();
        } else {
          const hours = workDateObj.getHours();
          const minutes = workDateObj.getMinutes();
          if (hours !== 0 || minutes !== 0) {
            mTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }

        const locMatch = initialNotes.match(/\*\*Ubicación:\*\* (.*)/);
        if (locMatch) mLocation = locMatch[1].trim();

        const linkMatch = initialNotes.match(/\*\*Enlace:\*\* (.*)/);
        if (linkMatch) mLink = linkMatch[1].trim();

        const objMatch = initialNotes.match(/\*\*Objetivos:\*\*\n([\s\S]*?)(?=\n\n---|$)/);
        if (objMatch) mObjectives = objMatch[1].trim();

        initialNotes = initialNotes.replace(/\*\*Hora:\*\* .*\n?/g, '');
        initialNotes = initialNotes.replace(/\*\*Ubicación:\*\* .*\n?/g, '');
        initialNotes = initialNotes.replace(/\*\*Enlace:\*\* .*\n?/g, '');
        initialNotes = initialNotes.replace(/\*\*Objetivos:\*\*\n([\s\S]*?)(?=\n\n---|$)\n?/g, '');
        initialNotes = initialNotes.replace(/^---\n/, '').trim();
      }

      setNotes(initialNotes);
      setMeetingTime(mTime);
      setMeetingLocation(mLocation);
      setMeetingLink(mLink);
      setMeetingObjectives(mObjectives);
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

    let finalNotes = notes.trim() || null;
    let finalDate = date;

    if (typeId === 'reunion') {
      if (meetingTime.trim() && date) {
        const [y, m, d] = date.split('-').map(Number);
        const [H, M] = meetingTime.split(':').map(Number);
        finalDate = new Date(y, m - 1, d, H, M).toISOString();
      }
      const meetingDetails = [];
      if (meetingTime.trim()) meetingDetails.push(`**Hora:** ${meetingTime.trim()}`);
      if (meetingLocation.trim()) meetingDetails.push(`**Ubicación:** ${meetingLocation.trim()}`);
      if (meetingLink.trim()) meetingDetails.push(`**Enlace:** ${meetingLink.trim()}`);
      if (meetingObjectives.trim()) meetingDetails.push(`**Objetivos:**\n${meetingObjectives.trim()}`);
      
      if (meetingDetails.length > 0) {
        finalNotes = meetingDetails.join('\n\n') + (finalNotes ? `\n\n---\n${finalNotes}` : '');
      }
    }

    const { error: err } = await supabase.from('works').update({
      client_id: clientId,
      type: typeId,
      title: workTitle,
      date: finalDate,
      status: finalStatus,
      price,
      notes: finalNotes,
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

            {/* Campos extra si es reunión */}
            {typeId === 'reunion' && (
              <div className="col gap-4">
                <div className="row gap-4">
                  <div className="field flex-1">
                    <label>Hora de inicio</label>
                    <input
                      type="time"
                      className="input"
                      value={meetingTime}
                      onChange={e => setMeetingTime(e.target.value)}
                    />
                  </div>
                  <div className="field flex-1">
                    <label>Ubicación</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Dirección, sala..."
                      value={meetingLocation}
                      onChange={e => setMeetingLocation(e.target.value)}
                    />
                  </div>
                  <div className="field flex-1">
                    <label>Enlace web</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Zoom, Meet..."
                      value={meetingLink}
                      onChange={e => setMeetingLink(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Objetivos de la reunión</label>
                  <textarea
                    className="textarea"
                    placeholder="Escribe los puntos a tratar..."
                    value={meetingObjectives}
                    onChange={e => setMeetingObjectives(e.target.value)}
                    style={{ minHeight: 80 }}
                  />
                </div>
              </div>
            )}

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
