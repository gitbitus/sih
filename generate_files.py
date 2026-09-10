import os
import sys

base_dir = sys.argv[1]

files = {
  'tailwind.config.js': """/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1d4ed8', foreground: '#ffffff' },
        destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
        muted: { DEFAULT: '#f1f5f9', foreground: '#64748b' },
        accent: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};""",
  'src/index.css': """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900 antialiased;
}

.btn {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
}
.btn-primary {
  @apply btn bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-500;
}
.btn-secondary {
  @apply btn bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400;
}
.btn-danger {
  @apply btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}
.input {
  @apply block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}""",
  'src/main.tsx': """import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);""",
  'src/App.tsx': """import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/public/HomePage';
import VerifyPage from './pages/public/VerifyPage';
import ComplaintPage from './pages/public/ComplaintPage';
import LoginPage from './pages/auth/LoginPage';
import MerchantRegisterPage from './pages/auth/MerchantRegisterPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';

import MerchantDashboard from './pages/merchant/MerchantDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SubAdminDashboard from './pages/subAdmin/SubAdminDashboard';
import HeadAdminDashboard from './pages/headAdmin/HeadAdminDashboard';

import ApplicationFormPage from './pages/merchant/ApplicationFormPage';
import ApplicationListPage from './pages/merchant/ApplicationListPage';
import ApplicationDetailPage from './pages/merchant/ApplicationDetailPage';
import CertificatesPage from './pages/merchant/CertificatesPage';

import RequestListPage from './pages/admin/RequestListPage';
import RequestDetailPage from './pages/admin/RequestDetailPage';
import SubAdminManagePage from './pages/admin/SubAdminManagePage';
import ComplaintsPage from './pages/admin/ComplaintsPage';
import AuditLogPage from './pages/admin/AuditLogPage';

import VisitsPage from './pages/subAdmin/VisitsPage';
import VisitDetailPage from './pages/subAdmin/VisitDetailPage';
import AvailabilityPage from './pages/subAdmin/AvailabilityPage';
import VisitHistoryPage from './pages/subAdmin/VisitHistoryPage';

import AdminManagePage from './pages/headAdmin/AdminManagePage';
import AllRequestsPage from './pages/headAdmin/AllRequestsPage';
import AllSubAdminsPage from './pages/headAdmin/SubAdminManagePage';
import FullAuditLogPage from './pages/headAdmin/AuditLogPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />
      <Route path="/complaint" element={<ComplaintPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/merchant/login" element={<LoginPage role="merchant" />} />
      <Route path="/merchant/register" element={<MerchantRegisterPage />} />
      <Route path="/admin/login" element={<LoginPage role="admin" />} />
      <Route path="/sub-admin/login" element={<LoginPage role="sub_admin" />} />
      <Route path="/head-admin/login" element={<LoginPage role="head_admin" />} />

      <Route path="/merchant/*" element={<ProtectedRoute allowedRoles={['merchant']} />}>
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="applications" element={<ApplicationListPage />} />
        <Route path="applications/new" element={<ApplicationFormPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
      </Route>

      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="requests" element={<RequestListPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="sub-admins" element={<SubAdminManagePage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
      </Route>

      <Route path="/sub-admin/*" element={<ProtectedRoute allowedRoles={['sub_admin']} />}>
        <Route path="dashboard" element={<SubAdminDashboard />} />
        <Route path="visits" element={<VisitsPage />} />
        <Route path="visits/:id" element={<VisitDetailPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="history" element={<VisitHistoryPage />} />
      </Route>

      <Route path="/head-admin/*" element={<ProtectedRoute allowedRoles={['head_admin']} />}>
        <Route path="dashboard" element={<HeadAdminDashboard />} />
        <Route path="admins" element={<AdminManagePage />} />
        <Route path="sub-admins" element={<AllSubAdminsPage />} />
        <Route path="requests" element={<AllRequestsPage />} />
        <Route path="audit-logs" element={<FullAuditLogPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;""",
  'src/lib/utils.ts': """import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'assigned':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
    case 'revoked':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}""",
  'src/lib/api.ts': """import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } catch (err) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;""",
  'src/types/index.ts': """export interface User {
  id: string;
  name: string;
  email: string;
}

export type Role = 'head_admin' | 'admin' | 'sub_admin' | 'merchant';""",
  'src/store/authStore.ts': """import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      role: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, role) =>
        set({ user, accessToken, role, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);""",
  'src/hooks/useAuth.ts': """import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, role, isAuthenticated, logout, setAuth } = useAuthStore();
  
  return {
    user,
    role,
    isAuthenticated,
    logout,
    login: setAuth,
  };
}""",
  'src/components/common/ProtectedRoute.tsx': """import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import DashboardLayout from '../layout/DashboardLayout';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}""",
  'src/components/layout/Navbar.tsx': """import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-500 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">MIVC System</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2 text-sm focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <span className="hidden md:block font-medium">{user?.name || 'User'}</span>
              </button>
            </div>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}""",
  'src/components/layout/Sidebar.tsx': """import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, FileText, CheckSquare, Users, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { role } = useAuthStore();

  const getLinks = () => {
    switch (role) {
      case 'merchant':
        return [
          { name: 'Dashboard', href: '/merchant/dashboard', icon: LayoutDashboard },
          { name: 'My Applications', href: '/merchant/applications', icon: FileText },
          { name: 'Certificates', href: '/merchant/certificates', icon: CheckSquare },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Requests', href: '/admin/requests', icon: FileText },
          { name: 'Sub Admins', href: '/admin/sub-admins', icon: Users },
          { name: 'Complaints', href: '/admin/complaints', icon: AlertTriangle },
          { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
        ];
      case 'sub_admin':
        return [
          { name: 'Dashboard', href: '/sub-admin/dashboard', icon: LayoutDashboard },
          { name: 'My Visits', href: '/sub-admin/visits', icon: CheckSquare },
          { name: 'Availability', href: '/sub-admin/availability', icon: Settings },
          { name: 'History', href: '/sub-admin/history', icon: FileText },
        ];
      case 'head_admin':
        return [
          { name: 'Dashboard', href: '/head-admin/dashboard', icon: LayoutDashboard },
          { name: 'Admins', href: '/head-admin/admins', icon: Users },
          { name: 'Sub Admins', href: '/head-admin/sub-admins', icon: Users },
          { name: 'All Requests', href: '/head-admin/requests', icon: FileText },
          { name: 'Audit Logs', href: '/head-admin/audit-logs', icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  return (
    <div className={cn("fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0", isOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="h-full flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {getLinks().map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )
              }
            >
              <item.icon className="mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}""",
  'src/components/layout/DashboardLayout.tsx': """import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}""",
  'src/pages/public/HomePage.tsx': """import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">MIVC System</h1>
        <div className="flex gap-4">
          <Link to="/login" className="hover:text-gray-200">Login</Link>
          <Link to="/complaint" className="hover:text-gray-200">File a Complaint</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Verify Your Merchant Instruments
        </h2>
        <p className="mt-4 text-xl text-gray-500">
          Ensure fair trade with certified weighing and measuring instruments.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/verify/scan" className="btn-primary px-8 py-3 text-lg">Scan QR Code</Link>
          <Link to="/merchant/register" className="btn-secondary px-8 py-3 text-lg">Register as Merchant</Link>
        </div>
      </main>
    </div>
  );
}""",
  'src/pages/auth/LoginPage.tsx': """import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage({ role = 'merchant' }: { role?: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuth({ id: '1', name: 'Test User', email }, 'dummy-token', role);
    navigate(`/${role === 'merchant' ? 'merchant' : role.replace('_', '-')}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in as {role.replace('_', ' ')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}""",
  'src/pages/merchant/MerchantDashboard.tsx': """import React from 'react';

export default function MerchantDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Merchant Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">12</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
          <dd className="mt-1 text-3xl font-semibold text-yellow-600">3</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">8</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Certificates</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">5</dd>
        </div>
      </div>
    </div>
  );
}""",
  'src/pages/admin/AdminDashboard.tsx': """import React from 'react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">45</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Sub-Admins</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">12</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Recent Complaints</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">4</dd>
        </div>
      </div>
    </div>
  );
}""",
  'src/pages/subAdmin/SubAdminDashboard.tsx': """import React from 'react';

export default function SubAdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Sub-Admin Dashboard</h1>
      <div className="mt-4">
        <h2 className="text-lg font-medium text-gray-900">My Visits Today</h2>
        <div className="mt-2 card">No visits scheduled for today.</div>
      </div>
    </div>
  );
}""",
  'src/pages/headAdmin/HeadAdminDashboard.tsx': """import React from 'react';

export default function HeadAdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Head Admin Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Admins</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">5</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Sub-Admins</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">42</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Merchants</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">1,204</dd>
        </div>
        <div className="card text-center">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Certificates</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">8,930</dd>
        </div>
      </div>
    </div>
  );
}""",
  'src/pages/errors/NotFoundPage.tsx': """import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-500">Page not found.</p>
        <Link to="/" className="mt-6 inline-block btn-primary">Go back home</Link>
      </div>
    </div>
  );
}""",
  'src/pages/errors/ForbiddenPage.tsx': """import React from 'react';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">403</h1>
        <p className="mt-4 text-xl text-gray-500">Access Denied.</p>
        <Link to="/" className="mt-6 inline-block btn-primary">Go back home</Link>
      </div>
    </div>
  );
}""",
  'src/pages/errors/ServerErrorPage.tsx': """import React from 'react';
import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">500</h1>
        <p className="mt-4 text-xl text-gray-500">Internal Server Error.</p>
        <Link to="/" className="mt-6 inline-block btn-primary">Go back home</Link>
      </div>
    </div>
  );
}""",
  'src/pages/public/VerifyPage.tsx': "import React from 'react';\nexport default function VerifyPage() { return <div>Verify Page</div>; }",
  'src/pages/public/ComplaintPage.tsx': "import React from 'react';\nexport default function ComplaintPage() { return <div>Complaint Page</div>; }",
  'src/pages/auth/MerchantRegisterPage.tsx': "import React from 'react';\nexport default function MerchantRegisterPage() { return <div>Merchant Register</div>; }",
  'src/pages/merchant/ApplicationFormPage.tsx': "import React from 'react';\nexport default function ApplicationFormPage() { return <div>Application Form</div>; }",
  'src/pages/merchant/ApplicationListPage.tsx': "import React from 'react';\nexport default function ApplicationListPage() { return <div>Application List</div>; }",
  'src/pages/merchant/ApplicationDetailPage.tsx': "import React from 'react';\nexport default function ApplicationDetailPage() { return <div>Application Detail</div>; }",
  'src/pages/merchant/CertificatesPage.tsx': "import React from 'react';\nexport default function CertificatesPage() { return <div>Certificates</div>; }",
  'src/pages/admin/RequestListPage.tsx': "import React from 'react';\nexport default function RequestListPage() { return <div>Requests List</div>; }",
  'src/pages/admin/RequestDetailPage.tsx': "import React from 'react';\nexport default function RequestDetailPage() { return <div>Request Detail</div>; }",
  'src/pages/admin/SubAdminManagePage.tsx': "import React from 'react';\nexport default function SubAdminManagePage() { return <div>Sub Admin Manage</div>; }",
  'src/pages/admin/ComplaintsPage.tsx': "import React from 'react';\nexport default function ComplaintsPage() { return <div>Complaints</div>; }",
  'src/pages/admin/AuditLogPage.tsx': "import React from 'react';\nexport default function AuditLogPage() { return <div>Audit Log</div>; }",
  'src/pages/subAdmin/VisitsPage.tsx': "import React from 'react';\nexport default function VisitsPage() { return <div>Visits</div>; }",
  'src/pages/subAdmin/VisitDetailPage.tsx': "import React from 'react';\nexport default function VisitDetailPage() { return <div>Visit Detail</div>; }",
  'src/pages/subAdmin/AvailabilityPage.tsx': "import React from 'react';\nexport default function AvailabilityPage() { return <div>Availability</div>; }",
  'src/pages/subAdmin/VisitHistoryPage.tsx': "import React from 'react';\nexport default function VisitHistoryPage() { return <div>Visit History</div>; }",
  'src/pages/headAdmin/AdminManagePage.tsx': "import React from 'react';\nexport default function AdminManagePage() { return <div>Admin Manage</div>; }",
  'src/pages/headAdmin/AllRequestsPage.tsx': "import React from 'react';\nexport default function AllRequestsPage() { return <div>All Requests</div>; }",
  'src/pages/headAdmin/SubAdminManagePage.tsx': "import React from 'react';\nexport default function AllSubAdminsPage() { return <div>All Sub Admins</div>; }",
  'src/pages/headAdmin/AuditLogPage.tsx': "import React from 'react';\nexport default function FullAuditLogPage() { return <div>Full Audit Log</div>; }"
}

for relative_path, content in files.items():
    full_path = os.path.join(base_dir, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created {full_path}")
