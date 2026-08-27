import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ExceptionItem } from '../../types';

export const AdminExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModal, setNewModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'PAYMENT_FAILURE',
    severity: 'MEDIUM',
    related_entity: 'payments',
    related_entity_id: '1',
    description: '',
  });

  const loadExceptions = async () => {
    setLoading(true);
    const res = await api.getAdminExceptions();
    if (res.success && res.data) {
      setExceptions(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  const handleResolve = async (id: number) => {
    const res = await api.updateException(id, { status: 'RESOLVED', assigned_person: 'Admin' });
    if (res.success) {
      loadExceptions();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createException(formData);
    if (res.success) {
      setNewModal(false);
      setFormData({ type: 'PAYMENT_FAILURE', severity: 'MEDIUM', related_entity: 'payments', related_entity_id: '1', description: '' });
      loadExceptions();
    }
  };

  const selectClass = "w-full bg-slate-50 text-slate-800 text-sm rounded-lg pl-3 pr-8 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors";
  const inputClass = "w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg pl-4 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#184037] tracking-tight">⚠️ Exception Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automation First — Human intervention triggered only upon anomalous events
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setNewModal(true)} className="inline-flex items-center gap-1.5 bg-[#ed7423] text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-[#db6314] transition-colors shadow-sm">
            + Log Exception
          </button>
          <button onClick={loadExceptions} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all">
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading exceptions...</div>
      ) : exceptions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-bold text-[#184037] mb-2">Zero Unresolved Exceptions</h3>
          <p className="text-sm text-slate-500">All automated sourcing, logistics, and payment workflows operating normally.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Exception ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Related Entity</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((exc) => {
                  const isOpen = exc.status === 'OPEN';
                  return (
                    <tr key={exc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">{exc.exception_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{exc.type}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          exc.severity === 'CRITICAL' || exc.severity === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {exc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{exc.related_entity} #{exc.related_entity_id}</td>
                      <td className="py-3 px-4 max-w-[300px] text-slate-700">{exc.description}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isOpen ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {exc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(exc.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {isOpen ? (
                          <button onClick={() => handleResolve(exc.id)} className="bg-[#184037] hover:bg-[#23594e] text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">✓ Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Exception Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#184037]">⚠️ Log System Exception</h3>
              <button onClick={() => setNewModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Exception Type</label>
                <select className={selectClass} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="PAYMENT_FAILURE">PAYMENT_FAILURE</option>
                  <option value="VEHICLE_FAILURE">VEHICLE_FAILURE</option>
                  <option value="QUALITY_ISSUE">QUALITY_ISSUE</option>
                  <option value="SYSTEM_FAILURE">SYSTEM_FAILURE</option>
                  <option value="FARMER_SUPPORT">FARMER_SUPPORT</option>
                  <option value="DELIVERY_DELAY">DELIVERY_DELAY</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Severity Level</label>
                <select className={selectClass} value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={3} className={inputClass} placeholder="Describe the issue requiring human intervention..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>

              <button type="submit" className="w-full bg-[#ed7423] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[#db6314] transition-colors shadow-sm">
                Create Exception
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
