import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { issueCertificate } from '../services/certificateService';
import { createNotification, sendEmail } from '../services/notificationService';
import { logAction } from '../services/auditService';
import { hashPassword } from '../services/authService';
import { config } from '../config/env';
import { reallocateSubAdminVisits } from '../services/assignmentService';
import crypto from 'crypto';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin', 'head_admin'), requirePasswordChanged);

// ─── Helper: paginate ─────────────────────────────────────────────────────────
function paginate(page: number, pageSize: number): { limit: number; offset: number } {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

// ─── Helper: safely cast req.query string values ──────────────────────────────
function qs(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

// ─── Helper: cast req.params / req.user.id to string ─────────────────────────
// Needed because TS6 / @types/express may type these as string | string[]
function str(val: unknown): string { return String(val ?? ''); }

// ─── Requests ─────────────────────────────────────────────────────────────────

const requestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  instrumentTypeId: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

router.get('/requests', async (req, res, next) => {
  try {
    const q = requestsQuerySchema.parse(req.query);
    const { limit, offset } = paginate(q.page, q.pageSize);

    const conditions: string[] = ['r.deleted_at IS NULL'];
    const params: unknown[] = [];
    let i = 1;

    if (q.status) { conditions.push(`r.status = $${i++}`); params.push(q.status); }
    if (q.instrumentTypeId) { conditions.push(`r.instrument_type_id = $${i++}`); params.push(q.instrumentTypeId); }
    if (q.search) { conditions.push(`m.business_name ILIKE $${i++}`); params.push(`%${q.search}%`); }
    if (q.dateFrom) { conditions.push(`r.submitted_at >= $${i++}`); params.push(q.dateFrom); }
    if (q.dateTo) { conditions.push(`r.submitted_at <= $${i++}`); params.push(q.dateTo); }

    const where = conditions.join(' AND ');

    const [totalRow] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM verification_requests r
       JOIN merchants m ON m.id = r.merchant_id
       WHERE ${where}`, params
    );

    const data = await query(
      `SELECT r.*, m.business_name, m.email AS merchant_email, m.owner_name,
              it.name AS instrument_type_name,
              sa.full_name AS sub_admin_name
       FROM verification_requests r
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       LEFT JOIN sub_admins sa ON sa.id = r.assigned_sub_admin_id
       WHERE ${where}
       ORDER BY r.submitted_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    res.json({
      data,
      total: parseInt(totalRow.count, 10),
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(parseInt(totalRow.count, 10) / q.pageSize),
    });
  } catch (err) { next(err); }
});

router.get('/requests/:id', async (req, res, next) => {
  try {
    const request = await queryOne(
      `SELECT r.*, m.business_name, m.email AS merchant_email, m.owner_name, m.phone AS merchant_phone, m.phone,
              it.name AS instrument_type_name,
              sa.full_name AS sub_admin_name, sa.email AS sub_admin_email,
              a.full_name AS admin_name
       FROM verification_requests r
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       LEFT JOIN sub_admins sa ON sa.id = r.assigned_sub_admin_id
       LEFT JOIN admins a ON a.id = r.assigned_admin_id
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

    const documents = await query(`SELECT * FROM request_documents WHERE request_id = $1`, [req.params.id]);
    const visit = await queryOne(`SELECT * FROM visits WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1`, [req.params.id]);
    let inspection = null;
    let inspectionPhotos: unknown[] = [];
    if (visit) {
      inspection = await queryOne(`SELECT * FROM inspections WHERE visit_id = $1`, [(visit as any).id]);
      if (inspection) {
        inspectionPhotos = await query(`SELECT * FROM inspection_photos WHERE inspection_id = $1`, [(inspection as any).id]);
      }
    }
    const certificate = await queryOne(`SELECT * FROM certificates WHERE request_id = $1`, [req.params.id]);

    res.json({ request, ...request, documents, visit, inspection, inspectionPhotos, certificate });
  } catch (err) { next(err); }
});

const assignSchema = z.object({
  subAdminId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post('/requests/:id/assign', requireRole('admin'), validate(assignSchema), async (req, res, next) => {
  try {
    const { subAdminId, scheduledDate } = req.body as z.infer<typeof assignSchema>;
    const admin = req.user!;

    // Check request exists and is assignable
    const request = await queryOne<{ id: string; status: string; merchant_id: string; merchant_email: string; business_name: string }>(
      `SELECT r.id, r.status, r.merchant_id, m.email AS merchant_email, m.business_name
       FROM verification_requests r JOIN merchants m ON m.id = r.merchant_id
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
    if (!['submitted', 'assigned'].includes(request.status)) {
      res.status(400).json({ error: 'Request is not in an assignable state' }); return;
    }

    // Check day is not Sunday (0 = Sunday)
    const dayOfWeek = new Date(scheduledDate).getUTCDay();
    if (dayOfWeek === 0) { res.status(400).json({ error: 'Cannot schedule on Sundays' }); return; }

    // Check sub-admin availability
    const unavail = await queryOne(
      `SELECT id FROM sub_admin_availability WHERE sub_admin_id = $1 AND date = $2 AND is_available = false`,
      [subAdminId, scheduledDate]
    );
    if (unavail) { res.status(409).json({ error: 'Sub-admin is unavailable on this date' }); return; }

    // Check MAX_VISITS_PER_DAY
    const [visitCount] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM visits WHERE sub_admin_id = $1 AND scheduled_date = $2 AND status != 'cancelled'`,
      [subAdminId, scheduledDate]
    );
    if (parseInt(visitCount.count, 10) >= config.scheduling.maxVisitsPerDay) {
      res.status(409).json({ error: `Sub-admin already has ${config.scheduling.maxVisitsPerDay} visits on this date` }); return;
    }

    // Get sub-admin info
    const subAdmin = await queryOne<{ id: string; full_name: string; email: string }>(
      `SELECT id, full_name, email FROM sub_admins WHERE id = $1 AND is_active = true AND deleted_at IS NULL`,
      [subAdminId]
    );
    if (!subAdmin) { res.status(404).json({ error: 'Sub-admin not found or inactive' }); return; }

    // Generate 6-digit verification OTP for merchant physical inspection authentication
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create visit
    const [visit] = await query<{ id: string }>(
      `INSERT INTO visits (id, request_id, sub_admin_id, admin_id, scheduled_date, status, otp_code, otp_verified)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'scheduled', $5, false)
       RETURNING id`,
      [req.params.id, subAdminId, admin.id, scheduledDate, otpCode]
    );

    // Update request
    await query(
      `UPDATE verification_requests SET status = 'assigned', assigned_sub_admin_id = $1, assigned_admin_id = $2, updated_at = NOW() WHERE id = $3`,
      [subAdminId, admin.id, req.params.id]
    );

    // Notify sub-admin
    await createNotification(subAdminId, 'sub_admin', 'assignment',
      'New Inspection Assigned', `You have been assigned to inspect ${request.business_name} on ${scheduledDate}.`,
      'visit', visit.id
    );
    await sendEmail(subAdmin.email, '[MIVC] New Inspection Assignment',
      `<h2>New Inspection Assignment</h2><p>You have been assigned to inspect <strong>${request.business_name}</strong> on <strong>${scheduledDate}</strong>.</p><p>Log in to the Sub-Admin portal for details.</p>`
    );

    // Notify merchant
    await createNotification(request.merchant_id, 'merchant', 'inspection_scheduled',
      'Inspection Scheduled', `Your inspection has been scheduled for ${scheduledDate}.`, 'request', str(req.params.id)
    );
    await sendEmail(request.merchant_email, '[MIVC] Inspection Scheduled',
      `<h2>Inspection Scheduled</h2><p>Your instrument verification inspection has been scheduled for <strong>${scheduledDate}</strong>.</p>`
    );

    await logAction({
      actorId: admin.id, actorRole: admin.role, actorEmail: admin.email,
      action: 'REQUEST_ASSIGNED', entityType: 'verification_request', entityId: str(req.params.id),
      afterState: { subAdminId, scheduledDate, visitId: visit.id }, ipAddress: req.ip,
    });

    res.json({ visitId: visit.id, message: 'Request assigned successfully' });
  } catch (err) { next(err); }
});

router.post('/requests/:id/approve', requireRole('admin'), async (req, res, next) => {
  try {
    const certificate = await issueCertificate(String(req.params.id), String(req.user!.id));
    res.json({ certificate, message: 'Certificate issued successfully' });
  } catch (err) { next(err); }
});

router.post('/requests/:id/reject', requireRole('admin'), validate(z.object({ reason: z.string().min(1) })), async (req, res, next) => {
  try {
    const admin = req.user!;
    const request = await queryOne<{ merchant_id: string; merchant_email: string; business_name: string; status: string }>(
      `SELECT r.status, r.merchant_id, m.email AS merchant_email, m.business_name
       FROM verification_requests r JOIN merchants m ON m.id = r.merchant_id WHERE r.id = $1`,
      [req.params.id]
    );
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

    await query(
      `UPDATE verification_requests SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
      [req.body.reason, req.params.id]
    );

    await createNotification(request.merchant_id, 'merchant', 'rejected',
      'Application Rejected', `Your application for ${request.business_name} has been rejected: ${req.body.reason}`,
      'request', str(req.params.id)
    );
    await sendEmail(request.merchant_email, '[MIVC] Application Rejected',
      `<h2>Application Rejected</h2><p>Your application has been rejected.</p><p>Reason: ${req.body.reason}</p>`
    );

    await logAction({
      actorId: admin.id, actorRole: admin.role, actorEmail: admin.email,
      action: 'REQUEST_REJECTED', entityType: 'verification_request', entityId: str(req.params.id),
      afterState: { reason: req.body.reason }, ipAddress: req.ip,
    });

    res.json({ message: 'Request rejected' });
  } catch (err) { next(err); }
});

// ─── Sub-Admins ───────────────────────────────────────────────────────────────

router.get('/sub-admins', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const { limit, offset } = paginate(page, pageSize);

    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM sub_admins WHERE deleted_at IS NULL`);
    const data = await query(
      `SELECT id, email, full_name, phone, region, employee_id, is_active, force_password_change, created_at
       FROM sub_admins WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

const createSubAdminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
});

