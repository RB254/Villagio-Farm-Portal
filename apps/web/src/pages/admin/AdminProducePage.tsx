import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProduceStatusBadge, ChannelBadge } from '../../components/StatusBadge';

export const AdminProducePage: React.FC = () => {
  const [produce, setProduce] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (channelFilter) params.source_channel = channelFilter;
    if (productFilter) params.product_id = productFilter;
    if (locationFilter) params.location = locationFilter;

    const [prodRes, catalogRes] = await Promise.all([
      api.getAllProduce(params),
      api.getProducts(),
    ]);

    if (prodRes.success && prodRes.data) setProduce(prodRes.data);
    if (catalogRes.success && catalogRes.data) setProducts(catalogRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, channelFilter, productFilter, locationFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">Produce Submissions Intake</h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated intake across Web, USSD, and IVR channels
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filter Product</label>
          <select
            className="w-full bg-slate-50 text-slate-800 text-sm rounded-lg pl-3 pr-8 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Intake Channel</label>
          <select
            className="w-full bg-slate-50 text-slate-800 text-sm rounded-lg pl-3 pr-8 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="">All Channels</option>
            <option value="WEB">Web PWA</option>
            <option value="USSD">USSD (*XXX#)</option>
            <option value="IVR">IVR (Voice)</option>
            <option value="SMS">SMS</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Produce Status</label>
          <select
            className="w-full bg-slate-50 text-slate-800 text-sm rounded-lg pl-3 pr-8 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="COLLECTION_REQUESTED">COLLECTION REQUESTED</option>
            <option value="COLLECTION_SCHEDULED">COLLECTION SCHEDULED</option>
            <option value="COLLECTED">COLLECTED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location Search</label>
          <input
            type="text"
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg pl-4 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors"
            placeholder="e.g. Limuru, Kiambu..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">
          Loading produce records...
        </div>
      ) : produce.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          No produce submissions match the filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Submission ID</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Est. Weight</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Ready Date</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produce.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#184037]">
                      {p.submission_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.farmer_name}</div>
                      <div className="text-[11px] text-slate-500">{p.farmer_phone}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.product_name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.quantity} {p.unit}s
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      ~{p.estimated_kg} kg
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{p.location}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.availability_date}</td>
                    <td className="py-3 px-4">
                      <ChannelBadge channel={p.source_channel} />
                    </td>
                    <td className="py-3 px-4">
                      <ProduceStatusBadge status={p.status} />
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
