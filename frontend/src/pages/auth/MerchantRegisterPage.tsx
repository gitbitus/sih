import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Building2, ArrowLeft, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';

export default function MerchantRegisterPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/merchants/register', {
        businessName: formData.businessName.trim(),
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        countryCode: formData.countryCode,
        password: formData.password,
      });

      setRegisteredSuccess(true);
      toast.success('Registration successful! You can now log in.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 
        (err.response?.data?.details ? err.response.data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ') : 'Registration failed. Please try again.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Registration Complete!</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your merchant business profile for <span className="font-semibold">{formData.businessName}</span> has been created.
          </p>
          <div className="mt-8">
            <Link
              to="/merchant/login"
              className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-md transition"
            >
              Proceed to Merchant Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Merchant Registration
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Register your enterprise to obtain certified verification for weighing and measuring instruments
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Business / Enterprise Legal Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="businessName"
                  required
                  style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                  className="input"
                  placeholder="e.g. Apex Traders Pvt Ltd"
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Owner / Authorized Representative Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="ownerName"
                  required
                  style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                  className="input"
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.ownerName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                    className="input"
                    placeholder="contact@business.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                    className="input"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                    className="input"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                    className="input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-md transition flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create Merchant Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/merchant/login" className="font-semibold text-blue-600 hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}