router.post('/sub-admins', validate(createSubAdminSchema), async (req, res, next) => {
  try {
    const admin = req.user!;
    const { email, fullName, phone, region, employeeId } = req.body as z.infer<typeof createSubAdminSchema>;

    const existing = await queryOne(`SELECT id FROM sub_admins WHERE email = $1`, [email]);
    if (existing) { res.status(409).json({ error: 'Email already exists' }); return; }

    const defaultPassword = phone ? phone.replace(/\D/g, '') : crypto.randomBytes(8).toString('hex');
    const tempPassword = defaultPassword || 'Inspector@123';
    const { hashPassword: hp } = await import('../services/authService');
    const passwordHash = await hp(tempPassword);

    const [sa] = await query<{ id: string }>(
      `INSERT INTO sub_admins (id, email, password_hash, full_name, phone, region, employee_id, is_active, force_password_change, created_by, created_by_role)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true, true, $7, $8)
       RETURNING id`,
      [email, passwordHash, fullName, phone ?? null, region ?? null, employeeId ?? null, admin.id, admin.role]
    );

    await sendEmail(email, '[MIVC] Sub-Admin Account Created',
      `<h2>Your Sub-Admin Account</h2><p>Email: ${email}</p><p>Initial Password: <strong>${tempPassword}</strong></p><p>You will be required to change your password on first login.</p>`
    );

    await logAction({
      actorId: admin.id, actorRole: admin.role, actorEmail: admin.email,
      action: 'SUB_ADMIN_CREATED', entityType: 'sub_admin', entityId: sa.id,
      afterState: { email, fullName, region }, ipAddress: req.ip,
    });

    res.status(201).json({ id: sa.id, message: 'Sub-admin created' });
  } catch (err) { next(err); }
});

