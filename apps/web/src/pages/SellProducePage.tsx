import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product } from '../types';

export const SellProducePage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customQty, setCustomQty] = useState('');
  const [availabilityOption, setAvailabilityOption] = useState('tomorrow');
  const [customDate, setCustomDate] = useState('');
  const [location, setLocation] = useState(farmer?.location || '');
  const [qualityEstimate, setQualityEstimate] = useState<'GOOD' | 'AVERAGE' | 'NEEDS_CHECKING'>('GOOD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (farmer?.location) {
      setLocation(farmer.location);
    }

    const loadProducts = async () => {
      const res = await api.getProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    };
    loadProducts();
  }, [farmer]);

  const productIcons: Record<string, string> = {
    Potatoes: '🥔',
    Onions: '🧅',
    Tomatoes: '🍅',
    Beans: '🫘',
    Maize: '🌽',
    Other: '📦',
  };

  const getResolvedAvailabilityDate = () => {
    const today = new Date();
    if (availabilityOption === 'today') {
      return today.toISOString().split('T')[0];
    } else if (availabilityOption === 'tomorrow') {
      const tm = new Date(today.getTime() + 86400000);
      return tm.toISOString().split('T')[0];
    } else if (availabilityOption === '3days') {
      const tm = new Date(today.getTime() + 3 * 86400000);
      return tm.toISOString().split('T')[0];
    } else if (availabilityOption === '1week') {
      const tm = new Date(today.getTime() + 7 * 86400000);
      return tm.toISOString().split('T')[0];
    } else if (availabilityOption === 'custom' && customDate) {
      return customDate;
    }
    return new Date(today.getTime() + 86400000).toISOString().split('T')[0];
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity || !location) {
      setError('Please ensure all required fields are complete.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      product_id: selectedProductId,
      quantity,
      unit: 'sack',
      availability_date: getResolvedAvailabilityDate(),
      quality_estimate: qualityEstimate,
      location,
      notes,
      source_channel: 'WEB',
    };

    const res = await api.submitProduce(payload);

    if (res.success && res.data) {
      setSubmissionSuccess(res.data);
    } else {
      setError(res.error || 'Produce submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  // SUCCESS SCREEN
  if (submissionSuccess) {
    return (
      <div className="mobile-wrapper animate-fade-in" style={{ justifyContent: 'center', textAlign: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-300)', marginBottom: '8px' }}>
          Produce Submitted Successfully!
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Villagio sourcing engine has registered your produce.
        </p>

        <div className="glass-card" style={{ textAlign: 'left', marginBottom: '24px', lineHeight: '1.8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Submission ID:</span>
            <strong style={{ color: 'var(--text-accent)' }}>{submissionSuccess.submission_id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Produce:</span>
            <strong>{submissionSuccess.product_name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Quantity:</span>
            <strong>{submissionSuccess.quantity} sacks (~{submissionSuccess.estimated_kg} kg)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Availability Date:</span>
            <strong>{submissionSuccess.availability_date}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Location:</span>
            <strong>{submissionSuccess.location}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px' }}>
            <span style={{ color: 'var(--text-dim)' }}>Collection Status:</span>
            <span className="badge badge-submitted">🟡 PENDING SOURCING</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => navigate('/farmer/produce')} className="btn btn-primary">
            View in My Produce 🥔
          </button>
          <button onClick={() => { setSubmissionSuccess(null); setStep(1); setSelectedProductId(null); }} className="btn btn-secondary">
            Submit Another Produce
          </button>
          <Link to="/farmer/dashboard" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '12px' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      {/* Header & Step Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => (step > 1 ? setStep(step - 1) : navigate('/farmer/dashboard'))} className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}>
            ← {t.back}
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)' }}>
            Step {step} of 6
          </span>
        </div>

        <div className="step-bar">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`step-segment ${step === s ? 'active' : step > s ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', marginBottom: '16px' }}>
          <p style={{ color: '#f87171', fontWeight: 600 }}>⚠️ {error}</p>
        </div>
      )}

      {/* STEP 1: SELECT PRODUCE */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t.step1Title}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>What harvest are you ready to sell?</p>

          <div className="choice-grid" style={{ marginBottom: '24px' }}>
            {products.map((p) => {
              const isSelected = selectedProductId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`choice-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="choice-icon">{productIcons[p.name] || '📦'}</div>
                  <div className="choice-title">{p.name}</div>
                  <div className="choice-subtitle">~{p.kg_per_unit} kg/sack</div>
                </div>
              );
            })}
          </div>

          <button
            disabled={!selectedProductId}
            onClick={() => setStep(2)}
            className="btn btn-primary"
          >
            {t.next}
          </button>
        </div>
      )}

      {/* STEP 2: QUANTITY */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t.step2Title}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
            Selected: <strong>{selectedProduct?.name}</strong>
          </p>

          <div className="choice-grid" style={{ marginBottom: '18px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                onClick={() => { setQuantity(s); setCustomQty(''); }}
                className={`choice-card ${quantity === s && !customQty ? 'selected' : ''}`}
              >
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{s}</div>
                <div className="choice-title">{s === 1 ? '1 Sack' : `${s} Sacks`}</div>
                <div className="choice-subtitle">~{s * (selectedProduct?.kg_per_unit || 90)} kg</div>
              </div>
            ))}

            {/* Custom Option */}
            <div
              onClick={() => { setQuantity(6); setCustomQty('6'); }}
              className={`choice-card ${customQty ? 'selected' : ''}`}
            >
              <div style={{ fontSize: '1.8rem' }}>📦</div>
              <div className="choice-title">More / Custom</div>
              <div className="choice-subtitle">Enter amount</div>
            </div>
          </div>

          {customQty !== '' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Enter exact number of sacks:</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 15"
                value={customQty}
                onChange={(e) => {
                  setCustomQty(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (val > 0) setQuantity(val);
                }}
                autoFocus
              />
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Total harvest estimate: </span>
            <strong style={{ color: 'var(--text-accent)' }}>{quantity} Sacks (~{quantity * (selectedProduct?.kg_per_unit || 90)} kg)</strong>
          </div>

          <button onClick={() => setStep(3)} className="btn btn-primary">
            {t.next}
          </button>
        </div>
      )}

      {/* STEP 3: AVAILABILITY */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t.step3Title}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>When can F.T.M.A collect your harvest?</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              { id: 'today', label: 'Today', icon: '⚡', desc: 'Ready for immediate pickup' },
              { id: 'tomorrow', label: 'Tomorrow', icon: '📅', desc: 'Ready by tomorrow morning' },
              { id: '3days', label: 'Within 3 Days', icon: '⏳', desc: 'Harvesting in progress' },
              { id: '1week', label: 'Within 1 Week', icon: '🌾', desc: 'Upcoming harvest' },
              { id: 'custom', label: 'Choose Specific Date', icon: '🗓️', desc: 'Select calendar date' },
            ].map((opt) => (
              <div
                key={opt.id}
                onClick={() => setAvailabilityOption(opt.id)}
                className={`glass-card interactive-card ${availabilityOption === opt.id ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderColor: availabilityOption === opt.id ? 'var(--primary-400)' : 'var(--border-subtle)',
                  background: availabilityOption === opt.id ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card)',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {availabilityOption === 'custom' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Pick date:</label>
              <input
                type="date"
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                required
              />
            </div>
          )}

          <button
            disabled={availabilityOption === 'custom' && !customDate}
            onClick={() => setStep(4)}
            className="btn btn-primary"
          >
            {t.next}
          </button>
        </div>
      )}

      {/* STEP 4: LOCATION */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t.step4Title}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>Pickup point for the collection truck</p>

          <div className="glass-card" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label className="form-label">Collection Location:</label>
              <input
                type="text"
                className="form-control"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Limuru, Kamirithu near Chief's camp"
                required
              />
            </div>

            {farmer?.location && location !== farmer.location && (
              <button
                type="button"
                onClick={() => setLocation(farmer.location)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Revert to Saved Location ({farmer.location})
              </button>
            )}
          </div>

          <button disabled={!location.trim()} onClick={() => setStep(5)} className="btn btn-primary">
            {t.next}
          </button>
        </div>
      )}

      {/* STEP 5: QUALITY ESTIMATE */}
      {step === 5 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t.step5Title}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>Farmer's quick assessment (formal grading happens at processing centre)</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {[
              { id: 'GOOD', title: 'Good Quality 🌟', desc: 'Freshly harvested, uniform size, dry, no damage' },
              { id: 'AVERAGE', title: 'Average Quality 👍', desc: 'Mixed sizes, standard grade produce' },
              { id: 'NEEDS_CHECKING', title: 'Needs Quality Check 🔍', desc: 'Requires sorting or grading assistance' },
            ].map((q) => (
              <div
                key={q.id}
                onClick={() => setQualityEstimate(q.id as any)}
                className={`glass-card interactive-card`}
                style={{
                  borderColor: qualityEstimate === q.id ? 'var(--primary-400)' : 'var(--border-subtle)',
                  background: qualityEstimate === q.id ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card)',
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{q.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{q.desc}</div>
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Optional notes for collection team:</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Near main road, reachable by 5-ton truck"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button onClick={() => setStep(6)} className="btn btn-primary">
            {t.next}
          </button>
        </div>
      )}

      {/* STEP 6: CONFIRMATION */}
      {step === 6 && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t.step6Title}</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>Please review your produce submission:</p>

          <div className="glass-card" style={{ marginBottom: '24px', lineHeight: '2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Produce:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-accent)' }}>
                {productIcons[selectedProduct?.name || ''] || '📦'} {selectedProduct?.name}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Quantity:</span>
              <strong>{quantity} Sacks (~{quantity * (selectedProduct?.kg_per_unit || 90)} kg)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Availability Date:</span>
              <strong>{getResolvedAvailabilityDate()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Pickup Location:</span>
              <strong style={{ maxWidth: '200px', textAlign: 'right', wordBreak: 'break-word' }}>{location}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Quality Estimate:</span>
              <strong>{qualityEstimate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Submission Channel:</span>
              <span className="badge badge-channel">🌐 WEB</span>
            </div>
          </div>

          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="btn btn-primary"
            style={{ padding: '18px', fontSize: '1.1rem', boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)' }}
          >
            {submitting ? 'Submitting to Villagio...' : `✅ ${t.confirmProduce}`}
          </button>
        </div>
      )}
    </div>
  );
};
