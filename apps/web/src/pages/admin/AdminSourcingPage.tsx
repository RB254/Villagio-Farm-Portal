import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SourcingSummary } from '../../types';

export const AdminSourcingPage: React.FC = () => {
  const [summary, setSummary] = useState<SourcingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchActionStatus, setBatchActionStatus] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadSourcing = async () => {
    setLoading(true);
    const res = await api.getSourcingSummary();
    if (res.success && res.data) {
      setSummary(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSourcing();
  }, []);

  const handleGenerateCollection = async (productId?: number) => {
    setGenerating(true);
    setBatchActionStatus('');

    const res = await api.generateCollectionBatch(productId);
    if (res.success) {
      setBatchActionStatus(`✅ Generated ${res.data?.length || 0} collection request(s) sent to F.T.M.A Logistics!`);
      await loadSourcing();
    } else {
      setBatchActionStatus(`⚠️ ${res.error || 'Failed to generate collection batch.'}`);
    }
    setGenerating(false);
  };

  if (loading || !summary) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Analyzing harvest sourcing aggregations...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">🌾 Sourcing Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time supply aggregation across farmer clusters & automated collection trigger
          </p>
        </div>
        <button
          disabled={generating || summary.total.total_sacks === 0}
          onClick={() => handleGenerateCollection()}
          className="inline-flex items-center gap-2 bg-[#ed7423] text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#db6314] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? 'Processing Engine...' : '⚡ Generate Collection Batch'}
        </button>
      </div>

      {batchActionStatus && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-[#184037]">{batchActionStatus}</p>
        </div>
      )}

      {/* Sourcing Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-[#ed7423]">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Ready Sacks</span>
          <span className="block text-3xl font-extrabold text-[#184037] mt-2 mb-1">
            {summary.total.total_sacks || 0}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            ~{(summary.total.total_kg || 0).toLocaleString()} kg total
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-sky-500">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Farmers Sourced</span>
          <span className="block text-3xl font-extrabold text-sky-700 mt-2 mb-1">
            {summary.total.farmer_count || 0}
          </span>
          <span className="text-xs text-slate-500 font-medium">Aggregated clusters</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Categories</span>
          <span className="block text-3xl font-extrabold text-amber-600 mt-2 mb-1">
            {summary.by_product.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">Harvest lines</span>
        </div>
      </div>

      {/* Supply by Product */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6">
        <h3 className="text-base font-bold text-[#184037] mb-4">
          📊 Supply Aggregation by Crop
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Produce Name</th>
                <th className="py-3 px-4">Total Sacks Available</th>
                <th className="py-3 px-4">Contributing Farmers</th>
                <th className="py-3 px-4">Avg Quantity / Farmer</th>
                <th className="py-3 px-4">Trigger Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.by_product.map((item) => (
                <tr key={item.product_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-sm text-[#184037]">
                    {item.product_name}
                  </td>
                  <td className="py-3 px-4 text-[#ed7423] font-bold text-base">
                    {item.total_sacks} Sacks
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{item.farmer_count} farmers</td>
                  <td className="py-3 px-4 text-slate-500">
                    {item.avg_quantity_per_farmer ? item.avg_quantity_per_farmer.toFixed(1) : 0} sacks
                  </td>
                  <td className="py-3 px-4">
                    <button
                      disabled={generating}
                      onClick={() => handleGenerateCollection(item.product_id)}
                      className="bg-white border border-slate-200 hover:border-[#184037] text-slate-700 hover:text-[#184037] font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      🚀 Dispatch {item.product_name}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: By Location, By Date, By Intake Channel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* By Location */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#184037] mb-3">📍 Supply by Farm Location</h3>
          <div className="space-y-2">
            {summary.by_location.map((loc, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-medium">
                <span className="text-slate-700">{loc.location}</span>
                <strong className="text-[#ed7423] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{loc.total_sacks} sacks</strong>
              </div>
            ))}
          </div>
        </div>

        {/* By Availability Date */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#184037] mb-3">📅 Supply by Ready Date</h3>
          <div className="space-y-2">
            {summary.by_date.map((d, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-medium">
                <span className="text-slate-700">{d.availability_date}</span>
                <strong className="text-[#ed7423] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{d.total_sacks} sacks</strong>
              </div>
            ))}
          </div>
        </div>

        {/* By Source Channel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#184037] mb-3">📡 Multi-Channel Intake Mix</h3>
          <div className="space-y-2">
            {summary.by_channel.map((ch, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-medium">
                <span className="text-slate-700">{ch.source_channel === 'WEB' ? '🌐 Web PWA' : ch.source_channel === 'USSD' ? '📟 USSD *XXX#' : ch.source_channel === 'IVR' ? '📞 IVR Voice' : '💬 SMS'}</span>
                <strong className="text-[#ed7423] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{ch.total_sacks} sacks</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
