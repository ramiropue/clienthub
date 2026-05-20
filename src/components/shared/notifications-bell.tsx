"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { AppNotification, getNotifications, markNotificationsAsRead } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface NotificationsBellProps {
  recipient: 'admin' | 'client';
  clientId?: string;
  /** 'left' → opens to the right of the button (sidebar). 'right' → opens below-right (topbar). */
  align?: 'left' | 'right';
}

export function NotificationsBell({ recipient, clientId, align = 'right' }: NotificationsBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(recipient, clientId);
      setNotifications(data);
    } catch (e) {
      console.error('[Bell] Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [recipient, clientId]);

  useEffect(() => {
    loadNotifications();
    pollingRef.current = setInterval(loadNotifications, 15000);

    const channel = supabase
      .channel(`notif-${recipient}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new?.recipient === recipient) loadNotifications();
      })
      .subscribe();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, recipient]);

  // Compute position using fixed coords (viewport-relative = no scroll math needed)
  const openDropdown = useCallback(() => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    if (align === 'left') {
      // Sidebar: open to the right of the button
      setPos({ top: r.top, left: r.right + 10 });
    } else {
      // Topbar: open below, right-aligned to button
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 340) });
    }
    setIsOpen(true);
  }, [align]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setPos(null);
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      loadNotifications();
      openDropdown();
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const portal = document.getElementById('notif-portal');
      if (!buttonRef.current?.contains(target) && !portal?.contains(target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closeDropdown]);

  // Close on scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => closeDropdown();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen, closeDropdown]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    await markNotificationsAsRead(ids);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationsAsRead([notif.id]);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    closeDropdown();
    if (notif.workId) {
      router.push(
        recipient === 'admin'
          ? `/admin/work/${notif.workId}`
          : `/client/${clientId || notif.clientId}/work/${notif.workId}`
      );
    }
  };

  const iconFor = (type: string) => {
    if (type === 'mensaje') return { name: 'chat', color: 'var(--accent)', bg: 'rgba(224,86,36,0.12)' };
    if (type === 'estado') return { name: 'check', color: '#28a745', bg: 'rgba(40,167,69,0.12)' };
    return { name: 'calendar', color: 'var(--ink)', bg: 'var(--card-hover)' };
  };

  const ago = (d: Date) => {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'Ahora';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  /* ── Dropdown rendered via portal with position:fixed ── */
  const dropdownEl = pos && (
    <div
      id="notif-portal"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 99999,
        width: 340,
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #e5e5e5)',
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--line, #e5e5e5)',
        background: 'var(--paper-2, #f5f2ec)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Notificaciones</span>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--accent, #e05624)', color: '#fff',
              fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 7px',
            }}>
              {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} style={{
            background: 'none', border: 0,
            color: 'var(--accent, #e05624)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}>
            Marcar leídas
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading ? (
          <p style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, margin: 0 }}>
            Cargando...
          </p>
        ) : notifications.length === 0 ? (
          <div style={{
            padding: '40px 16px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99,
              background: 'var(--paper-2, #f5f2ec)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted, #999)',
            }}>
              <Icon name="bell" size={20} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted, #999)', lineHeight: 1.5 }}>
              Sin notificaciones pendientes
            </span>
          </div>
        ) : notifications.map(notif => {
          const ic = iconFor(notif.type);
          return (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line, #e5e5e5)',
                cursor: 'pointer',
                background: notif.read ? 'transparent' : 'rgba(224,86,36,0.04)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover, #f0ede8)')}
              onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(224,86,36,0.04)')}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: ic.bg, color: ic.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={ic.name} size={15} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  gap: 6, marginBottom: 3,
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: notif.read ? 500 : 700,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {notif.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted, #999)', flexShrink: 0 }}>
                    {ago(notif.createdAt)}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--muted, #999)', lineHeight: 1.5,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {notif.message}
                </div>
              </div>

              {!notif.read && (
                <span style={{
                  width: 7, height: 7, borderRadius: 99, flexShrink: 0,
                  background: 'var(--accent, #e05624)', alignSelf: 'center',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="btn-icon"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        style={{
          border: 0,
          background: isOpen ? 'var(--card-hover)' : 'transparent',
          position: 'relative',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 16, height: 16, borderRadius: 99,
            background: 'var(--accent)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            boxShadow: '0 0 0 2px var(--paper)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Portal at body level — position:fixed so no overflow/stacking context issues */}
      {mounted && isOpen && dropdownEl && createPortal(dropdownEl, document.body)}
    </>
  );
}
