import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Award, 
  Plus, 
  ArrowRight, 
  Building2, 
  Calendar,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { toLocalDateString } from '../../lib/utils';

export default function MerchantDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, appsRes, certsRes] = await Promise.allSettled([
        api.get('/merchants/me'),
        api.get('/merchants/applications?pageSize=5'),
        api.get('/merchants/certificates?pageSize=5'),
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value.data;
        setProfile(data.merchant || data);
        setVisits(data.visits || []);
      }
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.data || []);
      if (certsRes.status === 'fulfilled') setCertificates(certsRes.value.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = toLocalDateString(new Date());
  const getNormalizedDate = (val: string | Date | undefined) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      return toLocalDateString(new Date(val));
    }
    return toLocalDateString(new Date(val));
  };

  const todayVisits = visits.filter((v) => getNormalizedDate(v.scheduled_date) === todayStr);
  const pendingCount = applications.filter((a) => ['submitted', 'assigned', 'inspection_scheduled'].includes(a.status)).length;
  const approvedCount = applications.filter((a) => ['approved', 'certified'].includes(a.status)).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-600/40 text-blue-200 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            Merchant Enterprise Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {profile?.business_name ? `Welcome, ${profile.business_name}` : 'Merchant Dashboard'}
          </h1>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            Manage your commercial weighing and measuring instruments, submit verification requests, and track compliance certificates.
          </p>
        </div>

        <div>
          <Link
            to="/merchant/applications/new"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm shadow-md transition"
          >
            <Plus className="w-5 h-5" />
            <span>Apply for Verification</span>
          </Link>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : applications.length}
            </p>
            <Link to="/merchant/applications" className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block">
              View all requests →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Inspection</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {loading ? '...' : pendingCount}
            </p>
            <span className="text-xs text-slate-400 mt-2 inline-block">Awaiting field officer visit</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Requests</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {loading ? '...' : approvedCount}
            </p>
            <span className="text-xs text-emerald-600 font-medium mt-2 inline-block">Passed regulatory test</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Certificates</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-1">
              {loading ? '...' : certificates.length}
            </p>
            <Link to="/merchant/certificates" className="text-xs font-semibold text-indigo-600 hover:underline mt-2 inline-block">
              View certificates →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TODAY'S INSPECTION & ON-SITE VERIFICATION OTP SECTION */}
      {todayVisits.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Scheduled Inspection & Secure OTP
            </h2>
          </div>

          {todayVisits.map((v) => (
            <div
              key={v.id}
              className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-blue-700/50 flex flex-col md:flex-row justify-between md:items-center gap-6"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Official Field Inspection Today
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {v.instrument_type_name} ({v.make} {v.model})
                  </h3>
                  <p className="text-xs text-blue-200 mt-1">
                    Serial No: <span className="font-mono font-bold text-white">{v.serial_number}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100/90 pt-1">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-300" />
                    <span>Assigned Inspector: <strong className="text-white">{v.inspector_name || 'Government Field Officer'}</strong></span>
                  </div>
                  {v.inspector_phone && (
                    <div className="text-blue-300">
                      • Phone: <span className="font-mono text-white">{v.inspector_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* OTP Display Box */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center sm:text-right min-w-[260px] flex flex-col items-center sm:items-end justify-center">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>On-Site Verification OTP</span>
                </div>

                {v.otp_verified ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    OTP Verified by Officer
                  </div>
                ) : (
                  <>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-300 bg-black/40 px-4 py-2 rounded-xl border border-amber-400/40 shadow-inner mt-1">
                      {v.otp_code}
                    </div>
                    <p className="text-[11px] text-slate-200 mt-2 max-w-[220px] text-center sm:text-right leading-tight">
                      Tell this OTP to the field inspector upon arrival to authenticate and start inspection safely.
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Verification Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track the status of your instrument inspection applications</p>
          </div>
          <Link
            to="/merchant/applications/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Verification Requests Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any instrument verification applications. Click below to begin.
            </p>
            <div className="mt-5">
              <Link
                to="/merchant/applications/new"
                className="btn-primary py-2.5 px-6 rounded-xl text-sm"
              >
                Submit First Application
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Instrument</th>
                  <th className="py-3.5 px-4">Serial Number</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{app.make} {app.model}</div>
                      <div className="text-xs text-slate-500">{app.instrument_type_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{app.serial_number}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        app.status === 'certified' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/merchant/applications/${app.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View Details →
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