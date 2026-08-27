import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer, refreshFarmer, logout } = useAuth();

  const [formData, setFormData] = useState({
    full_name: farmer?.full_name || '',
    county: farmer?.county || 'Kiambu',
    sub_county: farmer?.sub_county || '',
    location: farmer?.location || '',
    preferred_language: farmer?.preferred_language || 'en',
    preferred_channel: farmer?.preferred_channel || 'WEB',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!farmer) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const res = await api.updateFarmerProfile(farmer.id, formData);
    if (res.success) {
      await refreshFarmer();
      setMsg('Profile updated successfully! ✅');
    } else {
      setMsg('Failed to update profile: ' + (res.error || ''));
    }
    setLoading(false);
  };

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Link to="/farmer/dashboard" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px' }}>
          ←
        </Link>
        <h2 style={{ fontSize: '1.5rem' }}>👤 {t.profile}</h2>
      </div>

      {msg && (
        <div className="glass-card" style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'var(--primary-400)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--primary-300)', fontWeight: 600 }}>{msg}</p>
        </div>
      )}

      {/* Farmer ID Card */}
      <div className="glass-card" style={{ marginBottom: '18px', background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.4) 0%, rgba(5, 46, 22, 0.6) 100%)', border: '1.5px solid var(--primary-500)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              VILLAGIO FARMER ID
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {farmer.farmer_id}
            </div>
          </div>
          <div style={{ fontSize: '2.5rem' }}>🌾</div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Phone Identifier: <strong>{farmer.phone}</strong>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="glass-card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">{t.fullName}</label>
          <input
            type="text"
            className="form-control"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.county}</label>
          <input
            type="text"
            className="form-control"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.subCounty}</label>
          <input
            type="text"
            className="form-control"
            value={formData.sub_county}
            onChange={(e) => setFormData({ ...formData, sub_county: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.location}</label>
          <input
            type="text"
            className="form-control"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Preferred Communication Channel</label>
          <select
            className="form-control"
            value={formData.preferred_channel}
            onChange={(e) => setFormData({ ...formData, preferred_channel: e.target.value as any })}
          >
            <option value="WEB" style={{ background: '#0b1e13', color: '#fff' }}>Smartphone / Web PWA</option>
            <option value="USSD" style={{ background: '#0b1e13', color: '#fff' }}>USSD (*XXX#)</option>
            <option value="IVR" style={{ background: '#0b1e13', color: '#fff' }}>IVR Voice Calls</option>
            <option value="SMS" style={{ background: '#0b1e13', color: '#fff' }}>SMS</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
          {loading ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>

      <button onClick={logout} className="btn btn-outline-danger">
        🚪 {t.logout}
      </button>
    </div>
  );
};
