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
  AlertCircle
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
    preferredStartDate: '',
    preferredEndDate: '',
    
    // Declaration
    declarationAccepted: false,
  });

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
        preferredInspectionStart: formData.preferredStartDate || new Date().toISOString().split('T')[0],
        preferredInspectionEnd: formData.preferredEndDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        preferredInspectionWindow: {
          startDate: formData.preferredStartDate || new Date().toISOString().split('T')[0],
          endDate: formData.preferredEndDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
        declarationAccepted: true,
      };

      await api.post('/merchants/applications', payload);
      toast.success('Verification application submitted successfully!');
      navigate('/merchant/applications');
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Window Start Date
                  </label>
                  <input
                    type="date"
                    name="preferredStartDate"
                    className="input py-2.5 px-3"
                    value={formData.preferredStartDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Window End Date
                  </label>
                  <input
                    type="date"
                    name="preferredEndDate"
                    className="input py-2.5 px-3"
                    value={formData.preferredEndDate}
                    onChange={handleChange}
                  />
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
                  <span>Next: Review & Sign</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Legal Declaration */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Review & Statutory Declaration
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

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <div className="flex gap-2.5 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Legal Notice under Metrology Regulations:</span>
                    <p className="mt-1">
                      By submitting this application, you declare that the instrument is installed at the designated address and will be made accessible to the regulatory inspector during scheduled hours. Any tampering with official inspection seals constitutes an offense.
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
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}