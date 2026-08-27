import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Globe, Plus, User, LogOut, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { farmer, logout, admin, adminLogout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="bg-[#184037] text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner strip */}
      <div className="bg-[#0f2923] text-xs py-1.5 px-4 text-emerald-100 border-b border-[#23594e]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>🚀 Direct Farm-to-Market Supply Chain</span>
            <span className="hidden sm:inline text-emerald-300/40">|</span>
            <span className="hidden sm:inline text-emerald-200/80">Toll-Free Farmer Support: 0800 720 000</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="hover:text-[#f6b787] font-medium transition-colors flex items-center gap-1.5 text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#f6b787]" />
              <span>{language === 'en' ? 'KE Kiswahili' : 'GB English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to={isAdminRoute ? '/admin' : (farmer ? '/farmer/dashboard' : '/farmer')} className="flex items-center gap-3 group">
          <div className="bg-white px-2.5 py-1 rounded-xl shadow-sm flex items-center justify-center">
            <img src="/villagio-logo.png" alt="Villagio Farm Fresh" className="h-7 w-auto object-contain" />
          </div>
          {isAdminRoute && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#ed7423] text-white tracking-wider">
              <Shield className="w-3 h-3" /> Ops Console
            </span>
          )}
        </Link>

        {/* Global Search Bar (Marketplace style) */}
        {!isAdminRoute && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search fresh produce (Potatoes, Onions, Tomatoes)..."
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ed7423] border border-slate-200 shadow-sm"
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#ed7423] text-white rounded-lg text-xs hover:bg-[#db6314] transition-colors flex items-center justify-center">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isAdminRoute && farmer && (
            <div className="flex items-center gap-3">
              <Link
                to="/farmer/sell"
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#ed7423] hover:bg-[#db6314] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> {t.sellProduce}
              </Link>
              <Link
                to="/farmer/profile"
                className="flex items-center gap-2 bg-[#23594e] hover:bg-[#2c6e61] px-3 py-1.5 rounded-xl transition-colors text-xs text-white"
              >
                <span className="w-6 h-6 rounded-full bg-[#184037] border border-[#f6b787] flex items-center justify-center font-bold text-[#f6b787]">
                  {farmer.full_name.charAt(0)}
                </span>
                <span className="font-medium hidden sm:inline">{farmer.full_name.split(' ')[0]}</span>
              </Link>
              <button
                onClick={() => { logout(); navigate('/farmer/login'); }}
                className="text-xs text-emerald-200 hover:text-white px-2 py-1 transition-colors flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          )}

          {isAdminRoute && admin && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-200 font-medium hidden sm:inline">
                Admin: <strong className="text-white">{admin.username}</strong>
              </span>
              <button
                onClick={() => { adminLogout(); navigate('/admin/login'); }}
                className="bg-[#ed7423] hover:bg-[#db6314] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {!farmer && !admin && !isAdminRoute && (
            <div className="flex items-center gap-2">
              <Link
                to="/farmer/login"
                className="text-xs font-semibold text-white hover:text-[#f6b787] px-3 py-1.5 transition-colors"
              >
                {t.login}
              </Link>
              <Link
                to="/farmer/register"
                className="bg-[#ed7423] hover:bg-[#db6314] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                {t.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const FarmerBottomNav: React.FC = () => {
  const location = useLocation();
  const { farmer } = useAuth();

  if (!farmer) return null;

  const links = [
    { path: '/farmer/dashboard', label: 'Home', icon: '🏠' },
    { path: '/farmer/sell', label: 'Sell', icon: '➕' },
    { path: '/farmer/produce', label: 'Produce', icon: '🥔' },
    { path: '/farmer/collections', label: 'Collections', icon: '🚚' },
    { path: '/farmer/notifications', label: 'Alerts', icon: '🔔' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2.5 px-4 z-40 md:hidden shadow-lg">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#ed7423] font-bold' : 'text-slate-500 hover:text-[#184037]'
            }`}
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
