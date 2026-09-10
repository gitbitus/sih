import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Search, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function ApplicationListPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = statusFilter 
        ? `/merchants/applications?status=${statusFilter}` 
        : '/merchants/applications';
      const res = await api.get(url);
      setApplications(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load verification applications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with New Application CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            My Verification Applications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Status of all instrument inspection filings submitted to the metrology authority
          </p>
        </div>

        <Link
          to="/merchant/applications/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Verification</span>
        </Link>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Filings: {applications.length}
          </span>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Filter by Status:</label>
            <select
              className="input py-1.5 px-3 text-xs w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="inspection_scheduled">Inspection Scheduled</option>
              <option value="inspected">Inspected</option>
              <option value="approved">Approved</option>
              <option value="certified">Certified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No applications match your filter</h3>
            <p className="text-sm text-slate-400 mt-1">Submit an application to get your instruments verified and certified.</p>
            <div className="mt-5">
              <Link to="/merchant/applications/new" className="btn-primary py-2 px-5 rounded-xl text-xs">
                Create New Application
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Instrument Details</th>
                  <th className="py-3.5 px-4">Premises Address</th>
                  <th className="py-3.5 px-4">Filing Date</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.make} {app.model}</div>
                      <div className="text-xs text-slate-500">{app.instrument_type_name} • SN: {app.serial_number}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{app.operating_address_city}, {app.operating_address_state}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        app.status === 'certified' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/merchant/applications/${app.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}