import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CollectionRequest } from '../../types';
import { CollectionStatusBadge } from '../../components/StatusBadge';

export const AdminCollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollections = async () => {
    setLoading(true);
    const res = await api.getCollections();
    if (res.success && res.data) {
      setCollections(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const res = await api.updateCollection(id, { status: newStatus });
    if (res.success) {
      loadCollections();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">📦 Collection Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            All aggregated collection batches routed to logistics partners
          </p>
        </div>
        <button
          onClick={loadCollections}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">
          Loading collection orders...
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          No collection requests currently created. Go to Sourcing Engine to generate a batch.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Produce</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Assigned Truck</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#184037]">
                      {c.collection_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.farmer_name}</div>
                      <div className="text-[11px] text-slate-500">{c.farmer_phone}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c.product_name}</td>
                    <td className="py-3 px-4 font-extrabold text-[#ed7423]">{c.quantity} Sacks</td>
                    <td className="py-3 px-4 text-slate-500">{c.pickup_location}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{c.scheduled_date} <br/><span className="text-[10px] text-slate-400">{c.time_window}</span></td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-600">
                      {c.vehicle_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <CollectionStatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4">
                      {c.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleUpdateStatus(c.id, 'COMPLETED')}
                          className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#184037] font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Mark Collected
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-[#184037]">✓ Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
