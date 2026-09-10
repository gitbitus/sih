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
  Trash2
} from 'lucide-react';

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
      toast.success('Field Inspector / Sub-Admin created successfully!');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Field Inspectors Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign inspections and manage verification officers within your jurisdiction
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
            Regional Inspectors ({subAdmins.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading inspectors...</div>
        ) : subAdmins.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Inspectors Registered</h3>
            <p className="text-sm text-slate-400 mt-1">Click the "Add Inspector" button above to register an officer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Inspector</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
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
                        {sa.region || 'Assigned Jurisdiction'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sa.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sa.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleStatus(sa.id, sa.is_active)}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition ${
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Badge ID
                  </label>
                  <input
                    type="text"
                    style={{ padding: '0.625rem 0.875rem' }}
                    className="input"
                    placeholder="BADGE-401"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    style={{ padding: '0.625rem 0.875rem' }}
                    className="input"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Region
                </label>
                <input
                  type="text"
                  style={{ padding: '0.625rem 0.875rem' }}
                  className="input"
                  placeholder="District South"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1">
                <p><strong>Initial Password:</strong> Set to the inspector's <strong>phone number</strong> (digits only).</p>
                <p className="text-blue-700">When they log in for the first time, the system will automatically prompt them to set a new, secure password.</p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-md transition flex items-center justify-center"
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