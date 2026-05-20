"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { supabase } from '@/lib/supabase';

// ── Palette suggestions ───────────────────────────────────────
const COLOR_PALETTE = [
  '#1F3D2E', '#2B4B6F', '#5A3A1A', '#3B2F6E',
  '#1A3A3A', '#6E2F2F', '#2F6E5A', '#4A4A1A',
  '#161311', '#1A2F6E',
];

// ── Social network options ────────────────────────────────────
const SOCIAL_NETWORKS = [
  { id: 'instagram', label: 'Instagram',    placeholder: '@handle' },
  { id: 'tiktok',    label: 'TikTok',       placeholder: '@handle' },
  { id: 'youtube',   label: 'YouTube',      placeholder: '@canal o URL' },
  { id: 'linkedin',  label: 'LinkedIn',     placeholder: '@perfil o URL' },
  { id: 'facebook',  label: 'Facebook',     placeholder: 'Nombre de página o URL' },
  { id: 'twitter',   label: 'X / Twitter',  placeholder: '@handle' },
  { id: 'web',       label: 'Página web',   placeholder: 'https://...' },
];

interface SocialEntry { network: string; handle: string; }

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialData?: any;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30);
}

function getInitials(name: string) {
  return name
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');
}

// ── Avatar preview ────────────────────────────────────────────
interface AvatarPreviewProps {
  accountName: string;
  color: string;
  logoPreview: string | null;
  onUploadClick: () => void;
  onRemoveLogo: () => void;
}

