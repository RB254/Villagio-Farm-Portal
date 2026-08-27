import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { refreshFarmer } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    pin: '',
    county: 'Kiambu',
    sub_county: '',
    location: '',
    preferred_language: language,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success'>('idle');

  const counties = ['Kiambu', 'Murang\'a', 'Nyeri', 'Nyandarua', 'Nakuru', 'Kirinyaga', 'Machakos', 'Embu', 'Meru', 'Uasin Gishu'];

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      setGpsStatus('locating');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
          setGpsStatus('success');
        },
        () => {
          setGpsStatus('idle');
          alert('Could not retrieve GPS coordinates. You can type your location name manually.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name || !formData.phone || !formData.pin || !formData.sub_county || !formData.location) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits (e.g. 1234).');
      return;
    }

    setLoading(true);

    const res = await api.register(formData);

    if (res.success && res.data) {
      localStorage.setItem('villagio_token', res.data.token);
      await refreshFarmer();
      setSuccessMsg('Karibu Villagio! Your farmer account has been created successfully.');
      setTimeout(() => {
        navigate('/farmer/dashboard');
      }, 1500);
    } else {
      setError(res.error || 'Registration failed. Please check your phone number.');
      setLoading(false);
    }
  };

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/farmer" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px' }}>
          ←
        </Link>
        <h2 style={{ fontSize: '1.6rem' }}>🌱 {t.register}</h2>
      </div>

      {successMsg && (
        <div className="glass-card" style={{ borderColor: 'var(--primary-400)', background: 'rgba(34, 197, 94, 0.15)', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>🎉</div>
          <h3 style={{ color: 'var(--primary-300)', margin: '8px 0' }}>{successMsg}</h3>
          <p style={{ fontSize: '0.85rem' }}>Redirecting to your dashboard...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', marginBottom: '20px' }}>
          <p style={{ color: '#f87171', fontWeight: 600 }}>⚠️ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-group">
          <label className="form-label">{t.fullName} *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Alice Wanjiku"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.phone} (M-Pesa) *</label>
          <input
            type="tel"
            className="form-control"
            placeholder="e.g. 0711 000 001"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.pin} *</label>
          <input
            type="password"
            maxLength={4}
            className="form-control"
            placeholder="4 numbers (e.g. 1234)"
            value={formData.pin}
            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.county} *</label>
          <select
            className="form-control"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
          >
            {counties.map((c) => (
              <option key={c} value={c} style={{ background: '#0b1e13', color: '#fff' }}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t.subCounty} *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Limuru / Ruiru"
            value={formData.sub_county}
            onChange={(e) => setFormData({ ...formData, sub_county: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.location} *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Limuru, Kamirithu Village"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 GPS Coordinates (Optional)</span>
            <button
              type="button"
              onClick={handleGetLocation}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }}
            >
              {gpsStatus === 'locating' ? 'Locating...' : gpsStatus === 'success' ? '✓ Captured' : 'Get Current GPS'}
            </button>
          </div>
          {formData.latitude && (
            <p style={{ fontSize: '0.75rem', color: 'var(--primary-400)', marginTop: '4px' }}>
              Lat: {formData.latitude.toFixed(4)}, Long: {formData.longitude?.toFixed(4)}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '12px' }}>
          {loading ? 'Creating Account...' : `🌱 ${t.register}`}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/farmer/login" style={{ color: 'var(--primary-400)', fontWeight: 700 }}>
              {t.login}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
