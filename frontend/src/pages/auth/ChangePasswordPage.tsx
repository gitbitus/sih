import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, role, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isForced = user?.forcePasswordChange || searchParams.get('forced') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: isForced ? undefined : currentPassword,
        newPassword,
      });

      toast.success('Password updated successfully!');

      // Update user state so forcePasswordChange is cleared
      if (user && role) {
        setAuth({ ...user, forcePasswordChange: false }, useAuthStore.getState().accessToken || '', role);
      }

      // Redirect to user's dashboard
      if (role === 'merchant') {
        navigate('/merchant/dashboard');
      } else if (role === 'sub_admin') {
        navigate('/sub-admin/dashboard');
      } else if (role === 'head_admin') {
        navigate('/head-admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {!isForced && (
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              isForced ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isForced ? <ShieldAlert className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isForced ? 'Action Required: Set New Password' : 'Change Account Password'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {isForced 
                ? 'Welcome! This is your first login. For security, you must replace your initial password before continuing.' 
                : 'Enter your current password and choose a secure new password.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isForced && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                    className="input"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                  className="input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                  className="input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  'Update Password & Continue'
                )}
              </button>
            </div>
          </form>

          {isForced && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Sign out and exit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
