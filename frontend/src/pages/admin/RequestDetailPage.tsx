import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/requests/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this inspection and issue the official digital compliance certificate?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/requests/${id}/approve`);
      toast.success('Certificate issued successfully!');
      fetchRequestDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please enter the grounds for rejecting this verification request:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.post(`/admin/requests/${id}/reject`, { reason });
      toast.success('Request marked as rejected');
      fetchRequestDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading request details...</div>;
  }

  if (!data?.request) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-800">Request Not Found</h2>
        <Link to="/admin/requests" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          ← Return to Requests
        </Link>
      </div>
    );
  }

  const { request, inspection, certificate, documents } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/requests"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Requests
        </Link>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          request.status === 'certified' ? 'bg-emerald-100 text-emerald-800' :
          request.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
          request.status === 'inspected' ? 'bg-indigo-100 text-indigo-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {request.instrument_type_name}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{request.business_name}</h1>
            <p className="text-xs text-slate-500 font-medium">Proprietor: {request.owner_name} • Phone: {request.merchant_phone}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            Filing Date: {new Date(request.submitted_at).toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{request.operating_address_street}, {request.operating_address_city}, {request.operating_address_state} - {request.operating_address_pin}</span>
            </div>
          </div>
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div><span className="text-slate-400">Make & Model:</span> <span className="font-bold text-slate-900">{request.make} {request.model}</span></div>
            <div><span className="text-slate-400">Serial Number:</span> <span className="font-mono font-bold text-slate-900">{request.serial_number}</span></div>
            <div><span className="text-slate-400">Year:</span> {request.year_of_manufacture || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Inspection Results Section if Inspected */}
      {inspection ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Field Inspection Report
            </h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
              inspection.decision === 'approve' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              Recommendation: {inspection.decision}
            </span>
          </div>

          <div className="text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-500 uppercase tracking-wider">Observations:</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed">
              {inspection.observations}
            </div>
            {inspection.decision_reason && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
                Grounds: {inspection.decision_reason}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          Inspection visit has not been conducted yet.
        </div>
      )}

      {/* Certificate Banner if Certified */}
      {certificate && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Official Certificate Issued
            </div>
            <p className="text-xs font-mono font-bold mt-1">
              Certificate No: {certificate.certificate_number}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Valid until: {new Date(certificate.expiry_date).toLocaleDateString()}
            </p>
          </div>
          <Link
            to={`/verify/${certificate.id}`}
            target="_blank"
            className="btn-primary py-2 px-4 rounded-xl text-xs"
          >
            Inspect Certificate
          </Link>
        </div>
      )}

      {/* Action Bar for Admin */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-slate-500">Regulatory Actions</span>
        </div>

        <div className="flex gap-3">
          {request.status === 'inspected' && (
            <>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="btn-danger py-2.5 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                <Award className="w-4 h-4" />
                <span>Approve & Issue Certificate</span>
              </button>
            </>
          )}

          {request.status === 'submitted' && (
            <Link
              to="/admin/requests"
              className="btn-primary py-2.5 px-5 rounded-xl text-xs font-semibold"
            >
              Assign Inspector on Requests List →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}