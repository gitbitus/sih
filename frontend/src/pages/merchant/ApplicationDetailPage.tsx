import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Award, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  PackageCheck,
  Building2,
  Phone,
  CreditCard
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Merchant Reverse OTP verification state
  const [handoverOtp, setHandoverOtp] = useState('');
  const [verifyingHandover, setVerifyingHandover] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/merchants/applications/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOfficerOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverOtp.trim() || handoverOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code provided by the visiting officer');
      return;
    }

    setVerifyingHandover(true);
    try {
      const res = await api.post(`/merchants/applications/${id}/verify-handover-otp`, {
        otp: handoverOtp.trim(),
      });
      toast.success(res.data.message || 'Officer verified & handover confirmed!');
      setHandoverOtp('');
      fetchApplication();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid verification token. Please ask the officer.');
    } finally {
      setVerifyingHandover(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading application details...</div>;
  }

  if (!data?.request) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-800">Application Not Found</h2>
        <Link to="/merchant/applications" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          ← Return to Applications
        </Link>
      </div>
    );
  }

  const { request, visit, certificate } = data;
  const isHandedOver = !!(request.collected_at || visit?.otp_verified);

  const steps = [
    { 
      key: 'fee_paid', 
      label: '1. Fee Paid', 
      desc: 'Application Confirmed',
      done: true 
    },
    { 
      key: 'scheduled', 
      label: '2. Pickup Scheduled', 
      desc: visit?.scheduled_date ? formatDate(visit.scheduled_date) : 'Pending',
      done: !!visit?.scheduled_date 
    },
    { 
      key: 'collected', 
      label: '3. Handover Verified', 
      desc: isHandedOver ? 'Officer Authenticated' : 'Awaiting Collection',
      done: isHandedOver 
    },
    { 
      key: 'testing', 
      label: '4. Lab Testing', 
      desc: ['inspected', 'approved', 'certified'].includes(request.status) ? 'Tested' : 'In Facility',
      done: ['inspected', 'approved', 'certified'].includes(request.status) 
    },
    { 
      key: 'returned', 
      label: '5. Certified & Return', 
      desc: request.status === 'certified' ? 'Certificate Issued' : `Target: ${request.estimated_return_date ? formatDate(request.estimated_return_date) : 'Pending'}`,
      done: request.status === 'certified' 
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/merchant/applications"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Applications
        </Link>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          request.status === 'certified' ? 'bg-emerald-100 text-emerald-800' :
          request.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {isHandedOver && request.status !== 'certified' ? 'In Testing Facility' : request.status.replace('_', ' ')}
        </span>
      </div>

      {/* Custody & Verification Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Machine Custody & Verification Pipeline
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Estimated Return Date:{' '}
            <strong className="text-emerald-700 font-bold">
              {request.estimated_return_date ? formatDate(request.estimated_return_date) : (visit?.return_date ? formatDate(visit.return_date) : 'Pending')}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {steps.map((s, idx) => (
            <div key={s.key} className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s.done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-xs font-bold ${s.done ? 'text-slate-900' : 'text-slate-500'}`}>
                {s.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ANTI-IMPERSONATION: REVERSE OTP OFFICER VERIFICATION CARD */}
      <div className={`rounded-2xl border p-6 transition shadow-sm ${
        isHandedOver
          ? 'bg-emerald-50/70 border-emerald-300'
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-blue-200'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isHandedOver ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isHandedOver ? <PackageCheck className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Officer Identity Authentication & Handover
                </h3>
                {isHandedOver && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    Handover Confirmed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {isHandedOver ? (
                  <>
                    Officer identity verified. The instrument was safely transferred into government custody for laboratory testing on{' '}
                    <strong>{formatDate(request.collected_at || visit?.collected_at || visit?.updated_at)}</strong>.
                  </>
                ) : (
                  <>
                    When Officer <strong>{visit?.sub_admin_name || 'Field Officer'}</strong> arrives at your door on{' '}
                    <strong>{visit?.scheduled_date ? formatDate(visit.scheduled_date) : 'the scheduled date'}</strong>, ask for their 6-digit official verification token. Enter it below to authorize handover and prevent equipment impersonation fraud.
                  </>
                )}
              </p>
            </div>
          </div>

          {!isHandedOver && (
            <form onSubmit={handleVerifyOfficerOtp} className="flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                maxLength={6}
                value={handoverOtp}
                onChange={(e) => setHandoverOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit Token"
                className="input font-mono font-bold text-base tracking-widest text-center py-2 px-3 w-36 bg-white border-blue-300 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={verifyingHandover || handoverOtp.length !== 6}
                className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {verifyingHandover ? 'Verifying...' : 'Verify Officer'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Equipment & Schedule Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {request.instrument_type_name}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {request.make} {request.model}
            </h1>
            <p className="text-xs text-slate-500 font-mono">Serial Number: {request.serial_number}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              Statutory Fee: ₹{Number(request.fee_amount || 500).toFixed(2)} Paid
            </span>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Ref: {request.payment_reference || 'TXN-001'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="space-y-1.5">
            <div className="text-slate-400 uppercase font-semibold">Operating Premise</div>
            <div className="flex items-center gap-1 text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{request.operating_address_street}, {request.operating_address_city}, {request.operating_address_state} - {request.operating_address_pin}</span>
            </div>
            <div className="pt-2 text-slate-400 uppercase font-semibold">Assigned Field Officer</div>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{visit?.sub_admin_name || 'Pending assignment'}</span>
              {visit?.sub_admin_employee_id && <span className="text-slate-400 font-mono font-normal">({visit.sub_admin_employee_id})</span>}
            </div>
            {visit?.sub_admin_phone && (
              <div className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{visit.sub_admin_phone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block">Scheduled Pickup Date:</span>
              <span className="font-extrabold text-blue-700 text-sm">
                {visit?.scheduled_date ? formatDate(visit.scheduled_date) : 'Calculating earliest slot...'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Target Return Date:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                {request.estimated_return_date ? formatDate(request.estimated_return_date) : (visit?.return_date ? formatDate(visit.return_date) : 'After 3 days testing')}
              </span>
            </div>
            {request.rejection_reason && (
              <div className="text-rose-700 font-medium pt-1 border-t border-slate-200">
                Rejection Reason: {request.rejection_reason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Card if Issued */}
      {certificate && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 font-bold text-base">
              <ShieldCheck className="w-6 h-6" />
              Official Verification Certificate Issued
            </div>
            <p className="text-xs font-mono mt-1 opacity-90">
              Certificate No: {certificate.certificate_number}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              Calibration Valid Until: {new Date(certificate.expiry_date).toLocaleDateString()}
            </p>
          </div>
          <Link
            to={`/verify/${certificate.id}`}
            target="_blank"
            className="py-2.5 px-5 bg-white text-emerald-900 rounded-xl font-bold text-xs hover:bg-slate-50 shadow-sm transition inline-flex items-center gap-1.5"
          >
            <span>View Certificate</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
