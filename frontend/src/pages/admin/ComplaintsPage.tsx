import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { AlertTriangle, MapPin, Search, CheckCircle2, Clock } from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/complaints?status=${statusFilter}` : '/complaints';
      const res = await api.get(url);
      setComplaints(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/complaints/${id}`, { status: newStatus });
      toast.success(`Complaint marked as ${newStatus.replace('_', ' ')}`);
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to update complaint');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          Consumer Grievances & Complaints
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Public reports regarding faulty instruments, broken tamper seals, or measurement inaccuracies
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Complaints Queue ({complaints.length})
          </span>

          <select
            className="input py-1.5 px-3 text-xs w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Complaints</option>
            <option value="filed">Filed</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Complaints Recorded</h3>
            <p className="text-sm text-slate-400 mt-1">Consumer grievances submitted on the public portal will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Merchant Involved</th>
                  <th className="py-3.5 px-4">Complainant</th>
                  <th className="py-3.5 px-4">Grievance Description</th>
                  <th className="py-3.5 px-4">Date Filed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.business_name || 'Unspecified Merchant'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-800">{c.complainant_name}</div>
                      <div className="text-slate-400">{c.complainant_contact}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-sm">
                      {c.description}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(c.filed_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'dismissed' ? 'bg-slate-100 text-slate-700' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.status === 'filed' && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, 'under_review')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Review
                        </button>
                      )}
                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, 'resolved')}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}