import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Radio, PhoneCall, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ justifyContent: 'center', minHeight: '85vh' }}>
      {/* Brand Hero */}
      <div className="text-center mb-8">
        <div className="inline-block bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-5">
          <img src="/villagio-logo.png" alt="Villagio Farm Fresh" className="h-16 w-auto object-contain mx-auto" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-[#ed7423] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Direct Farm-to-Market Marketplace
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#184037] leading-tight mb-2">
          {t.tagline}
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          "The system adapts to the smallholder farmer — register your harvest and receive automated M-Pesa payments on collection."
        </p>
      </div>

      {/* Primary Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 mb-6">
        {farmer ? (
          <Link
            to="/farmer/dashboard"
            className="w-full bg-[#184037] hover:bg-[#23594e] text-white font-bold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>Karibu, {farmer.full_name.split(' ')[0]} — Open Dashboard</span>
            <ArrowRight className="w-4 h-4 text-[#f6b787]" />
          </Link>
        ) : (
          <>
            <Link
              to="/farmer/login"
              className="w-full bg-[#184037] hover:bg-[#23594e] text-white font-bold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>🔑 {t.login}</span>
              <ArrowRight className="w-4 h-4 text-[#f6b787]" />
            </Link>
            <Link
              to="/farmer/register"
              className="w-full bg-white hover:bg-slate-50 text-[#184037] border border-slate-200 hover:border-slate-300 font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>📝 {t.register} (Create New Account)</span>
            </Link>
          </>
        )}
      </div>

      {/* Multi-channel Accessibility Info Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
        <div className="text-[11px] font-bold text-[#ed7423] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Accessible from Any Device
        </div>
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-[#F8F9FA] border border-slate-100 p-3 rounded-xl">
            <Smartphone className="w-6 h-6 text-[#184037] mx-auto mb-1" />
            <div className="font-bold text-xs text-slate-800">Smart Web</div>
            <div className="text-[10px] text-slate-400">PWA & Offline</div>
          </div>
          <div className="bg-[#F8F9FA] border border-slate-100 p-3 rounded-xl">
            <Radio className="w-6 h-6 text-[#ed7423] mx-auto mb-1" />
            <div className="font-bold text-xs text-slate-800">USSD Code</div>
            <div className="text-[10px] text-slate-400">*384*100#</div>
          </div>
          <div className="bg-[#F8F9FA] border border-slate-100 p-3 rounded-xl">
            <PhoneCall className="w-6 h-6 text-[#184037] mx-auto mb-1" />
            <div className="font-bold text-xs text-slate-800">IVR Voice</div>
            <div className="text-[10px] text-slate-400">Toll-Free Call</div>
          </div>
        </div>
      </div>

      {/* Quick link to Admin / Simulators */}
      <div className="text-center">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#ed7423] font-medium transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Operations Command Center & Simulators</span>
        </Link>
      </div>
    </div>
  );
};
