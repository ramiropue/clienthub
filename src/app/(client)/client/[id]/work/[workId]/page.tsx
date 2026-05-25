"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation' ;
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { ButtonCustom } from '@/components/ui/button-custom';
import { eur, getType, MONTH_NAMES } from '@/lib/mock-data';
import { Client, getClient, createNotification, getWorkTypes } from '@/lib/data';

interface Work {
  id: string;
  client_id: string;
  type: string;
  title: string;
  date: Date;
  status: string;
  price: number;
  thumb?: string;
  notes?: string;
  preview_url?: string;
  published_by?: string | null;
  published_at?: Date | null;
}

export default function ClienteWorkDetailPage({
  params
}: {
  params: Promise<{ id: string; workId: string }>;
}) {
  const unwrappedParams = use(params);
  const { id: clientId, workId } = unwrappedParams;
  const router = useRouter();

  const [work, setWork] = useState<Work | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [adminName, setAdminName] = useState('Antía');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Change request fields
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadData();
  }, [workId, clientId]);

  const parsedAttachments = React.useMemo(() => {
    if (!work?.preview_url) return [];
    try {
      if (work.preview_url.startsWith('[')) return JSON.parse(work.preview_url);
      return [{ id: 'legacy', name: 'Archivo adjunto', url: work.preview_url, type: 'file' }];
    } catch {
      return [{ id: 'legacy', name: 'Archivo adjunto', url: work.preview_url, type: 'file' }];
    }
  }, [work?.preview_url]);

  async function loadData() {
    try {
      // 1. Fetch work
      const { data: w } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();

      if (w) {
        setWork({
          ...w,
          date: new Date(w.date),
          published_by: w.published_by ?? null,
          published_at: w.published_at ? new Date(w.published_at) : null
        });
      }

      // 2. Fetch client
      const c = await getClient(clientId);
      setClient(c);

      // 3. Fetch admin settings and work types
      const [{ data: s }, wt] = await Promise.all([
        supabase.from('settings').select('profile_name').single(),
        getWorkTypes(true)
      ]);
      if (s?.profile_name) {
        setAdminName(s.profile_name);
      }
      setWorkTypes(wt);

      // 4. Fetch comments
      const { data: cms } = await supabase
        .from('comments')
        .select('*')
        .eq('work_id', workId)
        .order('created_at', { ascending: true });
      setComments(cms || []);
    } catch (e) {
      console.error('Error loading work detail data:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async () => {
    if (!work) return;
    setUpdating(true);
    const { error } = await supabase
      .from('works')
      .update({ status: 'aprobado' })
      .eq('id', work.id);

    if (!error) {
      setWork({ ...work, status: 'aprobado' });
      setToast('¡Trabajo aprobado con éxito! 🎉');
      setTimeout(() => setToast(''), 2500);

      // Notify admin: client approved the piece
      await createNotification({
        clientId: clientId,
        recipient: 'admin',
        title: `✅ ${client?.name || 'Cliente'} ha aprobado`,
        message: `"${work.title}" ha recibido el visto bueno. Ya puedes publicarla.`,
        type: 'estado',
        workId: work.id,
      });
    } else {
      setToast('Error al aprobar el trabajo');
      setTimeout(() => setToast(''), 3000);
    }
    setUpdating(false);
  };

  const handlePublish = async () => {
    if (!work || !client) return;
    setUpdating(true);
    const now = new Date();
    const { error } = await supabase
      .from('works')
      .update({
        status: 'publicado',
        published_by: client.name,
        published_at: now.toISOString()
      })
      .eq('id', work.id);

    if (!error) {
      setWork({
        ...work,
        status: 'publicado',
        published_by: client.name,
        published_at: now
      });
      setToast('¡Pieza publicada con éxito! 🚀');
      setTimeout(() => setToast(''), 2500);

      // Notify admin: client published the piece
      await createNotification({
        clientId: clientId,
        recipient: 'admin',
        title: `🚀 ${client.name} ha publicado`,
        message: `"${work.title}" ha sido publicada por el cliente.`,
        type: 'estado',
        workId: work.id,
      });
    } else {
      setToast('Error al publicar la pieza');
      setTimeout(() => setToast(''), 3000);
    }
    setUpdating(false);
  };

  const handleSubmitFeedback = async () => {
    if (!work || !feedbackText.trim() || !client) return;
    setSubmittingFeedback(true);

    const { error: workErr } = await supabase
      .from('works')
      .update({ status: 'borrador' })
      .eq('id', work.id);

    if (!workErr) {
      const commentContent = `⚠️ Cambios solicitados:\n${feedbackText.trim()}`;
      const { data: newCommentData, error: commentErr } = await supabase
        .from('comments')
        .insert({
          work_id: work.id,
          author_name: client.name,
          author_role: 'cliente',
          content: commentContent
        })
        .select()
        .single();

      if (!commentErr && newCommentData) {
        setComments(prev => [...prev, newCommentData]);
      }

      setWork({ ...work, status: 'borrador' });
      setToast(`Comentarios enviados a ${adminName} ✉️`);
      setFeedbackText('');
      setShowFeedbackForm(false);
      setTimeout(() => setToast(''), 2500);

      // Notify admin: client requested changes
      await createNotification({
        clientId: clientId,
        recipient: 'admin',
        title: `⚠️ ${client.name} pide cambios`,
        message: feedbackText.trim().slice(0, 80),
        type: 'mensaje',
        workId: work.id,
      });
    } else {
      setToast('Error al enviar los comentarios');
      setTimeout(() => setToast(''), 3000);
    }
    setSubmittingFeedback(false);
  };

  const handleSendComment = async () => {
    if (!work || !client || !newCommentText.trim()) return;
    setSendingComment(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({
        work_id: work.id,
        author_name: client.name,
        author_role: 'cliente',
        content: newCommentText.trim()
      })
      .select()
      .single();

    if (!error && data) {
      setComments(prev => [...prev, data]);
      setNewCommentText('');
      setToast('Mensaje enviado ✉️');
      setTimeout(() => setToast(''), 2000);

      // Notify admin: new message from client
      await createNotification({
        clientId: clientId,
        recipient: 'admin',
        title: `💬 Mensaje de ${client.name}`,
        message: newCommentText.trim().slice(0, 80),
        type: 'mensaje',
        workId: work.id,
      });
    } else {
      setToast('Error al enviar el mensaje');
      setTimeout(() => setToast(''), 2000);
    }
    setSendingComment(false);
  };

  if (loading) {
    return (
      <div
        className="client-app-shell"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'var(--paper)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Top Header Shimmer */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="shimmer-bar" style={{ height: 24, width: 24, borderRadius: '50%' }} />
          <div className="shimmer-bar" style={{ height: 18, width: 120 }} />
          <div style={{ flex: 1 }} />
          <div className="shimmer-bar" style={{ height: 24, width: 70 }} />
        </div>
        
        {/* Main Content Body Shimmer */}
        <div style={{ padding: '18px 18px 60px', maxWidth: 640, margin: '0 auto', width: '100%' }} className="shimmer-container">
          {/* Preview Area */}
          <div className="shimmer-bar" style={{ width: '100%', aspectRatio: '4/5', borderRadius: 14 }} />
          {/* Title / Meta */}
          <div className="shimmer-bar" style={{ height: 28, width: '70%', marginTop: 16 }} />
          <div className="shimmer-bar" style={{ height: 16, width: '40%', marginTop: 8 }} />
          
          {/* Notes */}
          <div className="shimmer-bar" style={{ height: 100, width: '100%', borderRadius: 12, marginTop: 16 }} />
          
          {/* Action buttons */}
          <div className="row gap-4" style={{ flexWrap: 'nowrap', width: '100%', marginTop: 24 }}>
            <div className="shimmer-bar" style={{ height: 42, flex: 1, borderRadius: 999 }} />
            <div className="shimmer-bar" style={{ height: 42, flex: 1, borderRadius: 999 }} />
          </div>
        </div>
      </div>
    );
  }


  if (!work || !client) {
    return (
      <div
        className="client-app-shell"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'var(--paper)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center'
        }}
      >
        <h3 className="h3">Trabajo no encontrado</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Esta pieza no existe o no tienes acceso a ella.</p>
        <ButtonCustom
          variant="ghost"
          onClick={() => router.push(`/client/${clientId}`)}
          style={{ marginTop: 20 }}
        >
          Volver al portal
        </ButtonCustom>
      </div>
    );
  }

  const typeDef = workTypes.find(t => t.id === work.type) || getType(work.type);

  let displayNotes = work.notes || '';
  let meetingTime = '';
  let meetingLocation = '';
  let meetingLink = '';
  let meetingObjectives = '';

  if (work.type === 'reunion' || typeDef?.id === 'reunion') {
    const timeMatch = displayNotes.match(/\*\*Hora:\*\* (.*)/);
    if (timeMatch) meetingTime = timeMatch[1].trim();

    const locMatch = displayNotes.match(/\*\*Ubicación:\*\* (.*)/);
    if (locMatch) meetingLocation = locMatch[1].trim();

    const linkMatch = displayNotes.match(/\*\*Enlace:\*\* (.*)/);
    if (linkMatch) meetingLink = linkMatch[1].trim();

    const objMatch = displayNotes.match(/\*\*Objetivos:\*\*\n([\s\S]*?)(?=\n\n---|$)/);
    if (objMatch) meetingObjectives = objMatch[1].trim();

    displayNotes = displayNotes.replace(/\*\*Hora:\*\* .*\n?/g, '');
    displayNotes = displayNotes.replace(/\*\*Ubicación:\*\* .*\n?/g, '');
    displayNotes = displayNotes.replace(/\*\*Enlace:\*\* .*\n?/g, '');
    displayNotes = displayNotes.replace(/\*\*Objetivos:\*\*\n([\s\S]*?)(?=\n\n---|$)\n?/g, '');
    displayNotes = displayNotes.replace(/^---\n/, '').trim();
  }

  return (
    <div
      className="client-app-shell"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      {/* Top sticky header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--paper)',
          borderBottom: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
          backdropFilter: 'blur(8px)'
        }}
      >
        <button
          className="btn-icon"
          onClick={() => {
            // Check if there is history, otherwise fallback
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(`/client/${clientId}`);
            }
          }}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 4,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)'
          }}
        >
          <Icon name="chevron_left" size={18} />
        </button>
        <div style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {typeDef?.name || 'Detalle de pieza'}
        </div>
        {typeDef?.group === 'contenido' && <StatusBadge status={work.status} />}
      </div>

      {/* Main content body */}
      <div style={{ padding: '18px 18px 60px', maxWidth: 640, margin: '0 auto', width: '100%' }} className="fade-in">
        
        {/* Preview Area */}
        <div className="mb-4 col gap-4">
          {parsedAttachments.length > 0 ? (
            parsedAttachments.map((att: any) => {
              const isVid = att.type === 'file' && /\.(mp4|webm|mov|m4v)($|\?)/i.test(att.url);
              const isImg = att.type === 'file' && /\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i.test(att.url);

              return (
                <div key={att.id} style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                  {isVid ? (
                    <video
                      src={att.url}
                      controls
                      playsInline
                      style={{ width: '100%', aspectRatio: '4/5', objectFit: 'contain', background: '#000' }}
                    />
                  ) : isImg ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      style={{ width: '100%', aspectRatio: '4/5', objectFit: 'contain', background: 'var(--paper-2)' }}
                    />
                  ) : att.type === 'text' ? (
                    <div style={{ width: '100%', padding: '24px', textAlign: 'left', background: 'var(--paper)' }}>
                      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 16 }}>
                        <Icon name="file" size={20} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{att.name}</span>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>
                        {att.content}
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '32px 24px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          background: 'rgba(232, 66, 26, 0.08)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon name={att.type === 'link' ? 'external' : 'file'} size={28} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{att.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, maxWidth: 280, lineHeight: 1.4 }}>
                          {att.type === 'link' ? 'Esta pieza está alojada externamente. Haz clic para revisarla.' : 'Archivo adjunto. Haz clic para descargarlo o verlo.'}
                        </div>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-accent btn-sm row gap-2"
                        style={{
                          textDecoration: 'none',
                          padding: '8px 16px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 500,
                          background: 'var(--ink)',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        Revisar archivo <Icon name="arrow_up_right" size={13} style={{ marginLeft: 4 }} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Fallback abstract thumbnail based on client brand colors */
            <div
              style={{
                width: '100%',
                aspectRatio: '4/5',
                background: work.thumb
                  ? `linear-gradient(135deg, ${work.thumb}, ${client.color || 'var(--accent)'})`
                  : 'var(--paper-2)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--line)'
              }}
            >
              <Icon name={typeDef?.icon || 'image'} size={48} stroke={1.3} style={{ opacity: .55, color: '#fff' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,.3)' }}>
                {work.title}
              </div>
            </div>
          )}
        </div>

        {/* Piece description details */}
        <h2 className="h2 mt-4" style={{ margin: '16px 0 4px', fontSize: 24, fontWeight: 600 }}>{work.title}</h2>
        
        <div className="text-muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{typeDef?.name}</span>
          {typeDef?.group === 'contenido' && (
            <>
              <span>·</span>
              <span>
                Publicación prevista: {work.date.getDate()} de {MONTH_NAMES[work.date.getMonth()].toLowerCase()}
              </span>
            </>
          )}
        </div>

        <div className="row mt-4 gap-4" style={{ alignItems: 'baseline', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Importe de la pieza</div>
            <div className="num-display mt-1" style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              {eur(work.price)}
            </div>
          </div>
        </div>

        {/* Meeting Details */}
        {(work.type === 'reunion' || typeDef?.id === 'reunion') && (
          <div className="card card-pad mt-4 fade-in" style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <h3 className="h3 mb-4" style={{ fontSize: 14 }}>Detalles de la reunión</h3>
            <div className="col gap-4">
              <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="flex-1" style={{ minWidth: 200 }}>
                  <div className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 4 }}>Fecha y hora</div>
                  <div style={{ fontSize: 14 }}>
                    {work.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {meetingTime ? ` a las ${meetingTime}` : ` a las ${work.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
                {(meetingLocation || meetingLink) && (
                  <div className="flex-1" style={{ minWidth: 200 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 4 }}>Ubicación / Enlace</div>
                    <div className="col gap-1">
                      {meetingLocation && <div style={{ fontSize: 14 }}>{meetingLocation}</div>}
                      {meetingLink && <a href={meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'underline' }}>{meetingLink}</a>}
                    </div>
                  </div>
                )}
              </div>
              {meetingObjectives && (
                <div className="mt-2">
                  <div className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 4 }}>Objetivos</div>
                  <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5, background: 'var(--paper-2)', padding: 12, borderRadius: 8, border: '1px solid var(--line)' }}>{meetingObjectives}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin notes */}
        {displayNotes && (
          <div className="card card-pad mt-4" style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <div className="eyebrow mb-2" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Notas y copy de {adminName}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
              {displayNotes}
            </div>
          </div>
        )}

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
                        : `4px solid ${client.color || 'var(--accent)'}`,
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
                            background: isRequestedChange ? 'var(--warn)' : isAdmin ? 'var(--ink)' : (client.color || 'var(--accent)'),
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
              Enviar mensaje a {adminName}
            </label>
            <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
              <textarea
                className="textarea"
                placeholder="Escribe un comentario sobre esta pieza..."
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

        {/* Interactive feedback & approvals */}
        {typeDef?.group === 'contenido' && work.status === 'borrador' && !showFeedbackForm && (
          <div className="row gap-3 mt-6" style={{ width: '100%' }}>
            <ButtonCustom
              variant="ghost"
              onClick={() => setShowFeedbackForm(true)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 999 }}
            >
              Pedir cambios
            </ButtonCustom>
            <ButtonCustom
              variant="accent"
              onClick={handleApprove}
              disabled={updating}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 999 }}
            >
              {updating ? 'Procesando...' : 'Dar visto bueno'}
            </ButtonCustom>
          </div>
        )}

        {typeDef?.group === 'contenido' && work.status === 'aprobado' && (
          <div className="row gap-3 mt-6" style={{ width: '100%' }}>
            <ButtonCustom
              variant="accent"
              onClick={handlePublish}
              disabled={updating}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 999 }}
              icon="check"
            >
              {updating ? 'Publicando...' : 'Publicar pieza'}
            </ButtonCustom>
          </div>
        )}

        {typeDef?.group === 'contenido' && work.status === 'publicado' && (
          <div className="card card-pad mt-6" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12 }}>
            <div className="row gap-2" style={{ alignItems: 'center' }}>
              <span className="dot" style={{ width: 8, height: 8, background: 'var(--ok)', borderRadius: 99, display: 'inline-block' }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                Esta pieza ha sido publicada con éxito 🚀
              </div>
            </div>
            {work.published_by && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, marginLeft: 16 }}>
                Publicada por <strong>{work.published_by}</strong>
                {work.published_at && ` el ${new Date(work.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
              </div>
            )}
          </div>
        )}

        {/* Feedback form */}
        {showFeedbackForm && (
          <div className="card card-pad mt-4 fade-in" style={{ border: '1px solid var(--line)', borderRadius: 12 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, fontSize: 13 }}>
              ¿Qué cambios necesitas realizar en esta pieza?
            </label>
            <textarea
              className="textarea"
              placeholder={`Escribe tus comentarios aquí para que ${adminName} los revise...`}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{ minHeight: 100, fontSize: 13, borderRadius: 8, background: 'var(--paper)' }}
            />
            <div className="row end gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
              <ButtonCustom
                variant="ghost"
                onClick={() => {
                  setShowFeedbackForm(false);
                  setFeedbackText('');
                }}
              >
                Cancelar
              </ButtonCustom>
              <ButtonCustom
                variant="accent"
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback || !feedbackText.trim()}
              >
                {submittingFeedback ? 'Enviando...' : 'Enviar comentarios'}
              </ButtonCustom>
            </div>
          </div>
        )}
      </div>

      {/* Floating high-quality visual Toast notifications */}
      {toast && (
        <div className="toast" style={{ bottom: 32 }}>
          <span className="toast-dot" /> {toast}
        </div>
      )}
    </div>
  );
}