router.patch('/sub-admins/:id', async (req, res, next) => {
  try {
    const { fullName, phone, region, employeeId } = req.body;
    await query(
      `UPDATE sub_admins SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), region = COALESCE($3, region), employee_id = COALESCE($4, employee_id), updated_at = NOW() WHERE id = $5`,
      [fullName, phone, region, employeeId, req.params.id]
    );
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: 'SUB_ADMIN_UPDATED', entityType: 'sub_admin', entityId: req.params.id });
    res.json({ message: 'Sub-admin updated' });
  } catch (err) { next(err); }
});

router.patch('/sub-admins/:id/disable', async (req, res, next) => {
  try {
    const sa = await queryOne<{ is_active: boolean }>(`SELECT is_active FROM sub_admins WHERE id = $1`, [req.params.id]);
    if (!sa) { res.status(404).json({ error: 'Sub-admin not found' }); return; }
    const newStatus = !sa.is_active;
    await query(`UPDATE sub_admins SET is_active = $1, updated_at = NOW() WHERE id = $2`, [newStatus, req.params.id]);
    const { revokeAllUserTokens } = await import('../services/authService');
    if (!newStatus) await revokeAllUserTokens(req.params.id, 'sub_admin');
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: newStatus ? 'SUB_ADMIN_ENABLED' : 'SUB_ADMIN_DISABLED', entityType: 'sub_admin', entityId: req.params.id });
    res.json({ message: `Sub-admin ${newStatus ? 'enabled' : 'disabled'}`, isActive: newStatus });
  } catch (err) { next(err); }
});

