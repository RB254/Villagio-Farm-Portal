import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('0711000001');
  const [pin, setPin] = useState('1111');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(phone, pin);
    if (res.success) {
      navigate('/farmer/dashboard');
    } else {
      setError(res.error || 'Invalid phone or PIN. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoPhone: string, demoPin: string) => {
    setPhone(demoPhone);
    setPin(demoPin);
    setError('');
    setLoading(true);
    const res = await login(demoPhone, demoPin);
    if (res.success) {
      navigate('/farmer/dashboard');
    } else {
      setError(res.error || 'Invalid phone or PIN. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/farmer" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px' }}>
          ←
        </Link>
        <h2 style={{ fontSize: '1.6rem', color: '#184037' }}>🔑 {t.login}</h2>
      </div>

      {error && (
        <div className="glass-card" style={{ borderColor: '#ef4444', background: '#fef2f2', marginBottom: '20px' }}>
          <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>⚠️ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <label className="form-label">{t.phone}</label>
          <input
            type="tel"
            className="form-control"
            placeholder="e.g. 0711000001"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.pin}</label>
          <input
            type="password"
            maxLength={4}
            className="form-control"
            placeholder="4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-brand-primary" style={{ marginTop: '8px' }}>
          {loading ? 'Verifying...' : `🌱 ${t.login}`}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            New to Villagio?{' '}
            <Link to="/farmer/register" style={{ color: '#ed7423', fontWeight: 700 }}>
              {t.register}
            </Link>
          </p>
        </div>
      </form>

      {/* Quick Demo Logins Helper */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ed7423', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚡ 1-CLICK QUICK DEMO LOGINS:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('0711000001', '1111')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '10px 10px', textAlign: 'left', display: 'block' }}
          >
            <strong style={{ color: '#184037', display: 'block' }}>Farmer A (Alice)</strong>
            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>0711000001 / 1111</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('0711000002', '2222')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '10px 10px', textAlign: 'left', display: 'block' }}
          >
            <strong style={{ color: '#184037', display: 'block' }}>Farmer B (Bernard)</strong>
            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>0711000002 / 2222</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('0711000003', '3333')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '10px 10px', textAlign: 'left', display: 'block' }}
          >
            <strong style={{ color: '#184037', display: 'block' }}>Farmer C (Caroline)</strong>
            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>0711000003 / 3333</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('0711000004', '4444')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '10px 10px', textAlign: 'left', display: 'block' }}
          >
            <strong style={{ color: '#184037', display: 'block' }}>Farmer D (David)</strong>
            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>0711000004 / 4444</span>
          </button>
        </div>
      </div>
    </div>
  );
};
