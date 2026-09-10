import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { FileCheck, Calendar, MapPin, Search } from 'lucide-react';

export default function VisitHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/sub-admin/visits/history?status=${statusFilter}` : '/sub-admin/visits/history';
      const res = await api.get(url);
      setHistory(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load visit history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileCheck className="w-6 h-6 text-emerald-600" />
          Field Inspection History & Archives
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Historical record of all completed, approved, or rejected merchant instrument inspections
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Archived Visits ({history.length})
          </span>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Filter Status:</label>
            <select
              className="input py-1.5 px-3 text-xs w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Past Inspections</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading inspection history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Past Inspections Found</h3>
            <p className="text-sm text-slate-400 mt-1">
              Once you conduct inspections and submit sign-off reports, they will be archived here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Merchant & Location</th>
                  <th className="py-3.5 px-4">Inspection Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Notes / Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{h.business_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{h.operating_address_city}, {h.operating_address_state}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                      {new Date(h.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        h.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {h.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {h.notes || 'Inspection completed according to standard protocol.'}
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