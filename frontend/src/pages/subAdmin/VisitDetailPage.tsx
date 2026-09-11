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
  ShieldCheck,
  Truck,
  PackageCheck,
  Clock
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
  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);

  // Merchant On-Site Handover Status (Merchant enters officer token on merchant portal)
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 3: Merchant Delivery Confirmation (Officer enters merchant token upon returning machine)
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

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
      if (data.inspection) {
        setInspectionSubmitted(true);
      }
      if (data.delivery_otp_verified || data.returned_at) {
        setDeliveryConfirmed(true);
      }
    } catch (err) {
      toast.error('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryOtp.trim() || deliveryOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit confirmation code provided by the merchant');
      return;
    }

    setSubmittingDelivery(true);
    try {
      const res = await api.post(`/sub-admin/visits/${id}/confirm-return`, {
        deliveryOtp: deliveryOtp.trim(),
      });
      toast.success(res.data.message || 'Machine delivery confirmed successfully!');
      setDeliveryConfirmed(true);
      fetchVisitDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid Delivery OTP. Ask the merchant for their code.');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error('Merchant must authenticate and authorize equipment handover before you can submit laboratory inspection report.');
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
      if (decision === 'reject') {
        formData.append('decisionReason', decisionReason.trim());
      }
      formData.append('structuredData', JSON.stringify(checklist));

      await api.post(`/sub-admin/visits/${id}/inspection`, formData);
      toast.success('Laboratory inspection report submitted successfully! Proceed to return machine to merchant.');
      setInspectionSubmitted(true);
      fetchVisitDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading inspection file...</div>;
  }

  if (!visit) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-800">Visit Not Found</h2>
        <Link to="/sub-admin/visits" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          ← Back to Assigned Visits
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/sub-admin/visits"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Assigned Visits
        </Link>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          deliveryConfirmed ? 'bg-emerald-100 text-emerald-800' :
          inspectionSubmitted ? 'bg-indigo-100 text-indigo-800' :
          otpVerified ? 'bg-blue-100 text-blue-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {deliveryConfirmed ? 'Delivered & Returned' :
           inspectionSubmitted ? 'Tested - Awaiting Return' :
           otpVerified ? 'In Laboratory Testing' :
           'Pending Pickup Handover'}
        </span>
      </div>

      {/* Merchant & Equipment Overview Card */}
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

      {/* OFFICER VERIFICATION TOKEN DISPLAY (Pickup Handshake) */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            Official Field Verification Token
          </div>
          <h2 className="text-lg font-extrabold text-white">Your Official Handover Code</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            State this 6-digit verification code to the merchant upon arrival. The merchant enters this code into their portal to authenticate your official credentials and authorize equipment collection for facility testing.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur border border-white/20 px-6 py-3 rounded-2xl text-center flex-shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200 block">Officer Token</span>
          <span className="font-mono text-3xl font-extrabold tracking-widest text-emerald-300">
            {visit.otp_code || '------'}
          </span>
          <div className="text-[11px] mt-1 font-semibold text-slate-200">
            {otpVerified ? '✓ Handover Confirmed' : 'Show to merchant upon arrival'}
          </div>
        </div>
      </div>

      {/* STEP 1: MERCHANT ON-SITE HANDOVER STATUS (NO SELF-INPUT) */}
      <div className={`rounded-2xl shadow-sm border p-6 transition ${
        otpVerified 
          ? 'bg-emerald-50/70 border-emerald-300' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              otpVerified ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {otpVerified ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Step 1: Machine Collection & Handover Status
                </h2>
                {otpVerified ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    Handover Confirmed
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                    Awaiting Merchant Confirmation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {otpVerified 
                  ? 'Merchant authenticated your official credentials and confirmed machine handover. The instrument is now officially in laboratory custody for testing.' 
                  : `Show your Official Token (${visit.otp_code || '------'}) to the merchant. The merchant must submit this code on their portal to confirm your identity before releasing the machine.`}
              </p>
            </div>
          </div>

          <div>
            {otpVerified ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Machine In Official Custody</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Waiting for Merchant Verification</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: LABORATORY INSPECTION & READINGS FORM */}
      <div className={`bg-white rounded-2xl shadow-sm border p-6 transition ${
        !otpVerified ? 'opacity-60 pointer-events-none select-none border-slate-200' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              Step 2: Laboratory Calibration & Measurement Audit
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record physical tolerance audits and laboratory standard measurements
            </p>
          </div>
          {inspectionSubmitted && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              ✓ Inspection Submitted
            </span>
          )}
        </div>

        {visit.inspection ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800">Recorded Observations:</div>
            <p className="text-slate-600">{visit.inspection.observations}</p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-slate-500">Inspector Decision:</span>
              <span className={`font-bold uppercase ${visit.inspection.decision === 'approve' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {visit.inspection.decision}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitInspection} className="space-y-6">
            {/* Checklist */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Statutory Inspection Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.serialMatch}
                    onChange={(e) => setChecklist({ ...checklist, serialMatch: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Serial number matches manufacturer plate</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.sealsIntact}
                    onChange={(e) => setChecklist({ ...checklist, sealsIntact: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Existing lead/security seals intact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.calibrationAccurate}
                    onChange={(e) => setChecklist({ ...checklist, calibrationAccurate: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tolerances comply with Metrology Standards</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.displayLegible}
                    onChange={(e) => setChecklist({ ...checklist, displayLegible: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Digital/Analog indicator legible & accurate</span>
                </label>
              </div>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Technical Observations & Test Findings *
              </label>
              <textarea
                rows={4}
                required
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Detail calibration readings, reference weights applied, measured error margin, and compliance state..."
                className="input text-xs"
              />
            </div>

            {/* Decision */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Officer Recommendation *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="approve"
                    checked={decision === 'approve'}
                    onChange={() => setDecision('approve')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-emerald-700">Recommend Certification (Compliant)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={decision === 'reject'}
                    onChange={() => setDecision('reject')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700">Recommend Rejection (Out of Tolerance)</span>
                </label>
              </div>
            </div>

            {decision === 'reject' && (
              <div>
                <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1.5">
                  Reason for Non-Compliance *
                </label>
                <input
                  type="text"
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Specify tolerance deviation or physical damage..."
                  className="input text-xs border-rose-300 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Laboratory Inspection Findings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* STEP 3: PHYSICAL RETURN TO MERCHANT (DELIVERY CONFIRMATION OTP) */}
      <div className={`rounded-2xl shadow-sm border p-6 transition ${
        deliveryConfirmed 
          ? 'bg-emerald-50/70 border-emerald-300' 
          : !inspectionSubmitted 
          ? 'bg-slate-50 opacity-60 border-slate-200' 
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              deliveryConfirmed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {deliveryConfirmed ? <PackageCheck className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Step 3: Return Machine & Merchant Delivery Confirmation
                </h2>
                {deliveryConfirmed && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    Delivered & Confirmed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {deliveryConfirmed ? (
                  <>
                    The merchant has inspected the returned machine and confirmed physical receipt using their Delivery OTP. The equipment custody lifecycle is complete.
                  </>
                ) : !inspectionSubmitted ? (
                  <>
                    Complete and submit the laboratory inspection findings in Step 2 first. Then return the instrument to the merchant.
                  </>
                ) : (
                  <>
                    Deliver the calibrated instrument back to the merchant's premises. When the merchant physically receives and checks the machine, ask them for their <strong>6-digit Delivery Confirmation Code</strong> shown on their dashboard, and enter it below to prove the machine was returned.
                  </>
                )}
              </p>
            </div>
          </div>

          {!deliveryConfirmed && inspectionSubmitted && (
            <form onSubmit={handleConfirmDelivery} className="flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                maxLength={6}
                value={deliveryOtp}
                onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Merchant OTP"
                className="input font-mono font-bold text-base tracking-widest text-center py-2 px-3 w-36 bg-white border-amber-300 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={submittingDelivery || deliveryOtp.length !== 6}
                className="btn py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
              >
                {submittingDelivery ? 'Confirming...' : 'Confirm Delivery'}
              </button>
            </form>
          )}

          {deliveryConfirmed && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Custody Complete</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
