import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Award, Download, QrCode, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/merchants/certificates');
      setCertificates(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (certId: string, certNumber: string) => {
    try {
      const res = await api.get(`/merchants/certificates/${certId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download PDF certificate');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Award className="w-6 h-6 text-indigo-600" />
          Legal Metrology Certificates
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Official statutory compliance certificates issued for verified commercial instruments
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Certificates ({certificates.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading certificates...</div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Certificates Issued Yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Certificates are automatically generated and signed once your verification requests pass inspector sign-off.
            </p>
            <div className="mt-5">
              <Link to="/merchant/applications/new" className="btn-primary py-2 px-5 rounded-xl text-xs">
                Submit an Instrument for Verification
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {cert.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {cert.instrument_type_name}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-bold text-indigo-700 tracking-wider">
                    {cert.certificate_number}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {cert.make} {cert.model}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">SN: {cert.serial_number}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-medium text-slate-800">{new Date(cert.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valid Until:</span>
                      <span className="font-bold text-slate-900">{new Date(cert.expiry_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(cert.id, cert.certificate_number)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <Link
                    to={`/verify/${cert.id}`}
                    target="_blank"
                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    title="View public verification link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}