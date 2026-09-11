import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  X, 
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function SubAdminManagePage() {
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    region: '',
    employeeId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Leave & Reallocation State
  const [leaveModalSubAdmin, setLeaveModalSubAdmin] = useState<any | null>(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('Personal Leave / Roster Relieved');
  const [grantingLeave, setGrantingLeave] = useState(false);
  const [reallocationSummary, setReallocationSummary] = useState<any | null>(null);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sub-admins');
      setSubAdmins(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load sub-admins / inspectors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/sub-admins', formData);
      toast.success('Field Inspector created successfully!');
      setShowCreateModal(false);
      setFormData({ email: '', fullName: '', phone: '', region: '', employeeId: '' });
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create sub-admin');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/admin/sub-admins/${id}/disable`);
      toast.success(`Inspector ${currentActive ? 'disabled' : 'enabled'} successfully`);
      fetchSubAdmins();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleGrantLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate) {
      toast.error('Please choose a valid leave date');
      return;
    }

    setGrantingLeave(true);
    try {
      const res = await api.post(`/admin/sub-admins/${leaveModalSubAdmin.id}/leave`, {
        date: leaveDate,
        reason: leaveReason,
      });
      toast.success(res.data.message || 'Leave granted and visits reallocated!');
      setReallocationSummary(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to grant leave');
    } finally {
      setGrantingLeave(false);
    }
  };

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Field Verification Officers Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor duty status, manage leave, and automatically reallocate inspection visits
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Inspector</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Regional Inspectors & Officers ({subAdmins.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading inspectors...</div>
        ) : subAdmins.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No field officers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subAdmins.map((sa) => (
                  <tr key={sa.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sa.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{sa.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {sa.employee_id || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sa.email}</span>
                      </div>
                      {sa.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sa.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {sa.region || 'Regional Jurisdiction'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sa.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sa.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {/* Free / Leave Button */}
                      <button
                        onClick={() => {
                          setLeaveModalSubAdmin(sa);
                          setLeaveDate(tomorrowStr);
                          setLeaveReason('Admin Leave / Duty Exemption');
                          setReallocationSummary(null);
                        }}
                        className="py-1.5 px-3 rounded-lg border text-xs font-semibold text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 transition inline-flex items-center gap-1"
                        title="Free officer for a day & auto-reallocate work"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Free for Day</span>
                      </button>

                      {/* Enable/Disable Button */}
                      <button
                        onClick={() => toggleStatus(sa.id, sa.is_active)}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition ${
                          sa.is_active
                            ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {sa.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grant Leave & Auto-Reallocate Modal */}
      {leaveModalSubAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Grant Leave & Auto-Reallocate
                  </h2>
                  <p className="text-xs text-slate-500">
                    Officer: <strong>{leaveModalSubAdmin.full_name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLeaveModalSubAdmin(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!reallocationSummary ? (
              <form onSubmit={handleGrantLeave} className="space-y-4">
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">Automated Reallocation Engine:</span>
                  <p className="mt-0.5">
                    When you free this officer, the system will instantly check their scheduled visits on that date and reallocate them to another available officer on the same day, or automatically reschedule to the next earliest available slot.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date to Free / Grant Leave *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="input py-2.5 px-3 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="e.g. Training / Medical Leave / Emergency Relief"
                    className="input py-2.5 px-3 text-xs"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLeaveModalSubAdmin(null)}
                    className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={grantingLeave || !leaveDate}
                    className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    {grantingLeave ? (
                      'Reallocating...'
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Free Officer & Reallocate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      Officer Freed for {leaveDate}!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {reallocationSummary.reallocatedCount === 0
                        ? 'No active visits were scheduled for this officer on that date. Officer is now marked on leave.'
                        : `${reallocationSummary.reallocatedCount} visit(s) were successfully reallocated.`}
                    </p>
                  </div>
                </div>

                {reallocationSummary.details?.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <div className="bg-slate-50 px-4 py-2 font-bold text-slate-600 border-b border-slate-200">
                      Reallocation Details
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {reallocationSummary.details.map((d: any, i: number) => (
                        <div key={i} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">{d.businessName}</span>
                            <span className="text-[11px] text-slate-500">
                              {d.action === 'reassigned_same_day' ? 'Reassigned on same date' : 'Rescheduled to ' + d.newDate}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                            ➔ {d.assignedToName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLeaveModalSubAdmin(null);
                      setReallocationSummary(null);
                      fetchSubAdmins();
                    }}
                    className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Sub-Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add Field Inspector / Sub-Admin
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  style={{ padding: '0.625rem 0.875rem' }}
                  className="input"
                  placeholder="e.g. Officer Sunita Rao"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  style={{ padding: '0.625rem 0.875rem' }}
                  className="input"
                  placeholder="s.rao@mivc.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  style={{ padding: '0.625rem 0.875rem' }}
                  className="input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employee / Officer ID
                </label>
                <input
                  type="text"
                  style={{ padding: '0.625rem 0.875rem' }}
                  className="input font-mono"
                  placeholder="EMP-8842"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jurisdiction Region
                </label>
                <input
                  type="text"
                  style={{ padding: '0.625rem 0.875rem' }}
                  className="input"
                  placeholder="Central District Zone 1"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create Inspector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
