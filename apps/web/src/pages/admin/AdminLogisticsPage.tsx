import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CollectionStatusBadge } from '../../components/StatusBadge';

export const AdminLogisticsPage: React.FC = () => {
  const [logisticsData, setLogisticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const loadLogistics = async () => {
    setLoading(true);
    const res = await api.getAdminLogistics();
    if (res.success && res.data) {
      setLogisticsData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogistics();
  }, []);

  const handleFtmaAccept = async (collectionId: string) => {
    setAcceptingId(collectionId);
    setStatusMsg('');

    const res = await api.ftmaAcceptCollection(collectionId);
    if (res.success) {
      setStatusMsg(`🚛 F.T.M.A accepted ${collectionId}! Vehicle ${res.data?.vehicle_id} assigned and farmer notified via SMS/App.`);
      await loadLogistics();
    } else {
      setStatusMsg(`⚠️ Error: ${res.error}`);
    }
    setAcceptingId(null);
  };

  if (loading || !logisticsData) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading F.T.M.A Logistics Hub...
      </div>
    );
  }

  const { collections, stats } = logisticsData;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">🚚 F.T.M.A Logistics Portal (Simulator)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Farm To Market Alliance Logistics Partner Dispatch & Automated Route Fulfillment
          </p>
        </div>
        <button
          onClick={loadLogistics}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-[#184037]">{statusMsg}</p>
        </div>
      )}

      {/* Logistics Overview KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Acceptance</span>
          <span className="block text-3xl font-extrabold text-amber-600 mt-2 mb-1">
            {stats?.requested || 0}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-purple-500">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trucks En Route</span>
          <span className="block text-3xl font-extrabold text-purple-600 mt-2 mb-1">
            {stats?.vehicle_assigned || 0}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-[#184037]">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Pickups</span>
          <span className="block text-3xl font-extrabold text-[#184037] mt-2 mb-1">
            {stats?.completed || 0}
          </span>
        </div>
      </div>

      {/* Simulated Route Topology Card */}
      <div className="bg-[#184037] border border-[#184037] rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#f6b787] mb-2">
          🗺️ Active Logistics Route Topology
        </h3>
        <p className="text-xs text-[#f6b787]/80 mb-6">
          Optimal cluster route: Farmers pickup points ➔ Villagio Processing Centre (Limuru Hub)
        </p>

        <div className="flex items-center gap-3 overflow-x-auto pb-4">
          <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-center flex-shrink-0 min-w-[140px]">
            <div className="text-2xl mb-2">👨‍🌾</div>
            <strong className="block text-sm text-white mb-1">Farmer Cluster</strong>
            <div className="text-[11px] text-white/70">Kiambu / Limuru</div>
          </div>
          <span className="text-xl text-[#ed7423]">➔</span>
          <div className="bg-purple-900/40 border border-purple-500/30 p-4 rounded-xl text-center flex-shrink-0 min-w-[140px]">
            <div className="text-2xl mb-2">🚛</div>
            <strong className="block text-sm text-purple-200 mb-1">F.T.M.A Fleet</strong>
            <div className="text-[11px] text-purple-300/70">FTMA-TRUCK-003</div>
          </div>
          <span className="text-xl text-[#ed7423]">➔</span>
          <div className="bg-[#ed7423]/20 border border-[#ed7423]/40 p-4 rounded-xl text-center flex-shrink-0 min-w-[140px]">
            <div className="text-2xl mb-2">🏢</div>
            <strong className="block text-sm text-[#f6b787] mb-1">Villagio Hub</strong>
            <div className="text-[11px] text-[#f6b787]/70">Grading & QC</div>
          </div>
        </div>
      </div>

      {/* Collection Requests & Action Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6">
        <h3 className="text-base font-bold text-[#184037] mb-4">
          Dispatch Queue
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Produce</th>
                <th className="py-3 px-4">Pickup Point</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vehicle Assigned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Simulate Partner Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#184037]">
                    {c.collection_id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{c.farmer_name}</div>
                    <div className="text-[11px] text-slate-500">{c.farmer_phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <strong className="text-[#ed7423] block mb-0.5">{c.produce_quantity} sacks</strong> 
                    <span className="text-slate-700">{c.product_name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{c.pickup_location}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{c.scheduled_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-600">
                    {c.vehicle_id ? (
                      <div>
                        <strong>🚛 {c.vehicle_id}</strong>
                        <div className="text-[10px] text-slate-400 font-normal">{c.driver_id}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <CollectionStatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4">
                    {c.status === 'REQUESTED' ? (
                      <button
                        disabled={acceptingId === c.collection_id}
                        onClick={() => handleFtmaAccept(c.collection_id)}
                        className="bg-[#184037] hover:bg-[#23594e] text-white font-semibold text-[11px] px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        {acceptingId === c.collection_id ? 'Assigning...' : '🚛 Accept & Assign Truck'}
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600">
                        ✓ Partner Assigned
                      </span>
                    )}
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
