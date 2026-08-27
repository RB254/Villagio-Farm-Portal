import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const AdminSmsLogsPage: React.FC = () => {
  const [smsList, setSmsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSms = async () => {
    setLoading(true);
    const res = await api.getSmsLogs();
    if (res.success && res.data) {
      setSmsList(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSms();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">💬 SMS Gateway Activity</h1>
          <p className="text-xs text-slate-500 mt-1">
            All outbound farmer SMS notifications dispatched via the SMS adapter
          </p>
        </div>
        <button onClick={loadSms} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all">
          🔄 Refresh
        </button>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-800 font-medium shadow-sm">
        ℹ️ Provider Mode: <strong>Sandbox / Mock Adapter</strong> (Ready to plug Africa's Talking API credentials).
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading SMS log...</div>
      ) : smsList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">No SMS sent yet.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Recipient Phone</th>
                  <th className="py-3 px-4">Message Body</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Gateway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {smsList.map((sms) => (
                  <tr key={sms.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(sms.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-[#184037]">{sms.phone_number}</td>
                    <td className="py-3 px-4 max-w-[400px] leading-relaxed text-slate-700">{sms.message}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ {sms.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{sms.provider}</td>
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
