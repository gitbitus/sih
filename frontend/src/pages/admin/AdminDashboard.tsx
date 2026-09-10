import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Building2,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [reqRes, saRes, compRes] = await Promise.allSettled([
        api.get('/admin/requests?pageSize=5'),
        api.get('/admin/sub-admins'),
        api.get('/complaints?pageSize=5'),
      ]);

      if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data.data || []);
      if (saRes.status === 'fulfilled') setSubAdmins(saRes.value.data.data || []);
      if (compRes.status === 'fulfilled') setComplaints(compRes.value.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const pendingAssignments = requests.filter((r) => r.status === 'submitted').length;
  const pendingSignOffs = requests.filter((r) => r.status === 'inspected').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-600/40 text-blue-200 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Regional Administration Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Metrology Administrative Operations
          </h1>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            Assign field inspectors, oversee statutory on-site verification visits, and issue legally binding compliance certificates.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-indigo-950 hover:bg-slate-50 font-bold text-sm shadow-md transition"
          >
            <span>Review Filings Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Operational Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Inspector Assignment</p>
            <p className="text-3xl font-extrabold text-blue-700 mt-1">
              {loading ? '...' : pendingAssignments}
            </p>
            <Link to="/admin/requests?status=submitted" className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block">
              Assign inspectors →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Regional Inspectors</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : subAdmins.filter((sa) => sa.is_active).length}
            </p>
            <Link to="/admin/sub-admins" className="text-xs font-semibold text-indigo-600 hover:underline mt-2 inline-block">
              Manage inspector roster →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Grievances</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1">
              {loading ? '...' : complaints.filter((c) => c.status === 'filed').length}
            </p>
            <Link to="/admin/complaints" className="text-xs font-semibold text-rose-600 hover:underline mt-2 inline-block">
              Open complaints log →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Verification Filings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Incoming merchant filings requiring regional attention</p>
          </div>
          <Link
            to="/admin/requests"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            View All Requests →
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading filings...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Filings in Queue</h3>
            <p className="text-sm text-slate-400 mt-1">
              When merchants apply for equipment certification in your jurisdiction, their requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Merchant Enterprise</th>
                  <th className="py-3.5 px-4">Instrument</th>
                  <th className="py-3.5 px-4">Filing Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.business_name}</div>
                      <div className="text-xs text-slate-500">{r.operating_address_city}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{r.make} {r.model}</div>
                      <div className="text-xs text-slate-500">{r.instrument_type_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-800">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/requests/${r.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Inspect →
                      </Link>
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