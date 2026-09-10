// ─── Role & Status Enums ────────────────────────────────────────────────────

export type UserRole = 'head_admin' | 'admin' | 'sub_admin' | 'merchant';

export type RequestStatus =
  | 'submitted'
  | 'assigned'
  | 'inspection_scheduled'
  | 'inspected'
  | 'approved'
  | 'rejected'
  | 'certified'
  | 'expired';

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export type CertificateStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export type ComplaintStatus = 'filed' | 'under_review' | 'resolved' | 'dismissed';

export type NotificationType =
  | 'assignment'
  | 'inspection_scheduled'
  | 'approved'
  | 'rejected'
  | 'certificate_issued'
  | 'certificate_expiring'
  | 'complaint_filed'
  | 'general';

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  forcePasswordChange?: boolean;
}

// ─── User Models ─────────────────────────────────────────────────────────────

export interface HeadAdmin {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  region?: string;
  is_active: boolean;
  force_password_change: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SubAdmin {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  region?: string;
  employee_id?: string;
  is_active: boolean;
  force_password_change: boolean;
  created_by: string;
  created_by_role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Merchant {
  id: string;
  email: string;
  business_name: string;
  owner_name: string;
  phone: string;
  country_code: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// ─── Legacy alias ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// ─── Domain Models ───────────────────────────────────────────────────────────

export interface InstrumentType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  merchant_id: string;
  instrument_type_id: string;
  make?: string;
  model?: string;
  serial_number?: string;
  year_of_manufacture?: number;
  last_calibration_date?: string;
  operating_address_street: string;
  operating_address_city: string;
  operating_address_state: string;
  operating_address_pin: string;
  operating_address_lat?: number;
  operating_address_lng?: number;
  business_reg_number?: string;
  preferred_inspection_start?: string;
  preferred_inspection_end?: string;
  status: RequestStatus;
  assigned_admin_id?: string;
  assigned_sub_admin_id?: string;
  rejection_reason?: string;
  submitted_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined fields
  merchant_business_name?: string;
  merchant_email?: string;
  instrument_type_name?: string;
  sub_admin_name?: string;
}

export interface Visit {
  id: string;
  request_id: string;
  sub_admin_id: string;
  admin_id: string;
  scheduled_date: string;
  status: VisitStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  visit_id: string;
  observations: string;
  structured_data?: Record<string, unknown>;
  decision?: 'approve' | 'reject';
  decision_reason?: string;
  signature_path?: string;
  inspected_at?: string;
  submitted_at: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  file_path: string;
  file_name?: string;
  uploaded_at: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  request_id: string;
  merchant_id: string;
  issued_by_admin_id: string;
  issue_date: string;
  expiry_date: string;
  qr_code_path?: string;
  pdf_path?: string;
  status: CertificateStatus;
  revocation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  merchant_id?: string;
  complainant_name: string;
  complainant_contact: string;
  description: string;
  photo_path?: string;
  status: ComplaintStatus;
  admin_notes?: string;
  resolved_by?: string;
  filed_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_role: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: UserRole;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
