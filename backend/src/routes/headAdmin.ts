import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { hashPassword, revokeAllUserTokens } from '../services/authService';
import { sendEmail } from '../services/notificationService';
import { logAction } from '../services/auditService';

const router = Router();

router.use(authenticate, requireRole('head_admin'), requirePasswordChanged);

function paginate(page: number, pageSize: number) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res, next) => {
  try {
    const [[admins], [subAdmins], [merchants], [requests], [certs], [pending], [openComplaints]] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) FROM admins WHERE deleted_at IS NULL`),
      query<{ count: string }>(`SELECT COUNT(*) FROM sub_admins WHERE deleted_at IS NULL`),
      query<{ count: string }>(`SELECT COUNT(*) FROM merchants WHERE deleted_at IS NULL`),
      query<{ count: string }>(`SELECT COUNT(*) FROM verification_requests WHERE deleted_at IS NULL`),
      query<{ count: string }>(`SELECT COUNT(*) FROM certificates`),
      query<{ count: string }>(`SELECT COUNT(*) FROM verification_requests WHERE status IN ('submitted','assigned','inspected') AND deleted_at IS NULL`),
      query<{ count: string }>(`SELECT COUNT(*) FROM complaints WHERE status IN ('filed','under_review')`),
    ]);
    res.json({
      totalAdmins: parseInt(admins.count, 10),
      totalSubAdmins: parseInt(subAdmins.count, 10),
      totalMerchants: parseInt(merchants.count, 10),
      totalRequests: parseInt(requests.count, 10),
      totalCertificates: parseInt(certs.count, 10),
      pendingRequests: parseInt(pending.count, 10),
      openComplaints: parseInt(openComplaints.count, 10),
    });
  } catch (err) { next(err); }
});

// ─── Admins ───────────────────────────────────────────────────────────────────

router.get('/admins', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const { limit, offset } = paginate(page, pageSize);
    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM admins WHERE deleted_at IS NULL`);
    const data = await query(
      `SELECT id, email, full_name, phone, region, is_active, force_password_change, created_at FROM admins WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

const createAdminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),
});

router.post('/admins', validate(createAdminSchema), async (req, res, next) => {
  try {
    const ha = req.user!;
    const { email, fullName, phone, region } = req.body as z.infer<typeof createAdminSchema>;

    const existing = await queryOne(`SELECT id FROM admins WHERE email = $1`, [email]);
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }

    const defaultPassword = phone ? phone.replace(/\D/g, '') : crypto.randomBytes(8).toString('hex');
    const tempPassword = defaultPassword || 'Admin@123';
    const passwordHash = await hashPassword(tempPassword);

    const [admin] = await query<{ id: string }>(
      `INSERT INTO admins (id, email, password_hash, full_name, phone, region, is_active, force_password_change, created_by)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, true, $6)
       RETURNING id`,
      [email, passwordHash, fullName, phone ?? null, region ?? null, ha.id]
    );

    await sendEmail(email, '[MIVC] Admin Account Created',
      `<h2>Your Admin Account</h2><p>Email: ${email}</p><p>Initial Password: <strong>${tempPassword}</strong></p><p>You will be required to change your password on first login.</p>`
    );

    await logAction({
      actorId: ha.id, actorRole: ha.role, actorEmail: ha.email,
      action: 'ADMIN_CREATED', entityType: 'admin', entityId: admin.id,
      afterState: { email, fullName, region }, ipAddress: req.ip,
    });

    res.status(201).json({ id: admin.id, message: 'Admin created successfully' });
  } catch (err) { next(err); }
});

router.patch('/admins/:id', async (req, res, next) => {
  try {
    const { fullName, phone, region } = req.body;
    const before = await queryOne(`SELECT full_name, phone, region FROM admins WHERE id = $1`, [req.params.id]);
    await query(
      `UPDATE admins SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), region = COALESCE($3, region), updated_at = NOW() WHERE id = $4`,
      [fullName, phone, region, req.params.id]
    );
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: 'ADMIN_UPDATED', entityType: 'admin', entityId: req.params.id, beforeState: before ?? undefined, afterState: { fullName, phone, region } });
    res.json({ message: 'Admin updated' });
  } catch (err) { next(err); }
});

router.patch('/admins/:id/disable', async (req, res, next) => {
  try {
    const admin = await queryOne<{ is_active: boolean }>(`SELECT is_active FROM admins WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
    const newStatus = !admin.is_active;
    await query(`UPDATE admins SET is_active = $1, updated_at = NOW() WHERE id = $2`, [newStatus, req.params.id]);
    if (!newStatus) await revokeAllUserTokens(req.params.id, 'admin');
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: newStatus ? 'ADMIN_ENABLED' : 'ADMIN_DISABLED', entityType: 'admin', entityId: req.params.id });
    res.json({ message: `Admin ${newStatus ? 'enabled' : 'disabled'}`, isActive: newStatus });
  } catch (err) { next(err); }
});

