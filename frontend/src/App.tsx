import React from 'react';
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

import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />
      <Route path="/complaint" element={<ComplaintPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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

export default App;