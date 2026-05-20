"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { StatusBadge } from '@/components/ui/status-badge';
import { eur, STATUS, getType } from '@/lib/mock-data';
import { Work, Client, getClient, createNotification } from '@/lib/data';

export default function AdminWorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const workId = unwrappedParams.id;

  const [work, setWork] = useState<Work | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [profileName, setProfileName] = useState('Antía');

  // Editable fields
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

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
          date: new Date(w.date),
          publishedBy: w.published_by ?? null,
          publishedAt: w.published_at ? new Date(w.published_at) : null
        };
        setWork(mappedWork);
        setNotes(mappedWork.notes || '');
        const c = await getClient(mappedWork.clientId);
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
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <span className="dot animate-pulse" style={{ width: 10, height: 10, background: 'var(--warn)', borderRadius: 99, display: 'inline-block' }} />
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  Esta pieza está en <strong>Borrador</strong>. Esperando a que el cliente ({client?.name || 'Cliente'}) dé su visto bueno.
                </div>
              </div>
            )}
            
            {work.status === 'aprobado' && (
              <div className="col gap-3">
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  ✅ El cliente ha aprobado esta pieza. Ya puedes publicarla.
                </div>
                <div className="row">
                  <ButtonCustom 
                    variant="accent" 
                    icon="check"
                    onClick={handlePublish}
                    disabled={saving}
                  >
                    {saving ? 'Publicando...' : 'Publicar pieza'}
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

      {toast && (
        <div className="toast">
          <span className="toast-dot" /> {toast}
        </div>
      )}
    </div>
  );
}
