import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const HelpPage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();

  const [ticketModal, setTicketModal] = useState(false);
  const [issueType, setIssueType] = useState('GENERAL');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState('');

  const faqs = [
    { q: t.faq1Q, a: t.faq1A, icon: '🌾' },
    { q: t.faq2Q, a: t.faq2A, icon: '🚚' },
    { q: t.faq3Q, a: t.faq3A, icon: '💰' },
    { q: t.faq4Q, a: t.faq4A, icon: '🏢' },
  ];

  const handleSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    const res = await api.submitSupportRequest({ issue_type: issueType, description });

    if (res.success) {
      setSubmittedMsg('Your support request has been logged. Our field agent will call you shortly.');
      setDescription('');
      setTimeout(() => {
        setTicketModal(false);
        setSubmittedMsg('');
      }, 2500);
    }
    setSubmitting(false);
  };

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Link to="/farmer/dashboard" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px' }}>
          ←
        </Link>
        <h2 style={{ fontSize: '1.5rem' }}>📞 {t.helpSupport}</h2>
      </div>

      {/* Call Villagio Support CTA */}
      <div className="glass-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.35) 0%, rgba(15, 34, 23, 0.8) 100%)', border: '1.5px solid var(--primary-400)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '2.5rem' }}>☎️</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Villagio Farmer Helpline</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>Toll-Free • Swahili & English</p>
          </div>
        </div>

        <a
          href="tel:0800720000"
          className="btn btn-primary"
          style={{ marginBottom: '10px', fontSize: '1.05rem', textDecoration: 'none' }}
        >
          📞 PIGA SIMU: 0800 720 000
        </a>

        {farmer && (
          <button
            onClick={() => setTicketModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            ✉️ {t.submitTicket}
          </button>
        )}
      </div>

      {/* FAQs Section */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{t.faqs}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.2rem' }}>{faq.icon}</span>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{faq.q}</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      {/* Support Ticket Modal */}
      {ticketModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 999,
          }}
        >
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', background: '#0b1e13' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>📝 Support Request</h3>
              <button
                onClick={() => setTicketModal(false)}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>

            {submittedMsg ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✅</div>
                <p style={{ color: 'var(--primary-300)', fontWeight: 600 }}>{submittedMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSupportTicket}>
                <div className="form-group">
                  <label className="form-label">Issue Category</label>
                  <select
                    className="form-control"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                  >
                    <option value="GENERAL" style={{ background: '#0b1e13' }}>General Inquiry</option>
                    <option value="COLLECTION" style={{ background: '#0b1e13' }}>Collection / Pickup Delay</option>
                    <option value="PAYMENT" style={{ background: '#0b1e13' }}>M-Pesa Payment Status</option>
                    <option value="QUALITY" style={{ background: '#0b1e13' }}>Produce Quality / Grading</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Explain what you need help with:</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="e.g. My collection was scheduled for today but the truck hasn't arrived yet..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
