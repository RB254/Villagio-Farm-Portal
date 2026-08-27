import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ProduceStatusBadge, ChannelBadge } from '../../components/StatusBadge';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await api.getAdminDashboard();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading Operations Command Center data...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">
            Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time supply, multi-channel intake, automated collection dispatch & logistics
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* 4 Top Metric Cards (Brand White Cards with #184037 values and #ed7423 highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Registered Farmers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            REGISTERED FARMERS
          </div>
          <div className="text-3xl font-extrabold text-[#184037] mt-2 mb-1">
            {data.farmers.total}
          </div>
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            ✓ {data.farmers.active} Active Profiles
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#184037] rounded-r-xl" />
        </div>

        {/* Card 2: Available Supply */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            AVAILABLE SUPPLY
          </div>
          <div className="text-3xl font-extrabold text-[#184037] mt-2 mb-1 flex items-baseline gap-1">
            {data.supply.available} <span className="text-xs font-semibold text-slate-500">sacks</span>
          </div>
          <div className="text-xs text-slate-500">
            Expected: <strong className="text-slate-700">{data.supply.expected} sacks total</strong>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#ed7423] rounded-r-xl" />
        </div>

        {/* Card 3: FTMA Collections */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            F.T.M.A COLLECTIONS
          </div>
          <div className="text-3xl font-extrabold text-[#184037] mt-2 mb-1 flex items-baseline gap-1.5">
            {data.collections.scheduled} <span className="text-xs font-bold text-[#ed7423] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">scheduled</span>
          </div>
          <div className="text-xs text-slate-500">
            {data.collections.pending} pending • {data.collections.completed} collected
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#f6b787] rounded-r-xl" />
        </div>

        {/* Card 4: M-Pesa Disbursements */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            M-PESA DISBURSEMENTS
          </div>
          <div className="text-2xl font-extrabold text-[#184037] mt-2 mb-1">
            KES {data.payments.completed_amount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">
            Pending: <strong className="text-[#ed7423]">KES {data.payments.pending_amount.toLocaleString()}</strong>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-600 rounded-r-xl" />
        </div>

        {/* Card 5: System Exceptions */}
        <div className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
          data.exceptions.open > 0 ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200'
        }`}>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            SYSTEM EXCEPTIONS
          </div>
          <div className="text-3xl font-extrabold text-[#ed7423] mt-2 mb-1">
            {data.exceptions.open} <span className="text-xs font-semibold text-slate-500">open</span>
          </div>
          <Link to="/admin/exceptions" className="text-xs font-bold text-[#184037] hover:underline flex items-center gap-1">
            Triage exceptions ➔
          </Link>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#ed7423] rounded-r-xl" />
        </div>
      </div>

      {/* Multi-Channel Acceptance Test Simulators Launchpad (White Container Card with #184037 headers and #ed7423 CTAs) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#184037] flex items-center gap-2">
            <span className="text-lg">⚡</span> Multi-Channel Acceptance Test Simulators
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Test seamless multi-channel intake across Web, USSD, and Voice IVR. All submissions write directly to the single unified database.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/ussd-simulator"
            className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              📟
            </div>
            <div>
              <div className="font-bold text-sm text-[#184037]">Launch USSD Simulator</div>
              <div className="text-xs text-slate-500 mt-0.5">Simulate *384*100# interactive feature phone session</div>
            </div>
          </Link>

          <Link
            to="/admin/ivr-simulator"
            className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#ed7423] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              📞
            </div>
            <div>
              <div className="font-bold text-sm text-[#184037]">Launch IVR Voice Simulator</div>
              <div className="text-xs text-slate-500 mt-0.5">Simulate Voice Call with DTMF keypad prompt responses</div>
            </div>
          </Link>

          <Link
            to="/admin/sourcing"
            className="p-4 bg-[#184037] hover:bg-[#23594e] text-white rounded-xl transition-all flex items-start gap-3.5 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#ed7423] text-white flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              🌾
            </div>
            <div>
              <div className="font-bold text-sm text-white">Sourcing & Demand Engine</div>
              <div className="text-xs text-emerald-100/80 mt-0.5">Aggregate crop supply & dispatch F.T.M.A logistics</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Produce Intake Across Channels Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#184037]">
            Recent Produce Intake Across Channels
          </h2>
          <Link to="/admin/produce" className="text-xs font-bold text-[#ed7423] hover:underline">
            View All ({data.produce.total}) ➔
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Submission ID</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Produce</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_produce.map((item: any) => (
                <tr key={item.submission_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-[#184037]">
                    {item.submission_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {item.farmer_name}
                  </td>
                  <td className="py-3 px-4 font-medium">{item.product_name}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {item.quantity} {item.unit}s
                  </td>
                  <td className="py-3 px-4">
                    <ChannelBadge channel={item.source_channel} />
                  </td>
                  <td className="py-3 px-4">
                    <ProduceStatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