function AvatarPreview({ accountName, color, logoPreview, onUploadClick, onRemoveLogo }: AvatarPreviewProps) {
  const initials = getInitials(accountName) || '?';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Avatar circle */}
      {logoPreview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoPreview}
          alt="Logo"
          style={{
            width: 76, height: 76, borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--line)',
          }}
        />
      ) : (
        <span
          style={{
            width: 76, height: 76, borderRadius: '50%',
            background: color,
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            border: '1px solid rgba(0,0,0,.04)',
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
      )}

      {/* Upload overlay button */}
      <button
        type="button"
        onClick={onUploadClick}
        title="Subir logo"
        style={{
          position: 'absolute',
          bottom: -2, right: -2,
          width: 26, height: 26,
          borderRadius: '50%',
          background: 'var(--ink)',
          border: '2px solid var(--paper)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background .12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--ink)')}
      >
        <Icon name="image" size={11} />
      </button>

      {/* Remove logo button */}
      {logoPreview && (
        <button
          type="button"
          onClick={onRemoveLogo}
          title="Quitar logo"
          style={{
            position: 'absolute',
            top: -2, right: -2,
            width: 20, height: 20,
            borderRadius: '50%',
            background: 'var(--accent)',
            border: '2px solid var(--paper)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="close" size={9} />
        </button>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function NewClientModal({ open, onClose, onCreated, initialData }: NewClientModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [accountName,    setAccountName]    = useState('');
  const [contactName,    setContactName]    = useState('');
  const [handle,         setHandle]         = useState('');
  const [sector,         setSector]         = useState('');
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [startDate,      setStartDate]      = useState('');
  const [retainer,       setRetainer]       = useState(0);
  const [retainerLabel,  setRetainerLabel]  = useState('Cuota plan Esencial');
  const [color,          setColor]          = useState(COLOR_PALETTE[0]);
  const [brandTone,      setBrandTone]      = useState('');
  const [accessInfo,     setAccessInfo]     = useState('');
  const [nextMeeting,    setNextMeeting]    = useState('');
  const [socials,        setSocials]        = useState<SocialEntry[]>([
    { network: 'instagram', handle: '' },
  ]);

  // Logo
  const [logoFile,       setLogoFile]       = useState<File | null>(null);
  const [logoPreview,    setLogoPreview]    = useState<string | null>(null);
  const [brandingFile,   setBrandingFile]   = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const resetForm = useCallback(() => {
    if (initialData) {
      setAccountName(initialData.name || '');
      setHandle(initialData.handle || '');
      setSector(initialData.sector || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      
      const sDate = initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setStartDate(sDate);
      
      setRetainer(initialData.monthlyRetainer || 0);
      setRetainerLabel(initialData.retainerLabel || 'Cuota plan Esencial');
      setColor(initialData.color || COLOR_PALETTE[0]);
      
      setBrandTone(initialData.brandTone || '');
      setAccessInfo(initialData.accessInfo || '');
      setNextMeeting(initialData.nextMeeting || '');
      
      setSocials([{ network: 'instagram', handle: '' }]);
      setLogoFile(null);
      setBrandingFile(null);
      setLogoPreview(initialData.logoUrl || null);
      
      // We'll store the branding file url in a state if we want to show it, but for now we just allow uploading a new one.
      setError('');
    } else {
      setAccountName(''); setContactName(''); setHandle('');
      setSector(''); setEmail(''); setPhone('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setRetainer(0); setRetainerLabel('Cuota plan Esencial');
      setColor(COLOR_PALETTE[0]);
      setBrandTone(''); setAccessInfo(''); setNextMeeting('');
      setSocials([{ network: 'instagram', handle: '' }]);
      setLogoFile(null); setLogoPreview(null); setBrandingFile(null);
      setError('');
    }
  }, [initialData]);

  // Reset on open
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  // ── Logo handlers ──────────────────────────────────────────
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('El archivo debe ser una imagen.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('El logo no puede superar 2 MB.'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  // ── Socials helpers ───────────────────────────────────────
  const addSocial    = () => setSocials(s => [...s, { network: 'instagram', handle: '' }]);
  const updateSocial = (idx: number, field: keyof SocialEntry, val: string) =>
    setSocials(s => s.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  const removeSocial = (idx: number) => setSocials(s => s.filter((_, i) => i !== idx));

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!accountName.trim()) { setError('El nombre de la cuenta es obligatorio.'); return; }
    if (!email.trim())       { setError('El correo electrónico es obligatorio.'); return; }

    setSaving(true);
    setError('');

    const id       = slugify(accountName) + '-' + Date.now().toString(36);
    const initials = getInitials(accountName);

    // Build since label from startDate
    const sinceDate = startDate ? new Date(startDate) : new Date();
    const since     = sinceDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

    const primaryHandle = handle.trim() ||
      socials.find(s => s.handle.trim())?.handle.trim() ||
      `@${slugify(accountName)}`;

    // ── Upload logo if present ──────────────────────────────
    let logoUrl: string | null = null;
    if (logoFile) {
      const ext      = logoFile.name.split('.').pop();
      const path     = `${id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('client-logos')
        .upload(path, logoFile, { upsert: true });

      if (upErr) {
        setError('Error subiendo el logo: ' + upErr.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('client-logos')
        .getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    // ── Upload branding file if present ─────────────────────
    let uploadedBrandToneFileUrl = initialData?.brandToneFileUrl || null;
    if (brandingFile) {
      const ext = brandingFile.name.split('.').pop();
      const path = `files/${id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('client-logos').upload(path, brandingFile, { upsert: true });
      if (upErr) {
        setError('Error subiendo el archivo de branding: ' + upErr.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('client-logos').getPublicUrl(path);
      uploadedBrandToneFileUrl = urlData.publicUrl;
    }

    const payload = {
      name:             accountName.trim(),
      handle:           primaryHandle.startsWith('@') ? primaryHandle : `@${primaryHandle}`,
      sector:           sector.trim() || 'Sin especificar',
      color,
      initials,
      monthly_retainer: retainer,
      retainer_label:   retainerLabel.trim() || 'Cuota mensual',
      email:            email.trim(),
      phone:            phone.trim() || null,
      since,
      start_date:       startDate || null,
      logo_url:         logoUrl || (initialData?.logoUrl || null),
      palette:          [color, '#D6C6A8', '#E8421A'],
      brand_tone:       brandTone.trim() || null,
      brand_tone_file_url: uploadedBrandToneFileUrl,
      access_info:      accessInfo.trim() || null,
      next_meeting:     nextMeeting.trim() || null,
    };

    if (initialData?.id) {
      const { error: err } = await supabase.from('clients').update(payload).eq('id', initialData.id);
      setSaving(false);
      if (err) { setError('Error al actualizar: ' + err.message); return; }
    } else {
      const { error: err } = await supabase.from('clients').insert({
        id,
        ...payload
      });
      setSaving(false);
      if (err) { setError('Error al guardar: ' + err.message); return; }
    }

    onCreated();
    onClose();
  }, [accountName, handle, sector, email, phone, startDate, retainer, retainerLabel, color, socials, logoFile, brandTone, accessInfo, nextMeeting, onCreated, onClose, initialData]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 600, maxHeight: '92vh' }}
      >
        {/* ── Head ── */}
        <div className="modal-head">
          <div>
            <h2>{initialData ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <div className="sub">Añade una nueva cuenta a tu cartera de clientes.</div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          <div className="col gap-4">

            {/* ── Avatar / Logo section ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <AvatarPreview
                accountName={accountName}
                color={color}
                logoPreview={logoPreview}
                onUploadClick={() => fileInputRef.current?.click()}
                onRemoveLogo={() => { setLogoFile(null); setLogoPreview(null); }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', marginBottom: 2 }}>
                  {accountName || <span style={{ color: 'var(--muted)' }}>Nombre de la cuenta</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                  {handle || sector || <span style={{ opacity: 0.5 }}>handle · sector</span>}
                </div>

                {/* Drop zone for logo */}
                <div
                  className="drop-zone"
                  style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                >
                  <Icon name="image" size={14} style={{ display: 'inline', marginRight: 6 }} />
                  {logoPreview
                    ? <span>Logo cargado — haz clic para <strong>cambiar</strong></span>
                    : <span>Arrastra el logo o <strong>busca un archivo</strong> · PNG, SVG, JPG · máx 2 MB</span>
                  }
                </div>
              </div>
            </div>

            {/* ── Color palette ── */}
            <div className="field">
              <label>Color de marca</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: c,
                      border: color === c ? '3px solid var(--ink)' : '2px solid transparent',
                      outline: color === c ? '2px solid #fff' : 'none',
                      outlineOffset: -4,
                      cursor: 'pointer',
                      transition: 'transform .12s',
                      flexShrink: 0,
                    }}
                  />
                ))}
                {/* Custom color picker */}
                <label
                  htmlFor="custom-color"
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    border: '1.5px dashed var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    background: COLOR_PALETTE.includes(color) ? 'transparent' : color,
                    flexShrink: 0,
                  }}
                  title="Color personalizado"
                >
                  {COLOR_PALETTE.includes(color) && (
                    <Icon name="plus" size={11} style={{ color: 'var(--muted)' }} />
                  )}
                  <input
                    id="custom-color"
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            <div className="divider" />

            {/* ── Names ── */}
            <div className="row gap-3">
              <div className="field flex-1">
                <label>Nombre de la cuenta <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input
                  className="input"
                  placeholder="Ej. Studio Pilar"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="field flex-1">
                <label>Nombre del cliente / contacto</label>
                <input
                  className="input"
                  placeholder="Ej. Pilar García"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                />
              </div>
            </div>

            {/* ── Sector + Handle ── */}
            <div className="row gap-3">
              <div className="field flex-1">
                <label>Sector / industria</label>
                <input
                  className="input"
                  placeholder="Ej. Yoga & bienestar"
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                />
              </div>
              <div className="field flex-1">
                <label>Handle principal</label>
                <input
                  className="input"
                  placeholder="@handle"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                />
              </div>
            </div>

            {/* ── Contact ── */}
            <div className="row gap-3">
              <div className="field flex-1">
                <label>Correo electrónico <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input
                  className="input"
                  type="email"
                  placeholder="hola@cliente.es"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="field flex-1">
                <label>Teléfono</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* ── Start date ── */}
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Trabajando juntos desde</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="divider" />

            {/* ── Social networks ── */}
            <div className="field">
              <label>Redes sociales</label>
              <div className="col gap-2">
                {socials.map((entry, idx) => (
                  <div key={idx} className="row gap-2">
                    <select
                      className="input"
                      value={entry.network}
                      onChange={e => updateSocial(idx, 'network', e.target.value)}
                      style={{ maxWidth: 148, flexShrink: 0 }}
                    >
                      {SOCIAL_NETWORKS.map(n => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                      ))}
                    </select>
                    <input
                      className="input flex-1"
                      placeholder={SOCIAL_NETWORKS.find(n => n.id === entry.network)?.placeholder}
                      value={entry.handle}
                      onChange={e => updateSocial(idx, 'handle', e.target.value)}
                    />
                    {socials.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeSocial(idx)}
                        aria-label="Eliminar red social"
                        style={{ flexShrink: 0 }}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={addSocial}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  <Icon name="plus" size={13} /> Añadir red
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* ── Billing ── */}
            <div className="row gap-3">
              <div className="field flex-1">
                <label>Cuota mensual (€)</label>
                <input
                  className="input mono"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={retainer || ''}
                  onChange={e => setRetainer(Number(e.target.value))}
                />
              </div>
              <div className="field flex-1">
                <label>Etiqueta del plan</label>
                <input
                  className="input"
                  placeholder="Ej. Cuota plan Esencial"
                  value={retainerLabel}
                  onChange={e => setRetainerLabel(e.target.value)}
                />
              </div>
            </div>

            {/* ── Notes ── */}
            <div className="field">
              <div className="row between" style={{ alignItems: 'baseline' }}>
                <label>Branding</label>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => document.getElementById('modal-branding-file')?.click()}
                  style={{ padding: '2px 8px', fontSize: 11 }}
                >
                  <Icon name="link" size={12} /> {brandingFile ? 'Archivo seleccionado' : 'Adjuntar archivo'}
                </button>
                <input 
                  type="file" 
                  id="modal-branding-file"
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files?.[0]) setBrandingFile(e.target.files[0]);
                  }} 
                />
              </div>
              <textarea
                className="textarea"
                placeholder="Cercano, sin tecnicismos..."
                value={brandTone}
                onChange={e => setBrandTone(e.target.value)}
                style={{ minHeight: 60 }}
              />
              {brandingFile && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{brandingFile.name}</div>}
              {(!brandingFile && initialData?.brandToneFileUrl) && (
                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Archivo adjunto actual: <a href={initialData.brandToneFileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Ver</a></div>
              )}
            </div>
            <div className="field">
              <label>Accesos & contraseñas</label>
              <textarea
                className="textarea"
                placeholder="Instagram: vía Meta Business Suite..."
                value={accessInfo}
                onChange={e => setAccessInfo(e.target.value)}
                style={{ minHeight: 60 }}
              />
            </div>
            <div className="field">
              <label>Próxima reunión</label>
              <input
                className="input"
                placeholder="Ej. 30 de mayo — revisión campaña..."
                value={nextMeeting}
                onChange={e => setNextMeeting(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--accent)', fontSize: 13 }}>{error}</div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-foot">
          <ButtonCustom variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonCustom>
          <ButtonCustom
            variant="accent"
            icon="check"
            onClick={handleSubmit}
            disabled={saving || !accountName.trim() || !email.trim()}
          >
            {saving ? 'Guardando…' : 'Crear cliente'}
          </ButtonCustom>
        </div>
      </div>
    </div>
  );
}
