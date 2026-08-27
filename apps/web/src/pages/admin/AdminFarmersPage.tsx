import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ChannelBadge } from '../../components/StatusBadge';
import { Search, User, MapPin, Phone, RefreshCw, X, Award, Calendar, CheckCircle2 } from 'lucide-react';

export const AdminFarmersPage: React.FC = () => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);

  const loadFarmers = async () => {
    setLoading(true);
    const res = await api.getAdminFarmers(search);
    if (res.success && res.data) {
      setFarmers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFarmers();
  }, [search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">👨‍🌾 Farmer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered smallholders, production history, and multi-channel communication profiles
          </p>
        </div>
        <button
          onClick={loadFarmers}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-[#F8F9FA] text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors"
            placeholder="Search smallholders by name, phone number, location, or Farmer ID (e.g. Alice, 0711000001, VLG-FMR-000001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium shadow-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#ed7423]" />
          <span>Loading farmers directory...</span>
        </div>
      ) : (
        <div className={`grid ${selectedFarmer ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {/* Farmers Table */}
          <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${selectedFarmer ? 'lg:col-span-2' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Farmer ID</th>
                    <th className="py-3.5 px-4">Smallholder</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Region</th>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-4 text-center">Submissions</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {farmers.map((f) => (
                    <tr
                      key={f.id}
                      className={`transition-colors ${selectedFarmer?.id === f.id ? 'bg-emerald-50/70 font-medium' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#184037]">
                        {f.farmer_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{f.full_name}</div>
                        <div className="text-[10px] text-slate-400">{f.preferred_language === 'sw' ? 'Kiswahili' : 'English'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{f.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{f.county}</div>
                        <div className="text-[10px] text-slate-400">{f.location}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <ChannelBadge channel={f.preferred_channel} />
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-800 text-xs">
                        <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {f.produce_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedFarmer(f)}
                          className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#184037] font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Farmer Detail Drawer */}
          {selectedFarmer && (
            <div className="bg-white border-2 border-[#184037] rounded-2xl p-6 shadow-md animate-fade-in relative lg:sticky lg:top-6 self-start">
              <button
                onClick={() => setSelectedFarmer(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-5">
                <span className="inline-block bg-orange-50 text-[#ed7423] border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                  {selectedFarmer.farmer_id}
                </span>
                <h2 className="text-lg font-bold text-[#184037] mt-1.5">{selectedFarmer.full_name}</h2>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedFarmer.phone}</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-5 bg-[#F8F9FA] border border-slate-200 p-4 rounded-xl text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> County / Location:</span>
                  <strong className="text-slate-800">{selectedFarmer.county}, {selectedFarmer.location}</strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Language:</span>
                  <strong className="text-slate-800">{selectedFarmer.preferred_language === 'sw' ? 'Kiswahili' : 'English'}</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Intake Channel:</span>
                  <ChannelBadge channel={selectedFarmer.preferred_channel} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center mb-5">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <div className="text-lg font-extrabold text-[#184037]">{selectedFarmer.produce_count}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Produce</div>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl">
                  <div className="text-lg font-extrabold text-[#ed7423]">{selectedFarmer.collection_count}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Pickups</div>
                </div>
                <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl">
                  <div className="text-lg font-extrabold text-sky-700">{selectedFarmer.payment_count}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Payments</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Joined {new Date(selectedFarmer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
