import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'merchant' | 'admin' | 'sub_admin' | 'head_admin'>('merchant');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim(), role });
      setSubmitted(true);
      toast.success('If an account exists with that email, a password reset link has been dispatched.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reset Your Password
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your registered official email and select your account type.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check Your Inbox</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We've sent a password reset link to <span className="font-semibold text-slate-800">{email}</span>. Please click the link inside the email within 1 hour to set a new password.
              </p>
              <div className="mt-6">
                <Link to="/login" className="btn-primary w-full py-2.5 rounded-xl text-sm">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <select
                  className="input py-2 px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="merchant">Merchant</option>
                  <option value="admin">Regional Administrator</option>
                  <option value="sub_admin">Inspector / Sub-Admin</option>
                  <option value="head_admin">Head Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                    className="input"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-md transition flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link to="/login" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition underline">
              Remember your password? Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
