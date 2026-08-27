import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FarmerProduce, Payment } from '../types';
import {
  Plus,
  ShoppingBag,
  Truck,
  DollarSign,
  Bell,
  HelpCircle,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { farmer } = useAuth();
  const navigate = useNavigate();

  const [produceList, setProduceList] = useState<FarmerProduce[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmer) return;

    const loadData = async () => {
      setLoading(true);
      const [prodRes, payRes, notifRes] = await Promise.all([
        api.getFarmerProduce(farmer.id),
        api.getFarmerPayments(farmer.id),
        api.getFarmerNotifications(farmer.id),
      ]);

      if (prodRes.success && prodRes.data) setProduceList(prodRes.data);
      if (payRes.success && payRes.data) setPayments(payRes.data);
      if (notifRes.success && notifRes.unread_count !== undefined) setUnreadCount(notifRes.unread_count);

      setLoading(false);
    };

    loadData();
  }, [farmer]);

  if (!farmer) {
    return (
      <div className="mobile-wrapper text-center justify-center p-8">
        <p className="text-slate-500 text-sm">Please log in to view your farmer portal.</p>
        <Link to="/farmer/login" className="btn btn-brand-primary mt-4">Go to Login</Link>
      </div>
    );
  }

  // Summary Metrics
  const availableSacks = produceList
    .filter((p) => p.status === 'SUBMITTED' || p.status === 'AVAILABLE')
    .reduce((acc, p) => acc + p.quantity, 0);

  const pendingCollectionCount = produceList
    .filter((p) => p.status === 'COLLECTION_REQUESTED' || p.status === 'COLLECTION_SCHEDULED').length;

  const completedPaidAmount = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="mobile-wrapper animate-fade-in" style={{ paddingBottom: '90px' }}>
      {/* Header Welcome */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-500 font-medium">{t.karibu},</div>
            <h1 className="text-xl font-bold text-[#184037]">
              {farmer.full_name}
            </h1>
          </div>
          <Link
            to="/farmer/profile"
            className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#184037] hover:bg-emerald-100 transition-colors shadow-xs"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
          <span className="bg-emerald-50 text-[#184037] px-2.5 py-0.5 rounded-md font-bold font-mono border border-emerald-100">
            ID: {farmer.farmer_id}
          </span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" /> {farmer.location}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-[#184037]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.availableProduce}</div>
          <div className="text-xl font-extrabold text-[#184037] mt-1">
            {loading ? '...' : `${availableSacks} sacks`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for collection</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-[#ed7423]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.pendingCollection}</div>
          <div className="text-xl font-extrabold text-[#ed7423] mt-1">
            {loading ? '...' : `${pendingCollectionCount} orders`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In route fulfillment</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-sky-500 col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.completedPayments}</div>
              <div className="text-2xl font-extrabold text-sky-700 mt-1">
                {loading ? '...' : `KES ${completedPaidAmount.toLocaleString()}`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Primary Action: SELL MY PRODUCE */}
      <div className="mb-5">
        <button
          onClick={() => navigate('/farmer/sell')}
          className="w-full bg-[#ed7423] hover:bg-[#db6314] text-white p-4 rounded-2xl flex items-center justify-between shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-base font-extrabold text-white font-heading leading-tight">
                {t.sellProduce}
              </div>
              <div className="text-xs text-orange-100">
                Quick 6-step produce listing
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* My Produce */}
        <button
          onClick={() => navigate('/farmer/produce')}
          className="bg-white border border-slate-200 hover:border-[#184037] p-4 rounded-2xl text-left shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#184037] mb-3">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">{t.myProduce}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{produceList.length} submissions</div>
          </div>
        </button>

        {/* Collection Status */}
        <button
          onClick={() => navigate('/farmer/collections')}
          className="bg-white border border-slate-200 hover:border-[#ed7423] p-4 rounded-2xl text-left shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ed7423] mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">{t.collectionStatus}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Track F.T.M.A pickup</div>
          </div>
        </button>

        {/* My Payments */}
        <button
          onClick={() => navigate('/farmer/payments')}
          className="bg-white border border-slate-200 hover:border-sky-600 p-4 rounded-2xl text-left shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">{t.myPayments}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">M-Pesa receipts</div>
          </div>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/farmer/notifications')}
          className="bg-white border border-slate-200 hover:border-purple-600 p-4 rounded-2xl text-left shadow-sm transition-all flex flex-col justify-between relative"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-3">
            <Bell className="w-5 h-5" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              {unreadCount}
            </span>
          )}
          <div>
            <div className="font-bold text-xs text-slate-900">{t.notifications}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{unreadCount} unread alerts</div>
          </div>
        </button>
      </div>

      {/* Help / Support Card */}
      <button
        onClick={() => navigate('/farmer/help')}
        className="w-full bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-2xl flex items-center justify-between shadow-sm transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-bold text-xs text-slate-900">{t.helpSupport}</div>
            <div className="text-[10px] text-slate-500">Toll-free customer hotline & guide</div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};
