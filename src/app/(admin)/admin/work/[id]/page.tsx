"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { StatusBadge } from '@/components/ui/status-badge';
import { eur, STATUS, getType } from '@/lib/mock-data';
import { Work, Client, getClient, getClients, createNotification } from '@/lib/data';
import { EditWorkModal } from '@/components/admin/edit-work-modal';

export default function AdminWorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const workId = unwrappedParams.id;
  const router = useRouter();

  const [work, setWork] = useState<Work | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [profileName, setProfileName] = useState('Antía');
  const [editOpen, setEditOpen] = useState(false);

  // Editable fields
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const parsedAttachments = React.useMemo(() => {
    if (!work?.previewUrl) return [];
    try {
      if (work.previewUrl.startsWith('[')) return JSON.parse(work.previewUrl);
      return [{ id: 'legacy', name: 'Archivo adjunto', url: work.previewUrl, type: 'file' }];
    } catch {
      return [{ id: 'legacy', name: 'Archivo adjunto', url: work.previewUrl, type: 'file' }];
    }
  }, [work?.previewUrl]);

  const updateAttachments = async (newArr: any[]) => {
    if (!work) return;
    setSaving(true);
    const val = newArr.length > 0 ? JSON.stringify(newArr) : null;
    const { error } = await supabase.from('works').update({ preview_url: val }).eq('id', work.id);
    setSaving(false);
    if (!error) {
      setWork({ ...work, previewUrl: val });
    } else {
      setToast('Error al actualizar adjuntos');
      setTimeout(() => setToast(''), 2000);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!work) return;
    setUploading(true);
    setUploadError(null);
    try {
      const path = `works/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('client-logos').upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('client-logos').getPublicUrl(path);
      
      const newAtt = { id: Date.now().toString(), name: file.name, url: data.publicUrl, type: 'file' };
      await updateAttachments([...parsedAttachments, newAtt]);
    } catch (err: any) {
      setUploadError('Error subiendo archivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async () => {
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
    await updateAttachments([...parsedAttachments, newAtt]);
    setLinkUrl('');
    setLinkName('');
    setLinkInputOpen(false);
  };

  const handleRemoveFile = async (id: string) => {
    await updateAttachments(parsedAttachments.filter((a: any) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, [workId]);

  async function loadData() {
    try {
      const allClients = await getClients();
      setClients(allClients);

      const { data: w } = await supabase.from('works').select('*').eq('id', workId).single();
      if (w) {
        const mappedWork = {
          ...w,
          clientId: w.client_id,
          date: new Date(w.date),
          previewUrl: w.preview_url ?? null,
          publishedBy: w.published_by ?? null,
          publishedAt: w.published_at ? new Date(w.published_at) : null
        };
        setWork(mappedWork);
        setNotes(mappedWork.notes || '');
        const c = allClients.find(client => client.id === mappedWork.clientId) || null;
        setClient(c);
      }

      const { data: s } = await supabase.from('settings').select('profile_name').single();
      if (s?.profile_name) {
        setProfileName(s.profile_name);
      }

      // Fetch comments
      const { data: cms } = await supabase
        .from('comments')
        .select('*')
        .eq('work_id', workId)
        .order('created_at', { ascending: true });
      setComments(cms || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que deseas eliminar este trabajo?')) return;
    setSaving(true);
    const { error } = await supabase.from('works').delete().eq('id', workId);
    if (!error) {
      router.push(`/admin/client/${work?.clientId}`);
    } else {
      setSaving(false);
      setToast('Error al eliminar');
      setTimeout(() => setToast(''), 2000);
    }
  };

  const handlePublish = async () => {
    if (!work) return;
    setSaving(true);
    const now = new Date();
    const { error } = await supabase.from('works').update({
      status: 'publicado',
      published_by: profileName,
      published_at: now.toISOString()
    }).eq('id', work.id);
    
    setSaving(false);
    if (!error) {
      setWork({
        ...work,
        status: 'publicado',
        publishedBy: profileName,
        publishedAt: now
      });
      setToast('Pieza publicada 🎉');
      setTimeout(() => setToast(''), 2000);

      // Notify client: status changed to published
      if (work.clientId) {
        await createNotification({
          clientId: work.clientId,
          recipient: 'client',
          title: '🚀 Pieza publicada',
          message: `"${work.title}" ya está publicada.`,
          type: 'estado',
          workId: work.id,
        });
      }
    } else {
      setToast('Error al publicar');
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

  const handleSendComment = async () => {
    if (!work || !newCommentText.trim()) return;
    setSendingComment(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({
        work_id: work.id,
        author_name: profileName,
        author_role: 'administrador',
        content: newCommentText.trim()
      })
      .select()
      .single();

    if (!error && data) {
      setComments(prev => [...prev, data]);
      setNewCommentText('');
      setToast('Mensaje enviado ✉️');
      setTimeout(() => setToast(''), 2000);

      // Notify client: new message from agency
      if (work.clientId) {
        await createNotification({
          clientId: work.clientId,
          recipient: 'client',
          title: `💬 Respuesta de ${profileName}`,
          message: newCommentText.trim().slice(0, 80),
          type: 'mensaje',
          workId: work.id,
        });
      }
    } else {
      setToast('Error al enviar el mensaje');
      setTimeout(() => setToast(''), 2000);
    }
    setSendingComment(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <div className="shimmer-container" style={{ gap: 24 }}>
          {/* Back button and actions */}
          <div className="row between">
            <div className="shimmer-bar" style={{ height: 18, width: 140 }} />
            <div className="row gap-2">
              <div className="shimmer-bar" style={{ height: 36, width: 80 }} />
              <div className="shimmer-bar" style={{ height: 36, width: 80 }} />
            </div>
          </div>
          {/* Large Card Shimmer */}
          <div className="shimmer-bar" style={{ height: 480, width: '100%', borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  if (!work) return <div style={{ padding: 40 }}>Trabajo no encontrado</div>;

  const typeDef = getType(work.type);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div className="row between mb-6">
        <button 
          onClick={() => router.push(`/admin/client/${work.clientId}`)} 
          style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 13, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="chevron_left" size={14} /> Volver a {client?.name || 'cliente'}
        </button>
        <div className="row gap-2">
          <ButtonCustom variant="ghost" onClick={() => setEditOpen(true)} icon="edit">Editar</ButtonCustom>
          <ButtonCustom variant="ghost" onClick={handleDelete} icon="trash" style={{ color: 'var(--accent)' }}>Eliminar</ButtonCustom>
        </div>
      </div>

      <div className="card card-pad fade-in">
        <div className="row between mb-6" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="row gap-2 mb-2">
              <span className="badge" style={{ background: 'var(--card-hover)' }}>{typeDef?.name}</span>
              {typeDef?.group === 'contenido' && <StatusBadge status={work.status} />}
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

        {typeDef?.group === 'contenido' && (
          <div className="mb-6 card card-pad" style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              Flujo de aprobación y publicación
            </label>
            
            {work.status === 'borrador' && (
              <div className="col gap-3">
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <span className="dot animate-pulse" style={{ width: 10, height: 10, background: 'var(--warn)', borderRadius: 99, display: 'inline-block' }} />
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    Esta pieza está en <strong>Borrador</strong>. Esperando a que el cliente ({client?.name || 'Cliente'}) dé su visto bueno.
                  </div>
                </div>
                <div className="row gap-2 mt-2">
                  <ButtonCustom 
                    variant="ghost" 
                    icon="check"
                    onClick={async () => {
                      setSaving(true);
                      const { error } = await supabase.from('works').update({ status: 'aprobado' }).eq('id', work.id);
                      setSaving(false);
                      if (!error) { setWork({ ...work, status: 'aprobado' }); setToast('Marcado como aprobado'); setTimeout(() => setToast(''), 2000); }
                    }}
                    disabled={saving}
                  >
                    Aprobar manualmente
                  </ButtonCustom>
                </div>
              </div>
            )}
            
            {work.status === 'aprobado' && (
              <div className="col gap-3">
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  ✅ El cliente ha aprobado esta pieza. Ya puedes publicarla.
                </div>
                <div className="row gap-2 mt-2">
                  <ButtonCustom 
                    variant="accent" 
                    icon="check"
                    onClick={handlePublish}
                    disabled={saving}
                  >
                    {saving ? 'Publicando...' : 'Publicar pieza'}
                  </ButtonCustom>
                  <ButtonCustom 
                    variant="ghost" 
                    icon="undo"
                    onClick={async () => {
                      setSaving(true);
                      const { error } = await supabase.from('works').update({ status: 'borrador' }).eq('id', work.id);
                      setSaving(false);
                      if (!error) { setWork({ ...work, status: 'borrador' }); setToast('Devuelto a borrador'); setTimeout(() => setToast(''), 2000); }
                    }}
                    disabled={saving}
                  >
                    Devolver a borrador
                  </ButtonCustom>
                </div>
              </div>
            )}
            
            {work.status === 'publicado' && (
              <div className="col gap-2">
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <span className="dot" style={{ width: 10, height: 10, background: 'var(--ok)', borderRadius: 99, display: 'inline-block' }} />
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    Esta pieza ha sido <strong>Publicada</strong>.
                  </div>
                </div>
                {work.publishedBy && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 22 }}>
                    Publicada por <strong>{work.publishedBy}</strong>
                    {work.publishedAt && ` el ${new Date(work.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                )}
                <div className="row gap-2 mt-3" style={{ marginLeft: 22 }}>
                  <ButtonCustom 
                    variant="ghost" 
                    icon="undo"
                    onClick={async () => {
                      setSaving(true);
                      const { error } = await supabase.from('works').update({ status: 'aprobado', published_by: null, published_at: null }).eq('id', work.id);
                      setSaving(false);
                      if (!error) { setWork({ ...work, status: 'aprobado', publishedBy: null, publishedAt: null }); setToast('Deshecha publicación'); setTimeout(() => setToast(''), 2000); }
                    }}
                    disabled={saving}
                  >
                    Deshacer publicación
                  </ButtonCustom>
                </div>
              </div>
            )}
          </div>
        )}

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

        <div className="mb-6">
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Archivos adjuntos de la pieza</label>
          
          {parsedAttachments.length > 0 && (
            <div className="col gap-3 mb-4">
              {parsedAttachments.map((att: any) => {
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
                      onClick={() => handleRemoveFile(att.id)}
                      disabled={saving}
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
                <ButtonCustom variant="accent" onClick={handleAddLink} disabled={!linkUrl.trim() || saving}>
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
                    <ButtonCustom variant="ghost" onClick={() => setLinkInputOpen(true)} icon="link" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }}>
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

        {/* Comments / Chat Section */}
        <div className="divider mt-6 mb-6" />

        <div className="mb-6">
          <h3 className="h3 mb-4" style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="chat" size={18} /> Conversación de la pieza
          </h3>

          {comments.length === 0 ? (
            <div className="card card-pad text-center" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '24px 16px' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>No hay comentarios aún. Escribe un mensaje a continuación para iniciar la conversación.</span>
            </div>
          ) : (
            <div className="col gap-3">
              {comments.map((comment) => {
                const isAdmin = comment.author_role === 'administrador';
                const isRequestedChange = comment.content.startsWith('⚠️');
                return (
                  <div 
                    key={comment.id} 
                    className="card card-pad fade-in" 
                    style={{ 
                      background: 'var(--card)', 
                      borderRadius: 12, 
                      border: '1px solid var(--line)',
                      borderLeft: isRequestedChange 
                        ? '4px solid var(--warn)'
                        : isAdmin 
                        ? `4px solid var(--ink)` 
                        : `4px solid ${client?.color || 'var(--accent)'}`,
                      padding: 14
                    }}
                  >
                    <div className="row between mb-2" style={{ alignItems: 'center' }}>
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{comment.author_name}</span>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: 10, 
                            padding: '1px 6px',
                            background: isRequestedChange ? 'var(--warn)' : isAdmin ? 'var(--ink)' : (client?.color || 'var(--accent)'),
                            color: '#fff',
                            borderRadius: 4
                          }}
                        >
                          {isRequestedChange ? 'Cambios' : isAdmin ? 'Agencia' : 'Cliente'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(comment.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick reply text area */}
          <div className="card card-pad mt-4" style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--paper-2)' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, fontSize: 12, color: 'var(--muted)' }}>
              Enviar mensaje a {client?.name || 'Cliente'}
            </label>
            <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
              <textarea
                className="textarea"
                placeholder="Escribe un comentario o respuesta..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                style={{ minHeight: 60, fontSize: 13, borderRadius: 8, background: 'var(--paper)', flex: 1, padding: 8 }}
              />
              <ButtonCustom
                variant="accent"
                onClick={handleSendComment}
                disabled={sendingComment || !newCommentText.trim()}
                style={{ padding: '8px 16px', height: 42 }}
                icon="chevron_right"
              >
                {sendingComment ? '...' : 'Enviar'}
              </ButtonCustom>
            </div>
          </div>
        </div>
      </div>

      <EditWorkModal 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        clients={clients} 
        work={work} 
        onUpdated={loadData} 
      />

      {toast && (
        <div className="toast">
          <span className="toast-dot" /> {toast}
        </div>
      )}
    </div>
  );
}
