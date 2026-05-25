"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/lib/supabase';
import { Client, getWorkTypes, WorkType, createNotification } from '@/lib/data';
import { STATUS, eur } from '@/lib/mock-data';

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
  const [status, setStatus]     = useState<'borrador' | 'aprobado' | 'publicado'>('borrador');
  const [notes, setNotes]       = useState('');
  const [scriptText, setScriptText] = useState('');
  const [scriptLink, setScriptLink] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingObjectives, setMeetingObjectives] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice]       = useState(65);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  // Fetch work types
  useEffect(() => {
    getWorkTypes(false).then(setWorkTypes);
  }, []);

  // Update clientId if preselectClientId changes
  useEffect(() => {
    if (preselectClientId) setClientId(preselectClientId);
    else if (clients[0]?.id) setClientId(clients[0].id);
  }, [preselectClientId, clients]);

  // Auto-set price when work type changes
  useEffect(() => {
    const t = workTypes.find(w => w.id === typeId);
    if (t) {
      if (t.unit.toLowerCase().startsWith('hora') || t.unit.toLowerCase() === 'h') {
        setPrice(t.price * quantity);
      } else {
        setPrice(t.price);
        if (quantity !== 1) setQuantity(1);
      }
    }
  }, [typeId, workTypes, quantity]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setNotes('');
      setScriptText('');
      setScriptLink('');
      setMeetingTime('');
      setMeetingLocation('');
      setMeetingLink('');
      setMeetingObjectives('');
      setStatus('borrador');
      setDate(preselectDate || today);
      setError('');
      setAttachments([]);
      setLinkInputOpen(false);
      setLinkUrl('');
      setLinkName('');
      setUploadError(null);
      setQuantity(1);
    }
  }, [open]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const path = `works/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage.from('client-logos').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('client-logos').getPublicUrl(path);
      
      const newAtt = { id: Date.now().toString(), name: file.name, url: data.publicUrl, type: 'file' };
      setAttachments(prev => [...prev, newAtt]);
    } catch (err: any) {
      setUploadError('Error subiendo archivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    let finalUrl = linkUrl.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    const newAtt = { 
      id: Date.now().toString(), 
      name: linkName.trim() || 'Enlace externo', 
      url: finalUrl, 
      type: 'link' 
    };
    setAttachments(prev => [...prev, newAtt]);
    setLinkUrl('');
    setLinkName('');
    setLinkInputOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

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
    const newWorkId = 'w-' + Date.now();
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

    const { error: err } = await supabase.from('works').insert({
      id: newWorkId,
      client_id: clientId,
      type: typeId,
      title: workTitle,
      date: finalDate,
      status: finalStatus,
      price,
      quantity,
      notes: finalNotes,
      preview_url: attachments.length > 0 || scriptText.trim() || scriptLink.trim() ? JSON.stringify([
        ...(scriptText.trim() ? [{ id: 'script-text-' + Date.now(), name: 'Guion / Propuesta (Texto)', type: 'text', content: scriptText.trim() }] : []),
        ...(scriptLink.trim() ? [{ id: 'script-link-' + Date.now(), name: 'Guion / Propuesta (Documento)', type: 'link', url: scriptLink.trim().startsWith('http') ? scriptLink.trim() : 'https://' + scriptLink.trim() }] : []),
        ...attachments
      ]) : null,
    });

    setSaving(false);

    if (err) {
      setError('Error al guardar: ' + err.message);
      return;
    }

    // Notify client: new work created for them
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient && type?.group === 'contenido') {
      await createNotification({
        clientId,
        recipient: 'client',
        title: '📌 Nueva pieza programada',
        message: `"${workTitle}" ha sido añadida a tu calendario para revisar.`,
        type: 'nuevo_trabajo',
        workId: newWorkId,
      });
    }

    onCreated();
    onClose();
  };

  const selectedType = workTypes.find(w => w.id === typeId);
  const isContenido = !selectedType || selectedType.group === 'contenido' || selectedType.id === 'puntual';

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
                    <span className="t-price">{t.id === 'puntual' ? 'Personalizado' : `${eur(t.price)} / ${t.unit}`}</span>
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
              {(selectedType?.unit.toLowerCase().startsWith('hora') || selectedType?.unit.toLowerCase() === 'h') && (
                <div className="field flex-1">
                  <label>Horas trabajadas</label>
                  <input
                    className="input mono"
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) || 1)}
                    min={0.5}
                    step={0.5}
                  />
                </div>
              )}
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
                <label>{(selectedType?.unit.toLowerCase().startsWith('hora') || selectedType?.unit.toLowerCase() === 'h') ? 'Precio Total (€)' : 'Precio (€)'}</label>
                <input
                  className="input mono"
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value) || 0)}
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

            {/* Adjuntos */}
            <div className="field">
              <label>Archivos y enlaces adjuntos</label>

              {attachments.length > 0 && (
                <div className="col gap-3 mb-4">
                  {attachments.map(att => {
                    const isVid = att.type === 'file' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(att.url);
                    const isImg = att.type === 'file' && /\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i.test(att.url);

                    return (
                      <div key={att.id} style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                        {isVid ? (
                          <video src={att.url} controls playsInline style={{ width: '100%', aspectRatio: '16/9', objectFit: 'contain', background: '#000' }} />
                        ) : isImg ? (
                          <img src={att.url} alt={att.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'contain', background: 'var(--paper-2)' }} />
                        ) : (
                          <div className="row gap-3" style={{ padding: '12px 16px', alignItems: 'center' }}>
                            <Icon name={att.type === 'link' ? 'external' : 'file'} size={20} style={{ color: 'var(--accent)' }} />
                            <div className="col" style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                              <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.url}</a>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {linkInputOpen ? (
                <div className="card card-pad" style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 12 }}>
                  <div className="row between mb-2">
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Vincular enlace externo (Drive, Dropbox...)</span>
                    <button type="button" className="btn-icon" onClick={() => setLinkInputOpen(false)}><Icon name="close" size={14} /></button>
                  </div>
                  <div className="col gap-2">
                    <input 
                      className="input" 
                      placeholder="Nombre (ej. Recursos Drive)" 
                      value={linkName} 
                      onChange={(e) => setLinkName(e.target.value)} 
                    />
                    <input 
                      className="input" 
                      placeholder="URL (https://...)" 
                      value={linkUrl} 
                      onChange={(e) => setLinkUrl(e.target.value)} 
                    />
                    <ButtonCustom type="button" variant="accent" onClick={handleAddLink} disabled={!linkUrl.trim()}>
                      Añadir enlace
                    </ButtonCustom>
                  </div>
                </div>
              ) : (
                <div
                  className="drop-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ cursor: 'pointer', position: 'relative', padding: '24px 20px' }}
                >
                  {uploading ? (
                    <div style={{ padding: '20px', color: 'var(--accent)' }}>Subiendo archivo...</div>
                  ) : (
                    <>
                      <Icon name="plus" size={20} /><br />
                      <span>
                        Arrastra un archivo aquí o{' '}
                        <strong 
                          style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          súbelo desde tu equipo
                        </strong>
                      </span>
                      <div className="mt-2 row gap-2" style={{ justifyContent: 'center' }}>
                        <ButtonCustom type="button" variant="ghost" onClick={(e) => { e.preventDefault(); setLinkInputOpen(true); }} icon="link" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }}>
                          Vincular enlace (Drive, etc.)
                        </ButtonCustom>
                      </div>
                      <br />
                      <span style={{ fontSize: 11 }}>Sube varios archivos o enlaza carpetas externas</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                          e.target.value = '';
                        }} 
                      />
                    </>
                  )}
                </div>
              )}

              {uploadError && (
                <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{uploadError}</p>
              )}
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

            {/* Guion o Propuesta (Solo si no es reunión) */}
            {typeId !== 'reunion' && (
              <div className="field">
                <label>Guion o Propuesta de trabajo</label>
                <textarea
                  className="textarea"
                  placeholder="Escribe o pega aquí el guion o propuesta detallada..."
                  value={scriptText}
                  onChange={e => setScriptText(e.target.value)}
                  style={{ minHeight: 120, marginBottom: 8 }}
                />
                <input
                  className="input"
                  placeholder="O pega aquí un enlace al documento (Google Drive, Dropbox...)"
                  value={scriptLink}
                  onChange={e => setScriptLink(e.target.value)}
                />
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

        {/* ── Footer ── */}
        <div className="modal-foot">
          <ButtonCustom type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonCustom>
          {isContenido && (
            <ButtonCustom
              variant="primary"
              onClick={() => handleSubmit('borrador')}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar borrador'}
            </ButtonCustom>
          )}
          <ButtonCustom
            type="button"
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
