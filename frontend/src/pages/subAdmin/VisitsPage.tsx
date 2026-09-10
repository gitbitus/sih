import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, ArrowRight, Building2, Phone, ClipboardList } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sub-admin/visits');
      setVisits(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Assigned Field Inspections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active and scheduled merchant on-site visits assigned to you by regional administration
          </p>
        </div>

        <Link
          to="/sub-admin/availability"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition"
        >
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Update Availability Calendar</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Scheduled Visits ({visits.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your visits...</div>
        ) : visits.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Pending Inspections</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no visits assigned to your queue. You will be notified when new merchant applications are assigned to you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Merchant & Premise</th>
                  <th className="py-3.5 px-4">Instrument Category</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Merchant Contact</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{v.business_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{v.operating_address_street}, {v.operating_address_city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md">
                        {v.instrument_type_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-xs text-slate-900">
                      {formatDate(v.scheduled_date)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{v.owner_name}</div>
                      <div className="text-slate-400 font-mono">{v.merchant_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/sub-admin/visits/${v.id}`}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
                      >
                        <span>Inspect</span>
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