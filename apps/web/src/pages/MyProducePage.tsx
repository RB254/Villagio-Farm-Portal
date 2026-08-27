import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FarmerProduce } from '../types';
import { ProduceStatusBadge, ChannelBadge } from '../components/StatusBadge';

export const MyProducePage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();

  const [produce, setProduce] = useState<FarmerProduce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!farmer) return;
    const loadProduce = async () => {
      setLoading(true);
      const res = await api.getFarmerProduce(farmer.id);
      if (res.success && res.data) {
        setProduce(res.data);
      }
      setLoading(false);
    };
    loadProduce();
  }, [farmer]);

  const filteredProduce = produce.filter((p) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['SUBMITTED', 'AVAILABLE', 'COLLECTION_REQUESTED', 'COLLECTION_SCHEDULED'].includes(p.status);
    if (filter === 'COMPLETED') return ['COLLECTED', 'PROCESSING', 'SOLD', 'COMPLETED'].includes(p.status);
    return true;
  });

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/farmer/dashboard" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px' }}>
            ←
          </Link>
          <h2 style={{ fontSize: '1.5rem' }}>🥔 {t.myProduce}</h2>
        </div>
        <Link to="/farmer/sell" className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}>
          + Add
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'ACTIVE', 'COMPLETED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`btn btn-secondary`}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              background: filter === tab ? 'var(--primary-700)' : 'rgba(255,255,255,0.06)',
              borderColor: filter === tab ? 'var(--primary-400)' : 'var(--border-subtle)',
              color: filter === tab ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'In Progress' : 'Collected / Done'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading your produce records...</p>
        </div>
      ) : filteredProduce.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">🌾</div>
          <h3 style={{ marginBottom: '8px' }}>No produce found</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
            You haven't submitted any produce in this view yet.
          </p>
          <Link to="/farmer/sell" className="btn btn-primary">
            + Sell Your Harvest
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProduce.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                    {item.product_name || 'Produce'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    ID: {item.submission_id} • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ProduceStatusBadge status={item.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.85rem', margin: '10px 0', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Quantity:</span>
                  <strong style={{ color: 'var(--text-accent)' }}>{item.quantity} {item.unit}s</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}> (~{item.estimated_kg} kg)</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Ready by:</span>
                  <strong>{item.availability_date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Location:</span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{item.location}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>Submitted via:</span>
                  <ChannelBadge channel={item.source_channel} />
                </div>
              </div>

              {item.status === 'COLLECTION_SCHEDULED' && (
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🚚 Collection truck assigned</span>
                  <Link to="/farmer/collections" style={{ fontWeight: 700, textDecoration: 'underline' }}>Track ➔</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
