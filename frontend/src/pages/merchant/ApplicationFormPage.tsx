import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar, 
  Upload, 
  ShieldCheck,
  AlertCircle,
  CreditCard,
  KeyRound
} from 'lucide-react';

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [instrumentTypes, setInstrumentTypes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Instrument Info
    instrumentTypeId: '',
    make: '',
    model: '',
    serialNumber: '',
    yearOfManufacture: new Date().getFullYear(),
    lastCalibrationDate: '',
    
    // Operating Location
    street: '',
    city: '',
    state: '',
    pin: '',
    
    // Additional Details
    businessRegNumber: '',
    
    // Declaration
    declarationAccepted: false,
  });

  const [scheduledInfo, setScheduledInfo] = useState<{
    requestId: string;
    scheduledDate?: string;
    estimatedReturnDate?: string;
    subAdminName?: string;
    paymentReference?: string;
  } | null>(null);

  useEffect(() => {
    fetchInstrumentTypes();
  }, []);

  const fetchInstrumentTypes = async () => {
    try {
      const res = await api.get('/public/instrument-types');
      setInstrumentTypes(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, instrumentTypeId: res.data.data[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load instrument types');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declarationAccepted) {
      toast.error('You must accept the legal declaration before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        instrumentTypeId: formData.instrumentTypeId,
        make: formData.make.trim(),
        model: formData.model.trim(),
        serialNumber: formData.serialNumber.trim(),
        yearOfManufacture: Number(formData.yearOfManufacture) || undefined,
        lastCalibrationDate: formData.lastCalibrationDate || undefined,
        operatingAddressStreet: formData.street.trim(),
        operatingAddressCityName: formData.city.trim(),
        operatingAddressState: formData.state.trim(),
        operatingAddressPin: formData.pin.trim(),
        operatingAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pin: formData.pin.trim(),
        },
        businessRegNumber: formData.businessRegNumber ? formData.businessRegNumber.trim() : undefined,
        feeAmount: 500.00,
        feePaid: true,
        paymentReference: `TXN-${Date.now().toString(36).toUpperCase()}`,
        declarationAccepted: true,
      };

      const res = await api.post('/merchants/applications', payload);
      toast.success('Application submitted & pickup automatically scheduled!');
      setScheduledInfo(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/merchant/dashboard"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
          Step {step} of 3
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Apply for Instrument Verification & Certification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit commercial instrument details for regulatory inspection and legal metrology stamp
          </p>
        </div>

        {/* Wizard Step Indicators */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className={`p-3 rounded-xl border text-center transition ${
            step === 1 ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="text-xs uppercase tracking-wider block">1. Equipment</span>
          </div>
          <div className={`p-3 rounded-xl border text-center transition ${
            step === 2 ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="text-xs uppercase tracking-wider block">2. Location</span>
          </div>
          <div className={`p-3 rounded-xl border text-center transition ${
            step === 3 ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="text-xs uppercase tracking-wider block">3. Review & Sign</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Instrument Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Technical Instrument Specifications
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Instrument Category / Type *
                </label>
                <select
                  name="instrumentTypeId"
                  required
                  className="input py-2.5 px-3"
                  value={formData.instrumentTypeId}
                  onChange={handleChange}
                >
                  {instrumentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Manufacturer / Make *
                  </label>
                  <input
                    type="text"
                    name="make"
                    required
                    className="input py-2.5 px-3"
                    placeholder="e.g. Avery Weigh-Tronix"
                    value={formData.make}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Model Number *
                  </label>
                  <input
                    type="text"
                    name="model"
                    required
                    className="input py-2.5 px-3"
                    placeholder="e.g. ZM510"
                    value={formData.model}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    required
                    className="input py-2.5 px-3 font-mono"
                    placeholder="SN-8921820"
                    value={formData.serialNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Year of Manufacture
                  </label>
                  <input
                    type="number"
                    name="yearOfManufacture"
                    className="input py-2.5 px-3"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={formData.yearOfManufacture}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Last Calibration Date
                  </label>
                  <input
                    type="date"
                    name="lastCalibrationDate"
                    className="input py-2.5 px-3"
                    value={formData.lastCalibrationDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.make || !formData.model || !formData.serialNumber) {
                      toast.error('Please fill in make, model, and serial number');
                      return;
                    }
                    setStep(2);
                  }}
                  className="btn-primary py-2.5 px-6 rounded-xl flex items-center gap-2"
                >
                  <span>Next: Operating Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Operating Location & Inspection Window */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Operating Location & Inspection Dates
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Premises Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  required
                  className="input py-2.5 px-3"
                  placeholder="Shop No. 14, Commercial Complex, MG Road"
                  value={formData.street}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    className="input py-2.5 px-3"
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    className="input py-2.5 px-3"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Postal Code (PIN) *
                  </label>
                  <input
                    type="text"
                    name="pin"
                    required
                    className="input py-2.5 px-3 font-mono"
                    placeholder="560001"
                    value={formData.pin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 mt-4">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">Automated Duty Scheduling:</span>
                  <p className="mt-0.5">
                    You do not need to manually choose dates. Upon verification fee confirmation, our automated regional metrology scheduler will immediately assign an available Field Verification Officer and set your collection slot.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary py-2.5 px-5 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.street || !formData.city || !formData.state || !formData.pin) {
                      toast.error('Please fill in complete address details');
                      return;
                    }
                    setStep(3);
                  }}
                  className="btn-primary py-2.5 px-6 rounded-xl flex items-center gap-2"
                >
                  <span>Next: Review & Fee Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review, Statutory Fee & Payment */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Review & Statutory Verification Fee
              </h2>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <div className="font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                  Application Summary
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Instrument:</span> {formData.make} {formData.model}</div>
                  <div><span className="text-slate-500">Serial No:</span> <span className="font-mono font-bold">{formData.serialNumber}</span></div>
                  <div><span className="text-slate-500">Premises:</span> {formData.street}, {formData.city}, {formData.state} - {formData.pin}</div>
                  <div><span className="text-slate-500">Year:</span> {formData.yearOfManufacture}</div>
                </div>
              </div>

              {/* Statutory Fee Card */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl shadow-sm border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-800/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Statutory Metrology Portal</span>
                    <h3 className="text-base font-bold text-white">Verification & Calibration Fee</h3>
                  </div>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">₹500.00</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Laboratory Standard Testing & Calibration</span>
                    <span className="font-mono">₹500.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Government Metrology Cess & GST</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Payment Gateway:</span>
                  <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Direct Metrology Gateway (Instant Clearance)
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <div className="flex gap-2.5 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Legal Notice under Metrology Regulations:</span>
                    <p className="mt-1">
                      By submitting this application, you authorize the designated Field Verification Officer to collect the commercial instrument for facility testing. Upon collection, you must authenticate the officer using their 6-digit official token.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="declarationAccepted"
                  name="declarationAccepted"
                  checked={formData.declarationAccepted}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="declarationAccepted" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  I solemnly declare that all particulars entered above are correct and authentic.
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary py-2.5 px-5 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.declarationAccepted}
                  className="btn-primary py-2.5 px-8 rounded-xl flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹500 & Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation Modal once Scheduled */}
      {scheduledInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment & Duty Confirmed
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                Pickup Scheduled Automatically!
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Transaction ID: {scheduledInfo.paymentReference}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Assigned Officer:</span>
                <span className="font-bold text-slate-900">{scheduledInfo.subAdminName || 'Field Verification Officer'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Scheduled Machine Pickup:</span>
                <span className="font-extrabold text-blue-700">{scheduledInfo.scheduledDate}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Expected Machine Return:</span>
                <span className="font-extrabold text-emerald-700">{scheduledInfo.estimatedReturnDate}</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Anti-Impersonation Protocol:</span>
                <p className="mt-0.5 text-indigo-900 leading-relaxed">
                  When the officer arrives at your door on {scheduledInfo.scheduledDate}, ask for their official 6-digit Verification Token to confirm their credentials before handing over your machine.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/merchant/applications/${scheduledInfo.requestId}`)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition text-center"
              >
                Go to Application & Custody Tracking →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}