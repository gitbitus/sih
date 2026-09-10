import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Lock, Mail } from 'lucide-react';

export default function LoginPage({ role: propRole }: { role?: string }) {
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');
  
  const isMerchant = (propRole || urlRole) === 'merchant';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payloadRole = isMerchant ? 'merchant' : 'staff';
      
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
        role: payloadRole,
      });

      const { accessToken, user } = response.data;
      setAuth(
        { id: user.id, email: user.email, name: user.email, forcePasswordChange: user.forcePasswordChange },
        accessToken,
        user.role
      );

      // If user is required to change password on first login, route them to /change-password
      if (user.forcePasswordChange) {
        toast('Please update your initial password to continue', { icon: '🔑' });
        navigate('/change-password?forced=true');
        return;
      }

      toast.success(`Welcome back! Logged in as ${user.role.replace('_', ' ')}`);

      if (user.role === 'merchant') {
        navigate('/merchant/dashboard');
      } else if (user.role === 'sub_admin') {
        navigate('/sub-admin/dashboard');
      } else if (user.role === 'head_admin') {
        navigate('/head-admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to login. Please check your credentials.');
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
          <div className="text-center mb-8">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              isMerchant ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isMerchant ? 'Merchant Portal Login' : 'Official Portal Login'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {isMerchant 
                ? 'Manage your verification requests and digital certificates' 
                : 'Role auto-detected for Head Admin, Admin, and Sub-Admin / Inspector'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
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
                  placeholder={isMerchant ? 'merchant@store.com' : 'officer@mivc.gov.in'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium shadow-md transition-all flex items-center justify-center ${
                isMerchant
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                `Sign in as ${isMerchant ? 'Merchant' : 'Admin / Official'}`
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-sm text-slate-600">
            {isMerchant ? (
              <p>
                Don't have a merchant account?{' '}
                <Link to="/merchant/register" className="font-semibold text-blue-600 hover:underline">
                  Register here
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-400 text-center">
                Authorized Personnel Only • Government Legal Metrology Standards
              </p>
            )}
            
            <Link
              to={isMerchant ? '/admin/login' : '/merchant/login'}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition underline"
            >
              Switch to {isMerchant ? 'Admin / Inspector Login' : 'Merchant Login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}