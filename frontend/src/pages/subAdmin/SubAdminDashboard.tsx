import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  FileCheck, 
  CheckCircle2, 
  Phone, 
  Building2, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';

import { toLocalDateString } from '../../lib/utils';

export default function SubAdminDashboard() {
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
      toast.error('Failed to load assigned visits');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = toLocalDateString(new Date());
  
  // Normalize date string (whether YYYY-MM-DD or ISO with timezone)
  const getNormalizedDate = (val: string | Date | undefined) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      // If ISO format like '2026-09-08T18:30:00.000Z', convert to local date
      return toLocalDateString(new Date(val));
    }
    return toLocalDateString(new Date(val));
  };

  const todayVisits = visits.filter((v) => getNormalizedDate(v.scheduled_date) === todayStr);
  const upcomingVisits = visits.filter((v) => getNormalizedDate(v.scheduled_date) !== todayStr);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-600/40 text-blue-200 text-xs font-semibold mb-3">
            <ClipboardList className="w-3.5 h-3.5" />
            Field Verification Officer Station
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inspector Assigned Visits
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Conduct on-site calibration audits, record physical instrument observations, and capture merchant signatures.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/sub-admin/visits"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-md transition text-white"
          >
            <span>View All Assigned Visits</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled for Today</p>
            <p className="text-3xl font-extrabold text-blue-700 mt-1">
              {loading ? '...' : todayVisits.length}
            </p>
            <span className="text-xs text-slate-400 mt-2 inline-block">Active field assignments</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Inspections</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {loading ? '...' : upcomingVisits.length}
            </p>
            <span className="text-xs text-slate-400 mt-2 inline-block">In your rolling schedule</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspection History</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {loading ? '...' : 'Archive'}
            </p>
            <Link to="/sub-admin/history" className="text-xs font-semibold text-emerald-600 hover:underline mt-2 inline-block">
              View completed inspections →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Today's Visits Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's Inspection Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Visits scheduled for today requiring physical inspection</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading today's schedule...</div>
        ) : todayVisits.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Visits Scheduled Today</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You are all caught up for today. Check upcoming visits to plan ahead.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayVisits.map((v) => (
              <div key={v.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                      {v.instrument_type_name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Visit #{v.id.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{v.business_name}</h3>
                  <p className="text-xs text-slate-500">Proprietor: {v.owner_name} • Phone: {v.merchant_phone}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.operating_address_street}, {v.operating_address_city}, {v.operating_address_state} - {v.operating_address_pin}</span>
                  </div>
                </div>

                <div>
                  <Link
                    to={`/sub-admin/visits/${v.id}`}
                    className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
                  >
                    <span>Conduct Inspection</span>
                    <ArrowRight className="w-4 h-4" />
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