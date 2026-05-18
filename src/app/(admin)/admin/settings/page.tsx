"use client";

import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, Settings } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { supabase } from '@/lib/supabase';
import { useRef } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploadingImage(true);
    
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      setToast('Error al subir la imagen');
      setTimeout(() => setToast(''), 3000);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    
    setSettings({ ...settings, profileImageUrl: data.publicUrl });
    setUploadingImage(false);
  };

  const loadData = async () => {
    setLoading(true);
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    
    // Trigger global event so Sidebar can update
    window.dispatchEvent(new Event('settings-updated'));
    
    setSaving(false);
    
    setToast('Ajustes guardados correctamente');
    setTimeout(() => setToast(''), 3000);
  };

  if (loading || !settings) {
    return (
      <div className="main-content">
        <div className="placeholder">Cargando ajustes...</div>
      </div>
    );
  }

  const handleColorChange = (color: string) => {
    setSettings({ ...settings, profileColor: color });
  };

  const presetColors = ['#161311', '#E8421A', '#2E67F8', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Configuración</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>Ajustes Generales</h1>
        </div>
        <div className="row gap-2">
          <ButtonCustom variant="primary" icon="check" onClick={() => handleSave()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </ButtonCustom>
        </div>
      </div>
      
      <div className="main-content">
        <form onSubmit={handleSave} className="col gap-6" style={{ maxWidth: 640 }}>
          
          {/* Perfil Profesional */}
          <div className="card card-pad">
            <h3 className="h3 mb-4">Perfil Profesional</h3>
            <div className="col gap-4">
              <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <AvatarCustom 
                    name={settings.profileName} 
                    color={settings.profileColor} 
                    logoUrl={settings.profileImageUrl}
                    size="lg" 
                  />
                </div>
                <div className="field flex-1">
                  <label>Apariencia del avatar</label>
                  <div className="row gap-4 mt-2">
                    <div className="row gap-2">
                      {presetColors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleColorChange(c)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: c,
                            border: settings.profileColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                            boxShadow: settings.profileColor === c ? '0 0 0 2px #fff inset' : 'none',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                      <div style={{ position: 'relative', width: 24, height: 24, overflow: 'hidden', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--line)' }}>
                        <input 
                          type="color" 
                          value={settings.profileColor} 
                          onChange={e => handleColorChange(e.target.value)}
                          style={{ position: 'absolute', top: -10, left: -10, width: 44, height: 44, cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row gap-2 mt-3" style={{ alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      onChange={handleImageUpload}
                    />
                    <ButtonCustom 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      icon="image" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Subiendo...' : 'Subir desde el ordenador'}
                    </ButtonCustom>
                    {settings.profileImageUrl && (
                      <button 
                        type="button" 
                        className="btn-icon" 
                        style={{ color: 'var(--warn)' }}
                        onClick={() => setSettings({ ...settings, profileImageUrl: null })}
                        title="Quitar imagen"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="row gap-4">
                <div className="field flex-1">
                  <label>Nombre</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.profileName}
                    onChange={e => setSettings({ ...settings, profileName: e.target.value })}
                    required
                  />
                </div>
                <div className="field flex-1">
                  <label>Cargo / Especialidad</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.profileRole}
                    onChange={e => setSettings({ ...settings, profileRole: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Datos Fiscales */}
          <div className="card card-pad">
            <h3 className="h3 mb-4">Datos Fiscales y de Facturación</h3>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
              Estos datos se utilizarán por defecto al generar presupuestos y facturas para tus clientes.
            </p>
            
            <div className="col gap-4">
              <div className="field">
                <label>Nombre legal / Razón social</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.companyName || ''}
                  onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Ej. Ramiro García"
                />
              </div>

              <div className="field">
                <label>CIF / NIF / DNI</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.companyId || ''}
                  onChange={e => setSettings({ ...settings, companyId: e.target.value })}
                  placeholder="Ej. 12345678Z"
                />
              </div>

              <div className="field">
                <label>Dirección completa</label>
                <textarea 
                  className="textarea" 
                  value={settings.companyAddress || ''}
                  onChange={e => setSettings({ ...settings, companyAddress: e.target.value })}
                  placeholder="Calle de Ejemplo 123, 28001 Madrid, España"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
        </form>
      </div>

      {toast && (
        <div className="toast fade-in">
          <div className="toast-dot" />
          {toast}
        </div>
      )}
    </div>
  );
}
