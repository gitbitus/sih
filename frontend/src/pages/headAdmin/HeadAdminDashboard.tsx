import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Award, 
  AlertTriangle, 
  FileText, 
  UserPlus, 
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';

export default function HeadAdminDashboard() {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalSubAdmins: 0,
    totalMerchants: 0,
    totalRequests: 0,
    totalCertificates: 0,
    pendingRequests: 0,
    openComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/head-admin/dashboard');
      setStats(res.data);
    } catch (err: any) {
      toast.error('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-600" />
            Head Administrator Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System-wide oversight, administrative officer provisioning, and regulatory audit trail
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/head-admin/admins"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            Add New Admin
          </Link>
          <Link
            to="/head-admin/sub-admins"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            Add Inspector / Sub-Admin
          </Link>
        </div>
      </div>

      {/* Live System Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regional Admins</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : stats.totalAdmins}
            </p>
            <Link to="/head-admin/admins" className="text-xs font-semibold text-indigo-600 hover:underline mt-2 inline-block">
              Manage Admins →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspectors / Sub-Admins</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : stats.totalSubAdmins}
            </p>
            <Link to="/head-admin/sub-admins" className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block">
              View All Inspectors →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Merchants</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : stats.totalMerchants}
            </p>
            <span className="text-xs text-slate-400 mt-2 inline-block">Across all regions</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certified Instruments</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : stats.totalCertificates}
            </p>
            <span className="text-xs text-emerald-600 font-medium mt-2 inline-block">Legally Verified</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Operational Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pending Verification Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Awaiting assignment, inspection, or admin sign-off</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-600">{loading ? '...' : stats.pendingRequests}</span>
            <div>
              <Link to="/head-admin/requests" className="text-xs font-semibold text-blue-600 hover:underline">
                View Requests →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Open Public Complaints</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reported non-compliance, uncalibrated instruments</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-rose-600">{loading ? '...' : stats.openComplaints}</span>
            <div>
              <Link to="/head-admin/audit-logs" className="text-xs font-semibold text-rose-600 hover:underline">
                Audit Trail →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 shadow-lg">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold">Administrative Quick Controls</h2>
          <p className="text-sm text-slate-300 mt-1">
            As Head Admin, you can provision regional administrators, override inspection assignments, and monitor real-time audit logs across the regulatory boundary.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/head-admin/admins"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition shadow-sm"
            >
              <span>Manage Administrators</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/head-admin/sub-admins"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-800 text-white font-semibold text-sm hover:bg-indigo-700 transition border border-indigo-700"
            >
              <span>Manage Inspectors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/head-admin/audit-logs"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition border border-slate-700"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Full System Audit Log</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}