router.post('/sub-admins/:id/leave', validate(z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().optional(),
})), async (req, res, next) => {
  try {
    const subAdminId = String(req.params.id);
    const { date, reason } = req.body;

    // Upsert leave record in sub_admin_availability
    await query(
      `INSERT INTO sub_admin_availability (id, sub_admin_id, date, is_available, reason, created_at)
       VALUES (uuid_generate_v4(), $1, $2, false, $3, NOW())
       ON CONFLICT (sub_admin_id, date) DO UPDATE SET is_available = false, reason = $3`,
      [subAdminId, date, reason || 'Admin granted leave']
    );

    // Reallocate visits scheduled on that date
    const reallocation = await reallocateSubAdminVisits(subAdminId, date, String(req.user!.id));

    res.json({
      message: `Sub-admin marked on leave for ${date}. ${reallocation.reallocatedCount} visit(s) reallocated automatically.`,
      ...reallocation,
    });
  } catch (err) { next(err); }
});

router.get('/sub-admins/:id/schedule', async (req, res, next) => {
  try {
    const subAdminId = String(req.params.id);
    const visits = await query(
      `SELECT v.*, r.operating_address_city, m.business_name, m.owner_name, it.name AS instrument_type_name
       FROM visits v
       JOIN verification_requests r ON r.id = v.request_id
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE v.sub_admin_id = $1 AND v.status = 'scheduled'
       ORDER BY v.scheduled_date ASC`,
      [subAdminId]
    );

    const leaves = await query(
      `SELECT * FROM sub_admin_availability
       WHERE sub_admin_id = $1 AND is_available = false AND date >= CURRENT_DATE
       ORDER BY date ASC`,
      [subAdminId]
    );

    res.json({ visits, leaves });
  } catch (err) { next(err); }
});

// ─── Complaints ───────────────────────────────────────────────────────────────

router.get('/complaints', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const { limit, offset } = paginate(page, pageSize);
    const status = req.query.status as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM complaints ${where}`, params);
    const data = await query(
      `SELECT * FROM complaints ${where} ORDER BY filed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

router.patch('/complaints/:id', validate(z.object({ status: z.string(), adminNotes: z.string().optional() })), async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    await query(
      `UPDATE complaints SET status = $1, admin_notes = $2, resolved_by = $3, updated_at = NOW() WHERE id = $4`,
      [status, adminNotes ?? null, req.user!.id, req.params.id]
    );
    await logAction({ actorId: str(req.user!.id), actorRole: req.user!.role, action: 'COMPLAINT_UPDATED', entityType: 'complaint', entityId: str(req.params.id), afterState: { status } });
    res.json({ message: 'Complaint updated' });
  } catch (err) { next(err); }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '50', 10);
    const { limit, offset } = paginate(page, pageSize);

    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM audit_logs`);
    const data = await query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get('/notifications', async (req, res, next) => {
  try {
    const { getUnreadNotifications } = await import('../services/notificationService');
    const notifications = await getUnreadNotifications(req.user!.id, req.user!.role);
    res.json({ data: notifications });
  } catch (err) { next(err); }
});

router.patch('/notifications/read-all', async (req, res, next) => {
  try {
    const { markAllRead } = await import('../services/notificationService');
    await markAllRead(req.user!.id, req.user!.role);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

export default router;
