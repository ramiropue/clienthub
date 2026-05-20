"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { AppNotification, getNotifications, markNotificationsAsRead } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface NotificationsBellProps {
  recipient: 'admin' | 'client';
  clientId?: string;
  align?: 'left' | 'right'; // Dropdown alignment relative to the button
}

export function NotificationsBell({ recipient, clientId, align = 'right' }: NotificationsBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = async () => {
    const data = await getNotifications(recipient, clientId);
    setNotifications(data);
  };

  useEffect(() => {
    loadNotifications();

    // Listen to changes in notifications table
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [recipient, clientId]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const success = await markNotificationsAsRead(unreadIds);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationsAsRead([notif.id]);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setIsOpen(false);

    if (notif.workId) {
      if (recipient === 'admin') {
        router.push(`/admin/work/${notif.workId}`);
      } else {
        router.push(`/client/${clientId || notif.clientId}/work/${notif.workId}`);
      }
    }
  };

  // Helper to choose the right icon and color
  const getIconConfig = (type: string) => {
    switch (type) {
      case 'mensaje':
        return { name: 'chat', color: 'var(--accent)', bg: 'rgba(224, 86, 36, 0.1)' };
      case 'estado':
        return { name: 'check', color: 'var(--ok)', bg: 'rgba(40, 167, 69, 0.1)' };
      case 'nuevo_trabajo':
      default:
        return { name: 'calendar', color: 'var(--ink)', bg: 'var(--card-hover)' };
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon"
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
        }}
        aria-label="Notificaciones"
      >
        <Icon name="bell" size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 14,
              height: 14,
              borderRadius: 99,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px var(--paper)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: align === 'left' ? 0 : 'calc(100% + 8px)',
            left: align === 'left' ? 'calc(100% + 8px)' : 'auto',
            right: align === 'right' ? 0 : 'auto',
            zIndex: 999,
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            width: 320,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="row between"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--line)',
              alignItems: 'center',
              background: 'var(--paper-2)'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 320, overflowY: 'auto', background: 'var(--card)' }}>
            {notifications.length === 0 ? (
              <div
                className="col gap-2"
                style={{
                  padding: '32px 16px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 99,
                    background: 'var(--paper-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)',
                  }}
                >
                  <Icon name="check" size={16} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>No tienes notificaciones pendientes</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map(notif => {
                  const config = getIconConfig(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--line)',
                        cursor: 'pointer',
                        background: notif.read ? 'transparent' : 'rgba(224, 86, 36, 0.03)',
                        display: 'flex',
                        gap: 12,
                        transition: 'background 0.2s',
                        alignItems: 'flex-start',
                      }}
                      className="notification-item"
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: config.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: config.color,
                        }}
                      >
                        <Icon name={config.name} size={14} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: notif.read ? 500 : 600,
                            color: 'var(--ink)',
                            lineHeight: 1.3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: 4,
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {notif.title}
                          </span>
                          <span style={{ fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                            marginTop: 3,
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {notif.message}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notif.read && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 99,
                            background: 'var(--accent)',
                            alignSelf: 'center',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
