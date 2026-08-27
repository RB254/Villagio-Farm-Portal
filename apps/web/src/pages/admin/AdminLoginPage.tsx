import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await adminLogin(username, pin);
    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Admin login failed. Default is admin / 1234');
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setUsername('admin');
    setPin('1234');
    setError('');
    setLoading(true);
    const res = await adminLogin('admin', '1234');
    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Admin login failed. Default is admin / 1234');
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg pl-4 pr-4 py-3 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#184037] rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold text-[#184037]">Villagio Admin</h2>
          <p className="text-xs text-slate-500 mt-1">Operations & Multi-Channel Control Console</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 shadow-sm">
            <p className="text-rose-700 font-semibold text-xs">⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Username</label>
            <input
              type="text"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Security PIN</label>
            <input
              type="password"
              className={inputClass}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#184037] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#23594e] transition-colors shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Access Admin Console'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleQuickAdmin}
            className="w-full bg-emerald-50 border border-emerald-200 text-[#184037] hover:bg-emerald-100 font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm"
          >
            ⚡ 1-Click Quick Admin Login (admin / 1234)
          </button>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-400">
              Default seeded credentials: <strong className="text-slate-600">admin</strong> / <strong className="text-slate-600">1234</strong>
            </span>
          </div>
        </form>

        <div className="text-center mt-5">
          <Link to="/farmer" className="text-xs text-slate-500 hover:text-[#ed7423] transition-colors font-medium">
            ← Back to Farmer App
          </Link>
        </div>
      </div>
    </div>
  );
};
