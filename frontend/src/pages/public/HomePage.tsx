import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShieldCheck, 
  QrCode, 
  FileWarning, 
  Building2, 
  UserCheck, 
  ArrowRight, 
  Calendar, 
  BadgeCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'certificate' | 'merchant'>('all');
  const [results, setResults] = useState<{ type: string; data: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a merchant name, merchant ID, or certificate ID');
      return;
    }

    setLoading(true);
    try {
      // If type is 'certificate' or 'all', search certificates first or type
      const targetType = searchType === 'all' ? 'certificate' : searchType;
      const res = await api.get(`/public/search?q=${encodeURIComponent(searchQuery.trim())}&type=${targetType}`);
      
      // If 'all' search yielded no certs, try searching merchants
      if (searchType === 'all' && (!res.data.data || res.data.data.length === 0)) {
        const merchantRes = await api.get(`/public/search?q=${encodeURIComponent(searchQuery.trim())}&type=merchant`);
        setResults(merchantRes.data);
      } else {
        setResults(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Government-Style Header Banner */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-4 text-xs font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Government Regulatory Legal Metrology Portal</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <span>Standardized Weights & Measures Verification</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="font-extrabold text-xl text-slate-900 leading-tight tracking-tight">
                MIVC SYSTEM
              </div>
              <div className="text-xs font-semibold text-blue-700 tracking-wider uppercase">
                Merchant Instrument Verification & Certification
              </div>
            </div>
          </div>

          {/* Action Buttons for Login and Support */}
          <div className="flex items-center gap-3">
            <Link
              to="/complaint"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200"
            >
              <FileWarning className="w-4 h-4" />
              File Complaint
            </Link>

            {/* Merchant Login Button */}
            <Link
              to="/merchant/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 rounded-lg transition border border-slate-300 shadow-sm"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Merchant Login</span>
            </Link>

            {/* Admin Login Button (Auto-detects Admin or Sub-Admin) */}
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-md"
              title="Detects Admin, Sub-Admin, and Head-Admin"
            >
              <UserCheck className="w-4 h-4" />
              <span>Login as Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-950 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/60 border border-blue-500/40 text-blue-200 text-xs font-semibold mb-6">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            Verified Regulatory Portal
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Verify Merchant Weighing & Measuring Instruments
          </h1>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto font-normal">
            Check the authenticity and legal calibration status of commercial scales, fuel dispensers, and meters in real-time.
          </p>

          {/* Search Box */}
          <div className="mt-8 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl border border-white/20">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
                  placeholder="Search by Merchant Name, Certificate Number (e.g. MIVC-...), or Merchant ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="bg-white text-slate-800 text-sm font-medium px-4 py-3.5 rounded-xl border-0 focus:ring-2 focus:ring-blue-400"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
              >
                <option value="all">All Records</option>
                <option value="certificate">Certificate ID</option>
                <option value="merchant">Merchant Name/ID</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-3.5 px-8 rounded-xl font-semibold shadow-lg text-sm bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-blue-200">
              <span>Quick Actions:</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('Weighing'); setSearchType('all'); }}
                className="hover:underline hover:text-white"
              >
                Weighing Scales
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('Fuel'); setSearchType('all'); }}
                className="hover:underline hover:text-white"
              >
                Fuel Dispensers
              </button>
              <span>•</span>
              <Link to="/merchant/register" className="text-emerald-300 font-medium hover:underline">
                Apply for New Instrument Certificate →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Area */}
      {results && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Search Results ({results.data?.length || 0})
            </h2>
            <button
              onClick={() => setResults(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Clear Results
            </button>
          </div>

          {results.data?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No matching records found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                No verified certificates or registered merchants matched "{searchQuery}". Please verify the spelling or certificate ID format.
              </p>
            </div>
          ) : results.type === 'certificate' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.data.map((cert: any) => (
                <div key={cert.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        {cert.status || 'Active'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {cert.instrument_type_name}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {cert.business_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Proprietor: {cert.owner_name}</p>

                    <div className="mt-4 py-3 border-t border-b border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Certificate No:</span>
                        <span className="font-mono font-bold text-slate-800">{cert.certificate_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Issue Date:</span>
                        <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Valid Until:</span>
                        <span className="font-semibold text-slate-900">{new Date(cert.expiry_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      to={`/verify/${cert.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition border border-blue-200"
                    >
                      <span>View Official Certificate</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.data.map((merchant: any) => (
                <div key={merchant.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Registered Merchant
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ID: {merchant.id.slice(0, 8)}...
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {merchant.business_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Owner: {merchant.owner_name}</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Active Instruments:</span>
                        <span className="font-bold text-emerald-700">{merchant.active_certificates} certified</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Total Certifications:</span>
                        <span className="font-semibold text-slate-800">{merchant.total_certificates}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        setSearchQuery(merchant.business_name);
                        setSearchType('certificate');
                        handleSearch({ preventDefault: () => {} } as any);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <span>Show Verified Instruments</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Feature Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Key Public & Institutional Services
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Everything you need to guarantee precision, compliance, and consumer trust across the jurisdiction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Public Verification */}
          <div className="card hover:shadow-lg transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">QR Code & Certificate Verification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Scan the official holographic QR sticker physically affixed to any merchant instrument to instantly view its calibrated validity and inspection history.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/verify/scan" className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5">
                <span>Scan or Lookup Certificate</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Merchant Portal */}
          <div className="card hover:shadow-lg transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Merchant Registration & Request</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Register your business, submit technical instrument specifications, upload calibration documents, and book on-site regulatory inspections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link to="/merchant/register" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5">
                <span>Register Merchant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/merchant/login" className="text-xs text-slate-500 hover:underline">
                Existing Merchant?
              </Link>
            </div>
          </div>

          {/* Card 3: Grievance Redressal */}
          <div className="card hover:shadow-lg transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5">
                <FileWarning className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Public Grievance Redressal</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Encountered faulty weights, broken seals, or short deliveries? File an official regulatory complaint with photo evidence directly to the oversight board.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/complaint" className="text-sm font-semibold text-rose-700 hover:text-rose-800 inline-flex items-center gap-1.5">
                <span>Submit Grievance</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-bold text-white text-base">MIVC Legal Metrology Portal</div>
            <div className="text-xs text-slate-500 mt-1">
              National Weights and Measures Regulatory Enforcement System
            </div>
          </div>
          <div className="flex gap-6 text-xs">
            <Link to="/admin/login" className="text-slate-400 hover:text-white">Admin & Inspector Login</Link>
            <Link to="/merchant/login" className="text-slate-400 hover:text-white">Merchant Login</Link>
            <Link to="/complaint" className="text-slate-400 hover:text-white">File Complaint</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}