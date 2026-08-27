import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Payment } from '../types';

export const PaymentsPage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<{ pending_total: number; completed_total: number; total_count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmer) return;
    const loadPayments = async () => {
      setLoading(true);
      const res = await api.getFarmerPayments(farmer.id);
      if (res.success) {
        if (res.data) setPayments(res.data);
        if (res.totals) setTotals(res.totals);
      }
      setLoading(false);
    };
    loadPayments();
  }, [farmer]);

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Link to="/farmer/dashboard" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px' }}>
          ←
        </Link>
        <h2 style={{ fontSize: '1.5rem' }}>💰 {t.myPayments}</h2>
      </div>

      {/* Totals Header */}
      <div className="stats-grid">
        <div className="stat-box" style={{ borderLeft: '4px solid #38bdf8' }}>
          <span className="stat-label">Received (M-Pesa)</span>
          <span className="stat-value" style={{ color: '#38bdf8' }}>
            KES {(totals?.completed_total || 0).toLocaleString()}
          </span>
        </div>
        <div className="stat-box" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <span className="stat-label">Pending Payout</span>
          <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>
            KES {(totals?.pending_total || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        📱 Payout Account: <strong>{farmer?.phone}</strong> (M-Pesa)
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">💵</div>
          <h3 style={{ marginBottom: '8px' }}>No payment records yet</h3>
          <p style={{ fontSize: '0.85rem' }}>
            When your harvest is collected, M-Pesa disbursements will show here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {payments.map((p) => {
            const isCompleted = p.status === 'COMPLETED';

            return (
              <div key={p.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: isCompleted ? '#38bdf8' : 'var(--accent-gold)' }}>
                      KES {p.amount.toLocaleString()}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {p.product_name ? `${p.quantity || ''} ${p.unit || 'sacks'} of ${p.product_name}` : 'Produce Payout'}
                    </p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: isCompleted ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: isCompleted ? '#38bdf8' : '#facc15',
                      borderColor: isCompleted ? 'rgba(56, 189, 248, 0.3)' : 'rgba(234, 179, 8, 0.3)',
                    }}
                  >
                    {isCompleted ? '✅ PAID' : '⏳ PENDING'}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: '1.6', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Method:</span>
                    <strong style={{ color: '#fff' }}>{p.method}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date:</span>
                    <span>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  {p.transaction_reference && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>Ref / Receipt:</span>
                      <code style={{ color: 'var(--text-accent)' }}>{p.transaction_reference}</code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