router.delete('/admins/:id', async (req, res, next) => {
  try {
    const admin = await queryOne(`SELECT id FROM admins WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
    await query(`UPDATE admins SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await revokeAllUserTokens(req.params.id, 'admin');
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: 'ADMIN_DELETED', entityType: 'admin', entityId: req.params.id });
    res.json({ message: 'Admin soft-deleted' });
  } catch (err) { next(err); }
});

// ─── Sub-Admins (system-wide) ─────────────────────────────────────────────────

router.get('/sub-admins', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const { limit, offset } = paginate(page, pageSize);
    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM sub_admins WHERE deleted_at IS NULL`);
    const data = await query(
      `SELECT id, email, full_name, phone, region, employee_id, is_active, created_at FROM sub_admins WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

router.patch('/sub-admins/:id/disable', async (req, res, next) => {
  try {
    const sa = await queryOne<{ is_active: boolean }>(`SELECT is_active FROM sub_admins WHERE id = $1`, [req.params.id]);
    if (!sa) { res.status(404).json({ error: 'Sub-admin not found' }); return; }
    const newStatus = !sa.is_active;
    await query(`UPDATE sub_admins SET is_active = $1, updated_at = NOW() WHERE id = $2`, [newStatus, req.params.id]);
    if (!newStatus) await revokeAllUserTokens(req.params.id, 'sub_admin');
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: newStatus ? 'SUB_ADMIN_ENABLED' : 'SUB_ADMIN_DISABLED', entityType: 'sub_admin', entityId: req.params.id });
    res.json({ message: `Sub-admin ${newStatus ? 'enabled' : 'disabled'}` });
  } catch (err) { next(err); }
});

router.delete('/sub-admins/:id', async (req, res, next) => {
  try {
    await query(`UPDATE sub_admins SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await revokeAllUserTokens(req.params.id, 'sub_admin');
    await logAction({ actorId: req.user!.id, actorRole: req.user!.role, action: 'SUB_ADMIN_DELETED', entityType: 'sub_admin', entityId: req.params.id });
    res.json({ message: 'Sub-admin soft-deleted' });
  } catch (err) { next(err); }
});

// ─── All Requests ─────────────────────────────────────────────────────────────

router.get('/requests', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const { limit, offset } = paginate(page, pageSize);
    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM verification_requests WHERE deleted_at IS NULL`);
    const data = await query(
      `SELECT r.*, m.business_name, m.email AS merchant_email, it.name AS instrument_type_name
       FROM verification_requests r
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE r.deleted_at IS NULL ORDER BY r.submitted_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

// ─── Full Audit Log ───────────────────────────────────────────────────────────

router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '50', 10);
    const { limit, offset } = paginate(page, pageSize);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (req.query.action) { conditions.push(`action = $${params.length + 1}`); params.push(req.query.action); }
    if (req.query.entityType) { conditions.push(`entity_type = $${params.length + 1}`); params.push(req.query.entityType); }
    if (req.query.dateFrom) { conditions.push(`created_at >= $${params.length + 1}`); params.push(req.query.dateFrom); }
    if (req.query.dateTo) { conditions.push(`created_at <= $${params.length + 1}`); params.push(req.query.dateTo); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM audit_logs ${where}`, params);
    const data = await query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

export default router;
