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
  ShieldCheck
} from 'lucide-react';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const steps = [
    { key: 'submitted', label: 'Application Filed', done: true },
    { key: 'assigned', label: 'Inspector Assigned', done: ['assigned', 'inspection_scheduled', 'inspected', 'approved', 'certified'].includes(request.status) },
    { key: 'inspected', label: 'On-Site Inspection', done: ['inspected', 'approved', 'certified'].includes(request.status) },
    { key: 'certified', label: 'Certificate Issued', done: request.status === 'certified' },
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
          'bg-amber-100 text-amber-800'
        }`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

      {/* Status Progress Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">
          Filing & Verification Timeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((s, idx) => (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition ${
                s.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {s.done ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
              </div>
              <span className={`text-xs font-semibold ${s.done ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment & Premises Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            {request.instrument_type_name}
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {request.make} {request.model}
          </h1>
          <p className="text-xs text-slate-500 font-mono">Serial Number: {request.serial_number}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="space-y-1.5">
            <div className="text-slate-400 uppercase font-semibold">Designated Operating Premise</div>
            <div className="flex items-center gap-1 text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{request.operating_address_street}, {request.operating_address_city}, {request.operating_address_state} - {request.operating_address_pin}</span>
            </div>
            <div className="pt-2 text-slate-400 uppercase font-semibold">Preferred Inspection Window</div>
            <div>{request.preferred_inspection_start} to {request.preferred_inspection_end}</div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div><span className="text-slate-400">Assigned Inspector:</span> <span className="font-semibold">{request.sub_admin_name || 'Pending assignment'}</span></div>
            {visit && <div><span className="text-slate-400">Scheduled Inspection Date:</span> <span className="font-bold text-blue-700">{new Date(visit.scheduled_date).toLocaleDateString()}</span></div>}
            {request.rejection_reason && (
              <div className="text-rose-700 font-medium">Rejection Reason: {request.rejection_reason}</div>
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