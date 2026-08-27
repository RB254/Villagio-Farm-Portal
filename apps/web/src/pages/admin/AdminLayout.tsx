import React from 'react';
import { Link, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Boxes,
  TrendingUp,
  PackageCheck,
  Truck,
  AlertTriangle,
  Radio,
  PhoneCall,
  History,
  MessageSquare,
  Search,
  Globe,
  LogOut,
  ArrowRightLeft
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { admin, adminLogout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'Operations Dashboard', icon: LayoutDashboard },
    { path: '/admin/farmers', label: 'Farmer Directory', icon: Users },
    { path: '/admin/produce', label: 'Produce Submissions', icon: ShoppingBag },
    { path: '/admin/sourcing', label: 'Sourcing Engine', icon: Boxes },
    { path: '/admin/demand', label: 'Demand & Forecasting', icon: TrendingUp },
    { path: '/admin/collections', label: 'Collection Orders', icon: PackageCheck },
    { path: '/admin/logistics', label: 'F.T.M.A Logistics Hub', icon: Truck },
    { path: '/admin/exceptions', label: 'Exceptions System', icon: AlertTriangle },
    { path: '/admin/ussd-simulator', label: 'USSD Simulator', icon: Radio },
    { path: '/admin/ivr-simulator', label: 'IVR Voice Simulator', icon: PhoneCall },
    { path: '/admin/audit-logs', label: 'Audit Trail', icon: History },
    { path: '/admin/sms-logs', label: 'SMS Gateway', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="bg-[#184037] text-white px-6 py-3 flex items-center justify-between shadow-md z-30 border-b-2 border-[#ed7423]">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="bg-white px-3 py-1 rounded-xl shadow-sm flex items-center justify-center">
              <img src="/villagio-logo.png" alt="Villagio Farm Fresh" className="h-7 w-auto object-contain" />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 bg-[#ed7423] text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              ADMIN OPS CONSOLE
            </span>
          </Link>
        </div>

        {/* Top Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64">
            <input
              type="text"
              placeholder="Search farmers, orders, IDs..."
              className="w-full bg-[#0f2923] text-white text-xs pl-8 pr-3 py-2 rounded-lg border border-[#23594e] focus:outline-none focus:border-[#ed7423] placeholder-emerald-200/50"
            />
            <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="text-xs text-emerald-100 hover:text-white bg-[#23594e] hover:bg-[#2c6e61] px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-[#f6b787]" />
            <span>{language === 'en' ? 'KE Kiswahili' : 'GB English'}</span>
          </button>

          <div className="flex items-center gap-3 border-l border-[#23594e] pl-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{admin.username}</div>
              <div className="text-[10px] text-[#f6b787] font-semibold">Super Admin</div>
            </div>
            <button
              onClick={() => { adminLogout(); navigate('/admin/login'); }}
              className="bg-[#ed7423] hover:bg-[#db6314] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 min-h-[calc(100vh-60px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-1 shrink-0 shadow-sm">
          <div className="px-3 py-2 mb-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-xs font-bold text-[#184037] uppercase tracking-wider">
              VILLAGIO OPS
            </div>
            <div className="text-[11px] text-slate-500">
              Zero-Inventory Automation
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-[#184037] text-white shadow-sm font-bold border-l-4 border-[#ed7423]'
                      : 'text-slate-600 hover:bg-[#f1f5f9] hover:text-[#184037]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#f6b787]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200 space-y-2 mt-auto">
            <Link
              to="/farmer/dashboard"
              className="flex items-center justify-center gap-2 w-full text-center py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-[#184037] font-semibold text-xs rounded-xl transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Switch to Farmer App</span>
            </Link>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 bg-[#F8F9FA] overflow-y-auto max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
