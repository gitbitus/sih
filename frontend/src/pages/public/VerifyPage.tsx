import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { 
  ShieldCheck, 
  XCircle, 
  Search, 
  Award, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import QRScanner from '../../components/qr/QRScanner';

export default function VerifyPage() {
  const { certificateId } = useParams<{ certificateId?: string }>();
  const [searchParams] = useSearchParams();
  const queryId = certificateId || searchParams.get('id') || searchParams.get('cert') || '';

  const [inputVal, setInputVal] = useState(queryId);
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (queryId) {
      setInputVal(queryId);
      verifyCertificate(queryId);
    }
  }, [queryId]);

  const verifyCertificate = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSearched(true);
    try {
      const res = await api.get(`/verify/${encodeURIComponent(idToVerify.trim())}`);
      setCertData(res.data);
    } catch (err: any) {
      setCertData(null);
      setErrorMsg(err.response?.data?.error || 'Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      verifyCertificate(inputVal.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white font-black text-base shadow-sm">
              M
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-none">MIVC System</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">LEGAL METROLOGY VERIFICATION</span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Verification Hero & Search Input */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Official Public Certificate Verification Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Authenticate Inspection Certificate
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Verify official legal metrology compliance certificates issued by authorized government calibration inspectors.
          </p>
        </div>

        {/* Search Bar / Input Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter Certificate Number (e.g. MIVC-2026-...) or UUID"
                className="input pl-10 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="btn-primary py-2.5 px-6 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap"
            >
              {loading ? 'Checking...' : 'Verify Certificate'}
            </button>
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="btn-secondary py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <QrCode className="w-4 h-4" />
              <span>{showScanner ? 'Close Scanner' : 'Scan QR'}</span>
            </button>
          </form>

          {showScanner && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <QRScanner onScanSuccess={(scannedText) => {
                setShowScanner(false);
                const extractedId = scannedText.split('/').pop() || scannedText;
                setInputVal(extractedId);
                verifyCertificate(extractedId);
              }} />
            </div>
          )}
        </div>

        {/* Certificate Result View */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Verifying certificate against state metrology records...</p>
          </div>
        )}

        {!loading && certData && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in duration-300">
            {/* Validity Status Banner */}
            <div className={`p-6 text-white ${
              certData.isValid 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
                : 'bg-gradient-to-r from-rose-600 to-red-700'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    {certData.isValid ? (
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    ) : (
                      <AlertTriangle className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80 block">
                      Official Metrological Status
                    </span>
                    <h2 className="text-2xl font-black tracking-tight">
                      {certData.isValid ? 'VALID & AUTHENTIC CERTIFICATE' : 'CERTIFICATE INACTIVE OR EXPIRED'}
                    </h2>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl px-4 py-2 border border-white/20 text-center sm:text-right">
                  <span className="text-[11px] uppercase tracking-wider text-white/80 block font-semibold">Certificate Number</span>
                  <span className="font-mono font-extrabold text-base">{certData.certificate_number}</span>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Instrument & Merchant Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Instrument Particulars
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-xs">Category:</span>
                      <strong className="text-slate-900 text-base">{certData.instrument_type_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Make & Model:</span>
                      <span className="font-semibold text-slate-800">{certData.make} {certData.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Serial Number:</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {certData.serial_number || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Authorized Commercial Entity
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-xs">Enterprise Legal Name:</span>
                      <strong className="text-slate-900 text-base">{certData.business_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Proprietor / Signatory:</span>
                      <span className="font-semibold text-slate-800">{certData.owner_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Designated Premise Address:</span>
                      <span className="text-slate-600 text-xs">
                        {certData.operating_address_street}, {certData.operating_address_city}, {certData.operating_address_state} - {certData.operating_address_pin}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calibration Validity Period */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Date of Verification</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {formatDate(certData.issue_date)}
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${
                  certData.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <span className="text-xs uppercase font-semibold block opacity-80">Calibration Expiry Date</span>
                  <span className="text-sm font-bold mt-1 block">
                    {formatDate(certData.expiry_date)}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Regulatory Authority</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    State Legal Metrology Dept
                  </span>
                </div>
              </div>

              {/* Verified Badge seal */}
              <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Digitally signed and sealed record verified from central government registry</span>
              </div>
            </div>
          </div>
        )}

        {!loading && searched && !certData && errorMsg && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Certificate Verification Failed</h3>
            <p className="text-sm text-rose-600">{errorMsg}</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please check the certificate number or scan the QR code printed on the official certificate document.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}