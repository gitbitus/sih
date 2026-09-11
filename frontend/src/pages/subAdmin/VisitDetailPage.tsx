import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  ClipboardCheck, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  KeyRound,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Inspection Form
  const [observations, setObservations] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Merchant On-Site Verification OTP
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Structured Checklist
  const [checklist, setChecklist] = useState({
    sealsIntact: true,
    calibrationAccurate: true,
    displayLegible: true,
    serialMatch: true,
  });

  useEffect(() => {
    fetchVisitDetails();
  }, [id]);

  const fetchVisitDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sub-admin/visits/${id}`);
      const data = res.data.visit || res.data;
      setVisit(data);
      if (data.otp_verified) {
        setOtpVerified(true);
      }
    } catch (err) {
      toast.error('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit OTP provided by the merchant');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await api.post(`/sub-admin/visits/${id}/verify-otp`, { otp: otp.trim() });
      toast.success(res.data.message || 'OTP verified successfully!');
      setOtpVerified(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Please check with merchant.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error('Merchant on-site OTP verification is required before submitting inspection report');
      return;
    }
    if (!observations.trim()) {
      toast.error('Please enter inspection observations');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('observations', observations.trim());
      formData.append('decision', decision);
      if (decisionReason) formData.append('decisionReason', decisionReason.trim());
      formData.append('structuredData', JSON.stringify(checklist));

      await api.post(`/sub-admin/visits/${id}/inspection`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Inspection recorded! Forwarded to Regional Admin for sign-off.`);
      navigate('/sub-admin/visits');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading visit details...</div>;
  }

  if (!visit) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-800">Visit Not Found</h2>
        <Link to="/sub-admin/visits" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          ← Return to Visits
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/sub-admin/visits"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Visits
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 uppercase">
          Status: {visit.status}
        </span>
      </div>

      {/* Enterprise & Premise Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            {visit.instrument_type_name} Verification
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{visit.business_name}</h1>
          <p className="text-xs text-slate-500 font-medium">Proprietor: {visit.owner_name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{visit.operating_address_street}, {visit.operating_address_city}, {visit.operating_address_state} - {visit.operating_address_pin}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{visit.merchant_phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{visit.merchant_email}</span>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div><span className="text-slate-400">Make & Model:</span> <span className="font-bold text-slate-900">{visit.make} {visit.model}</span></div>
            <div><span className="text-slate-400">Serial Number:</span> <span className="font-mono font-bold text-slate-900">{visit.serial_number}</span></div>
            <div><span className="text-slate-400">Scheduled Collection:</span> <span className="font-bold text-blue-700">{formatDate(visit.scheduled_date)}</span></div>
            <div><span className="text-slate-400">Target Return Date:</span> <span className="font-bold text-emerald-700">{visit.return_date ? formatDate(visit.return_date) : 'Pending testing'}</span></div>
          </div>
        </div>
      </div>

      {/* OFFICER VERIFICATION TOKEN DISPLAY (Reverse OTP Handshake) */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            Official Field Verification Token
          </div>
          <h2 className="text-lg font-extrabold text-white">Your Official Handover Code</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            State this 6-digit verification token to the merchant upon arrival. The merchant enters this code into their portal to authenticate your authority and confirm equipment handover for facility testing.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur border border-white/20 px-6 py-3 rounded-2xl text-center flex-shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200 block">Officer Token</span>
          <span className="font-mono text-3xl font-extrabold tracking-widest text-emerald-300">
            {visit.otp_code || '------'}
          </span>
          <div className="text-[11px] mt-1 font-semibold text-slate-200">
            {otpVerified ? '✓ Handover Confirmed' : 'Awaiting Merchant Handshake'}
          </div>
        </div>
      </div>

      {/* STEP 1: MERCHANT ON-SITE OTP VERIFICATION GATEWAY */}
      <div className={`rounded-2xl shadow-sm border p-6 transition ${
        otpVerified 
          ? 'bg-emerald-50/70 border-emerald-300' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              otpVerified ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {otpVerified ? <ShieldCheck className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Step 1: Merchant Equipment Handover Status
                </h2>
                {otpVerified && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    Handover Confirmed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {otpVerified 
                  ? 'Merchant authenticated your credentials and handed over the machine. You may now record laboratory measurements and submit findings.' 
                  : 'If the merchant is unable to submit the code on their device, you can also confirm the handover code here.'}
              </p>
            </div>
          </div>

          {!otpVerified ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit Token"
                className="input font-mono font-bold text-base tracking-widest text-center py-2 px-3 w-36 bg-white border-blue-300 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={verifyingOtp || otp.length !== 6}
                className="btn-primary py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {verifyingOtp ? 'Confirming...' : 'Confirm Handover'}
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Machine In Custody</span>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Form Card */}
      <div className={`bg-white rounded-2xl shadow-sm border p-6 transition ${
        !otpVerified ? 'opacity-60 pointer-events-none select-none border-slate-200' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            Step 2: Field Calibration & Physical Inspection Report
          </h2>
          {!otpVerified && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Locked until OTP is verified
            </span>
          )}
        </div>

        <form onSubmit={handleSubmitInspection} className="space-y-6">
          {/* Statutory Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Standard Compliance Checklist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.sealsIntact}
                  onChange={(e) => setChecklist({ ...checklist, sealsIntact: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-medium text-slate-800">Security seals intact & untampered</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.calibrationAccurate}
                  onChange={(e) => setChecklist({ ...checklist, calibrationAccurate: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-medium text-slate-800">Calibration test errors within tolerance</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.displayLegible}
                  onChange={(e) => setChecklist({ ...checklist, displayLegible: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-medium text-slate-800">Visual display clearly legible to consumers</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.serialMatch}
                  onChange={(e) => setChecklist({ ...checklist, serialMatch: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="font-medium text-slate-800">Physical serial matches filing</span>
              </label>
            </div>
          </div>

          {/* Observations Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Technical Observations & Notes *
            </label>
            <textarea
              required
              rows={4}
              className="input py-2 px-3 text-xs leading-relaxed"
              placeholder="Record test weight readings, zero-point stability, environment conditions, or discrepancies..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {/* Decision */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Inspector Recommendation *
            </label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-xs font-bold transition ${
                decision === 'approve' 
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                  : 'border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === 'approve'}
                  onChange={() => setDecision('approve')}
                  className="sr-only"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommend for Certification (Pass)</span>
              </label>

              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-xs font-bold transition ${
                decision === 'reject' 
                  ? 'border-rose-600 bg-rose-50 text-rose-800' 
                  : 'border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={() => setDecision('reject')}
                  className="sr-only"
                />
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject & Issue Notice (Fail)</span>
              </label>
            </div>
          </div>

          {decision === 'reject' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Defect / Rejection Grounds *
              </label>
              <input
                type="text"
                required
                className="input py-2 px-3 text-xs"
                placeholder="Specify regulatory non-compliance reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !otpVerified}
              className="btn-primary py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Report...' : 'Submit Inspection Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}