import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DemandSummaryItem } from '../../types';

export const AdminDemandPage: React.FC = () => {
  const [demandList, setDemandList] = useState<DemandSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDemand = async () => {
    setLoading(true);
    const res = await api.getDemandSummary();
    if (res.success && res.data) {
      setDemandList(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDemand();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">📈 Demand & Forecasting Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Market demand matching across retail, hospitality, wholesalers, and household consumers
          </p>
        </div>
        <button
          onClick={loadDemand}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">
          Analyzing demand vs supply balances...
        </div>
      ) : (
        <>
          {/* Supply vs Demand Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6">
            <h3 className="text-base font-bold text-[#184037] mb-4">
              ⚖️ Supply vs Market Demand Balance
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Farmer Supply (Sacks)</th>
                    <th className="py-3 px-4">Market Demand (Sacks)</th>
                    <th className="py-3 px-4">Net Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demandList.map((item) => {
                    const isSurplus = item.surplus_or_shortage >= 0;

                    return (
                      <tr key={item.product_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-sm text-[#184037]">
                          {item.product_name}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          {item.supply_sacks} sacks
                        </td>
                        <td className="py-3 px-4 font-bold text-sky-600">
                          {item.demand_sacks} sacks
                        </td>
                        <td className={`py-3 px-4 font-bold ${isSurplus ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isSurplus ? `+${item.surplus_or_shortage} Surplus` : `${item.surplus_or_shortage} Shortage`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isSurplus
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isSurplus ? '✅ SUFFICIENT SUPPLY' : '⚠️ SHORTAGE ALERT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Market Segments Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-3">🏘️</div>
              <h4 className="font-bold text-sm text-[#184037] mb-1">Households</h4>
              <p className="text-xs text-slate-500">Direct consumer basket distribution</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-3">🛒</div>
              <h4 className="font-bold text-sm text-[#184037] mb-1">Grocery Stores</h4>
              <p className="text-xs text-slate-500">Weekly recurring retail replenishment</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-3">🍳</div>
              <h4 className="font-bold text-sm text-[#184037] mb-1">Restaurants & Hotels</h4>
              <p className="text-xs text-slate-500">Bulk daily hospitality grade produce</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-3">🏭</div>
              <h4 className="font-bold text-sm text-[#184037] mb-1">Wholesalers</h4>
              <p className="text-xs text-slate-500">High-volume regional commodity trade</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
