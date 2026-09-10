import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Search, 
  MapPin, 
  UserCheck, 
  ArrowRight, 
  Calendar,
  X,
  CheckCircle2
} from 'lucide-react';

export default function RequestListPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Assignment Modal
  const [assigningReq, setAssigningReq] = useState<any | null>(null);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchSubAdmins();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/requests?status=${statusFilter}` : '/admin/requests';
      const res = await api.get(url);
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubAdmins = async () => {
    try {
      const res = await api.get('/admin/sub-admins');
      setSubAdmins(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedSubAdmin(res.data.data[0].id);
      }
    } catch (err) {
      // Ignored if non-admin
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReq || !selectedSubAdmin || !scheduledDate) {
      toast.error('Please select both an inspector and a scheduled inspection date');
      return;
    }

    setAssignSubmitting(true);
    try {
      await api.post(`/admin/requests/${assigningReq.id}/assign`, {
        subAdminId: selectedSubAdmin,
        scheduledDate,
      });

      toast.success('Inspection visit assigned successfully! Inspector and merchant notified.');
      setAssigningReq(null);
      setScheduledDate('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign inspector');
    } finally {
      setAssignSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            Merchant Verification Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming instrument filings, assign field inspectors, and execute statutory approvals
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Filing Records ({requests.length})
          </span>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Status Filter:</label>
            <select
              className="input py-1.5 px-3 text-xs w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Applications</option>
              <option value="submitted">Submitted (Needs Assignment)</option>
              <option value="assigned">Assigned</option>
              <option value="inspected">Inspected (Needs Sign-Off)</option>
              <option value="approved">Approved</option>
              <option value="certified">Certified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading verification filings...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No requests found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {statusFilter ? 'Try changing the status filter above.' : 'When merchants apply for instrument certification, their requests will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Merchant & Premise</th>
                  <th className="py-3.5 px-4">Instrument</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Assigned Inspector</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.business_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.operating_address_city}, {r.operating_address_state}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{r.make} {r.model}</div>
                      <div className="text-xs text-slate-500 font-mono">SN: {r.serial_number}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {r.sub_admin_name ? (
                        <span className="font-semibold text-slate-800">{r.sub_admin_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        r.status === 'certified' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        r.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'submitted' && (
                          <button
                            onClick={() => setAssigningReq(r)}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign Inspector</span>
                          </button>
                        )}
                        <Link
                          to={`/admin/requests/${r.id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 p-1.5"
                        >
                          Details →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Inspector Modal */}
      {assigningReq && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Assign Field Inspector
              </h2>
              <button
                onClick={() => setAssigningReq(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><span className="text-slate-400">Enterprise:</span> <span className="font-bold text-slate-800">{assigningReq.business_name}</span></div>
              <div><span className="text-slate-400">Instrument:</span> {assigningReq.make} {assigningReq.model}</div>
              <div><span className="text-slate-400">Location:</span> {assigningReq.operating_address_street}, {assigningReq.operating_address_city}</div>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Field Inspector *
                </label>
                {subAdmins.length === 0 ? (
                  <p className="text-xs text-rose-600">No active inspectors found. Please create an inspector first under Sub-Admins.</p>
                ) : (
                  <select
                    className="input py-2.5 px-3 text-sm"
                    value={selectedSubAdmin}
                    onChange={(e) => setSelectedSubAdmin(e.target.value)}
                    required
                  >
                    {subAdmins.map((sa) => (
                      <option key={sa.id} value={sa.id}>
                        {sa.full_name} ({sa.region || 'General'}) • {sa.employee_id || sa.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Inspection Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input py-2.5 px-3 text-sm"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Note: Inspections cannot be scheduled on Sundays.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAssigningReq(null)}
                  className="w-1/2 py-2.5 px-4 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting || subAdmins.length === 0}
                  className="w-1/2 py-2.5 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 shadow-md transition flex items-center justify-center text-sm"
                >
                  {assignSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}