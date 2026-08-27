import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const res = await api.getAuditLogs();
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">📜 System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable event stream of farmer registrations, multi-channel submissions, dispatches, and payments
          </p>
        </div>
        <button onClick={loadLogs} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading audit trail...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">No audit events recorded yet.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.actor} ({log.actor_id})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#ed7423]">{log.action}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">#{log.entity_id}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono max-w-[300px] break-all">{log.metadata || '—'}</td>
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
