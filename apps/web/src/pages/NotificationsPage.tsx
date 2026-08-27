import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';

export const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!farmer) return;
    setLoading(true);
    const res = await api.getFarmerNotifications(farmer.id);
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [farmer]);

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!farmer) return;
    await api.markAllNotificationsRead(farmer.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/farmer/dashboard" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px' }}>
            ←
          </Link>
          <h2 style={{ fontSize: '1.5rem' }}>🔔 {t.notifications}</h2>
        </div>
        {notifications.some((n) => !n.read) && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.75rem' }}>
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">🔕</div>
          <h3 style={{ marginBottom: '8px' }}>No notifications yet</h3>
          <p style={{ fontSize: '0.85rem' }}>
            You will receive updates on produce collections, scheduling, and payments here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notif) => {
            const isUnread = !notif.read;

            return (
              <div
                key={notif.id}
                onClick={() => isUnread && handleMarkRead(notif.id)}
                className={`notification-item ${isUnread ? 'unread' : ''}`}
                style={{ cursor: isUnread ? 'pointer' : 'default' }}
              >
                <div style={{ fontSize: '1.6rem' }}>
                  {notif.type.includes('PAYMENT') ? '💰' : notif.type.includes('COLLECTION') ? '🚚' : '🌾'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: isUnread ? 'var(--text-accent)' : '#ffffff', fontSize: '0.95rem' }}>
                      {notif.title}
                    </strong>
                    {isUnread && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-400)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: isUnread ? '#f1f5f9' : 'var(--text-muted)', lineHeight: '1.4' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
