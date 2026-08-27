import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CollectionRequest } from '../types';
import { CollectionStatusBadge } from '../components/StatusBadge';

export const CollectionsPage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();

  const [collections, setCollections] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmer) return;
    const loadCollections = async () => {
      setLoading(true);
      const res = await api.getCollections();
      if (res.success && res.data) {
        setCollections(res.data);
      }
      setLoading(false);
    };
    loadCollections();
  }, [farmer]);

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 1;
      case 'ACCEPTED':
        return 2;
      case 'VEHICLE_ASSIGNED':
      case 'ROUTE_PLANNED':
      case 'IN_PROGRESS':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Link to="/farmer/dashboard" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px' }}>
          ←
        </Link>
        <h2 style={{ fontSize: '1.5rem' }}>🚚 {t.collectionStatus}</h2>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Automated farm-to-market dispatch powered by <strong>F.T.M.A Logistics</strong>.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading collection requests...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">🚚</div>
          <h3 style={{ marginBottom: '8px' }}>No active collection requests</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
            Once the sourcing engine aggregates enough supply in your cluster, a truck pickup will be scheduled here automatically.
          </p>
          <Link to="/farmer/sell" className="btn btn-primary">
            + Submit Produce
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {collections.map((c) => {
            const stepNumber = getStepProgress(c.status);

            return (
              <div key={c.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 700 }}>
                      ORDER {c.collection_id}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                      {c.product_name || 'Produce'} • {c.quantity} Sacks
                    </h3>
                  </div>
                  <CollectionStatusBadge status={c.status} />
                </div>

                {/* Logistics Partner Tag */}
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Logistics Partner:</span>
                    <strong>Farm To Market Alliance (F.T.M.A)</strong>
                  </div>
                  {c.vehicle_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Assigned Vehicle:</span>
                      <strong style={{ color: 'var(--text-accent)' }}>🚛 {c.vehicle_id}</strong>
                    </div>
                  )}
                  {c.driver_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Driver ID:</span>
                      <span>{c.driver_id}</span>
                    </div>
                  )}
                </div>

                {/* Tracking Stepper / Timeline */}
                <div className="timeline">
                  <div className={`timeline-item ${stepNumber >= 1 ? 'completed' : ''}`}>
                    <div className="timeline-dot">1</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: stepNumber >= 1 ? '#fff' : 'var(--text-dim)' }}>
                      Collection Requested
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Sourcing engine aggregate matched</div>
                  </div>

                  <div className={`timeline-item ${stepNumber >= 2 ? 'completed' : stepNumber === 1 ? 'active' : ''}`}>
                    <div className="timeline-dot">2</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: stepNumber >= 2 ? '#fff' : 'var(--text-dim)' }}>
                      F.T.M.A Accepted & Scheduled
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Scheduled Date: {c.scheduled_date} ({c.time_window})
                    </div>
                  </div>

                  <div className={`timeline-item ${stepNumber >= 3 ? 'completed' : stepNumber === 2 ? 'active' : ''}`}>
                    <div className="timeline-dot">3</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: stepNumber >= 3 ? '#fff' : 'var(--text-dim)' }}>
                      Truck Dispatched
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Pickup at: {c.pickup_location}
                    </div>
                  </div>

                  <div className={`timeline-item ${stepNumber >= 4 ? 'completed' : ''}`}>
                    <div className="timeline-dot">4</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: stepNumber >= 4 ? '#fff' : 'var(--text-dim)' }}>
                      Delivered to Processing Centre
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Grading & direct M-Pesa payout</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
