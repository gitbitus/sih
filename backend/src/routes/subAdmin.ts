import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { uploadFields, uploadMultiple } from '../middleware/upload';
import { saveFile } from '../services/storageService';
import { createNotification, sendEmail } from '../services/notificationService';
import { logAction } from '../services/auditService';
import path from 'path';
import fs from 'fs';

const router = Router();

// ─── Sub-Admin Visits ─────────────────────────────────────────────────────────

function paginate(page: number, pageSize: number) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

// GET /sub-admin/visits - today + upcoming
router.get('/visits', authenticate, requireRole('sub_admin'), requirePasswordChanged, async (req, res, next) => {
  try {
    const subAdminId = req.user!.id;
    const data = await query(
      `SELECT v.*, r.id AS request_id, r.status AS request_status,
              r.operating_address_street, r.operating_address_city, r.operating_address_state, r.operating_address_pin,
              m.business_name, m.owner_name, m.phone AS merchant_phone, m.email AS merchant_email,
              it.name AS instrument_type_name
       FROM visits v
       JOIN verification_requests r ON r.id = v.request_id
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE v.sub_admin_id = $1
         AND v.scheduled_date >= CURRENT_DATE
         AND v.status = 'scheduled'
       ORDER BY v.scheduled_date ASC
       LIMIT 50`,
      [subAdminId]
    );
    res.json({ data });
  } catch (err) { next(err); }
});

// GET /sub-admin/visits/history
router.get('/visits/history', authenticate, requireRole('sub_admin'), requirePasswordChanged, async (req, res, next) => {
  try {
    const subAdminId = req.user!.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const { limit, offset } = paginate(page, pageSize);
    const statusFilter = req.query.status as string | undefined;

    const conditions = ['v.sub_admin_id = $1'];
    const params: unknown[] = [subAdminId];
    if (statusFilter) { conditions.push(`v.status = $${params.length + 1}`); params.push(statusFilter); }
    const where = conditions.join(' AND ');

    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM visits v WHERE ${where}`, params);
    const data = await query(
      `SELECT v.*, m.business_name, m.owner_name, it.name AS instrument_type_name
       FROM visits v
       JOIN verification_requests r ON r.id = v.request_id
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE ${where}
       ORDER BY v.scheduled_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

// GET /sub-admin/visits/:id
router.get('/visits/:id', authenticate, requireRole('sub_admin'), requirePasswordChanged, async (req, res, next) => {
  try {
    const visit = await queryOne(
      `SELECT v.id, v.request_id, v.sub_admin_id, v.admin_id, v.scheduled_date, v.status, v.otp_verified, v.notes, v.created_at, v.updated_at,
              r.make, r.model, r.serial_number, r.year_of_manufacture, r.last_calibration_date,
              r.operating_address_street, r.operating_address_city, r.operating_address_state, r.operating_address_pin,
              m.business_name, m.owner_name, m.phone AS merchant_phone, m.email AS merchant_email,
              m.country_code, it.name AS instrument_type_name
       FROM visits v
       JOIN verification_requests r ON r.id = v.request_id
       JOIN merchants m ON m.id = r.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE v.id = $1 AND v.sub_admin_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (!visit) { res.status(404).json({ error: 'Visit not found' }); return; }

    const inspection = await queryOne(`SELECT * FROM inspections WHERE visit_id = $1`, [req.params.id]);
    let photos: unknown[] = [];
    if (inspection) {
      photos = await query(`SELECT * FROM inspection_photos WHERE inspection_id = $1`, [(inspection as any).id]);
    }
    const documents = await query(`SELECT * FROM request_documents WHERE request_id = $1`, [(visit as any).request_id]);

    res.json({ ...visit, inspection, inspectionPhotos: photos, documents });
  } catch (err) { next(err); }
});

// POST /sub-admin/visits/:id/verify-otp
router.post(
  '/visits/:id/verify-otp',
  authenticate, requireRole('sub_admin'), requirePasswordChanged,
  validate(z.object({ otp: z.string().length(6, 'OTP must be 6 digits') })),
  async (req, res, next) => {
    try {
      const { otp } = req.body;
      const subAdminId = req.user!.id;

      const visit = await queryOne<{ id: string; otp_code: string; otp_verified: boolean; status: string }>(
        `SELECT id, otp_code, otp_verified, status FROM visits WHERE id = $1 AND sub_admin_id = $2`,
        [req.params.id, subAdminId]
      );

      if (!visit) {
        res.status(404).json({ error: 'Inspection visit not found' });
        return;
      }

      if (visit.otp_verified) {
        res.json({ message: 'OTP already verified', verified: true });
        return;
      }

      if (visit.otp_code !== otp.trim()) {
        res.status(400).json({ error: 'Invalid merchant verification OTP. Please ask the merchant for the 6-digit code shown on their dashboard.' });
        return;
      }

      await query(`UPDATE visits SET otp_verified = true, updated_at = NOW() WHERE id = $1`, [req.params.id]);

      await logAction({
        actorId: subAdminId, actorRole: 'sub_admin',
        action: 'INSPECTION_OTP_VERIFIED', entityType: 'visit', entityId: req.params.id as string,
      });

      res.json({ message: 'Merchant on-site identity verified successfully!', verified: true });
    } catch (err) { next(err); }
  }
);

// POST /sub-admin/visits/:id/inspection
router.post(
  '/visits/:id/inspection',
  authenticate, requireRole('sub_admin'), requirePasswordChanged,
  uploadFields([
    { name: 'photos', maxCount: 10 },
    { name: 'signature', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const subAdminId = req.user!.id;
      const visit = await queryOne<{ id: string; request_id: string; sub_admin_id: string; admin_id: string; otp_verified: boolean }>(
        `SELECT id, request_id, sub_admin_id, admin_id, otp_verified FROM visits WHERE id = $1 AND sub_admin_id = $2 AND status = 'scheduled'`,
        [req.params.id, subAdminId]
      );
      if (!visit) { res.status(404).json({ error: 'Visit not found or not scheduled' }); return; }

      if (!visit.otp_verified) {
        res.status(403).json({ error: 'Merchant on-site OTP verification required before submitting inspection.' });
        return;
      }

      const existingInspection = await queryOne(`SELECT id FROM inspections WHERE visit_id = $1`, [req.params.id]);
      if (existingInspection) { res.status(409).json({ error: 'Inspection already submitted for this visit' }); return; }

      const { observations, decision = 'approve', decisionReason, structuredData } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      let signaturePath: string | null = null;
      if (files?.signature?.[0]) {
        signaturePath = await saveFile(files.signature[0].path, files.signature[0].filename);
      }

      const [inspection] = await query<{ id: string }>(
        `INSERT INTO inspections (id, visit_id, observations, decision, decision_reason, structured_data, signature_path, inspected_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [req.params.id, observations, decision, decisionReason || null, structuredData ? JSON.parse(structuredData) : null, signaturePath]
      );

      if (files?.photos) {
        for (const photo of files.photos) {
          const filePath = await saveFile(photo.path, photo.filename);
          await query(
            `INSERT INTO inspection_photos (id, inspection_id, file_path, file_name)
             VALUES (uuid_generate_v4(), $1, $2, $3)`,
            [inspection.id, filePath, photo.originalname]
          );
        }
      }

      await query(`UPDATE visits SET status = 'completed', updated_at = NOW() WHERE id = $1`, [req.params.id]);
      await query(`UPDATE verification_requests SET status = 'inspected', updated_at = NOW() WHERE id = $1`, [visit.request_id]);

      // Notify the regional admin that the inspection is completed and ready for final certification sign-off
      if (visit.admin_id) {
        await createNotification(
          visit.admin_id, 'admin', 'approved',
          'Field Inspection Completed — Awaiting Certificate Approval',
          `Field inspector has completed inspection for request #${visit.request_id.slice(0, 8)} (${decision === 'approve' ? 'Recommended for Pass' : 'Recommended for Fail'}). Ready for your final certificate sign-off.`,
          'request', visit.request_id
        );
      }

      await logAction({
        actorId: subAdminId, actorRole: 'sub_admin',
        action: 'INSPECTION_SUBMITTED', entityType: 'inspection', entityId: inspection.id,
        afterState: { visitId: req.params.id, requestId: visit.request_id, decision },
      });

      res.status(201).json({ inspectionId: inspection.id, message: 'Inspection submitted and forwarded to Regional Admin for final certification' });
    } catch (err) { next(err); }
  }
);

// POST /sub-admin/visits/:id/approve
router.post('/visits/:id/approve', authenticate, requireRole('sub_admin'), requirePasswordChanged, async (req, res, next) => {
  try {
    const subAdminId = req.user!.id;
    const visit = await queryOne<{ id: string; request_id: string; admin_id: string }>(
      `SELECT id, request_id, admin_id FROM visits WHERE id = $1 AND sub_admin_id = $2`,
      [req.params.id, subAdminId]
    );
    if (!visit) { res.status(404).json({ error: 'Visit not found' }); return; }

    const inspection = await queryOne<{ id: string }>(
      `SELECT id FROM inspections WHERE visit_id = $1`, [req.params.id]
    );
    if (!inspection) { res.status(400).json({ error: 'No inspection found for this visit' }); return; }

    await query(`UPDATE inspections SET decision = 'approve', updated_at = NOW() WHERE id = $1`, [inspection.id]);

    // Get request info for merchant notification
    const request = await queryOne<{ merchant_id: string; business_name: string }>(
      `SELECT r.merchant_id, m.business_name FROM verification_requests r JOIN merchants m ON m.id = r.merchant_id WHERE r.id = $1`,
      [visit.request_id]
    );

    // Notify the admin for final sign-off
    if (visit.admin_id) {
      await createNotification(visit.admin_id, 'admin', 'approved',
        'Inspection Approved — Awaiting Final Sign-off',
        `Sub-admin has approved inspection for ${request?.business_name}. Ready for certificate issuance.`,
        'visit', String(req.params.id)
      );
    }

    await logAction({
      actorId: subAdminId, actorRole: 'sub_admin',
      action: 'INSPECTION_APPROVED', entityType: 'inspection', entityId: inspection.id,
    });

    res.json({ message: 'Inspection approved and forwarded to admin' });
  } catch (err) { next(err); }
});

// POST /sub-admin/visits/:id/reject
router.post('/visits/:id/reject', authenticate, requireRole('sub_admin'), requirePasswordChanged,
  validate(z.object({ reason: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const subAdminId = req.user!.id;
      const visit = await queryOne<{ id: string; request_id: string }>(
        `SELECT id, request_id FROM visits WHERE id = $1 AND sub_admin_id = $2`,
        [req.params.id, subAdminId]
      );
      if (!visit) { res.status(404).json({ error: 'Visit not found' }); return; }

      const inspection = await queryOne<{ id: string }>(`SELECT id FROM inspections WHERE visit_id = $1`, [req.params.id]);
      if (!inspection) { res.status(400).json({ error: 'No inspection found' }); return; }

      await query(
        `UPDATE inspections SET decision = 'reject', decision_reason = $1 WHERE id = $2`,
        [req.body.reason, inspection.id]
      );
      await query(
        `UPDATE verification_requests SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
        [req.body.reason, visit.request_id]
      );

      const request = await queryOne<{ merchant_id: string; merchant_email: string; business_name: string }>(
        `SELECT r.merchant_id, m.email AS merchant_email, m.business_name FROM verification_requests r JOIN merchants m ON m.id = r.merchant_id WHERE r.id = $1`,
        [visit.request_id]
      );
      if (request) {
        await createNotification(request.merchant_id, 'merchant', 'rejected',
          'Inspection Rejected', `Your inspection was rejected: ${req.body.reason}`, 'request', visit.request_id
        );
        await sendEmail(request.merchant_email, '[MIVC] Inspection Rejected',
          `<h2>Inspection Rejected</h2><p>Reason: ${req.body.reason}</p>`
        );
      }

      await logAction({
        actorId: subAdminId, actorRole: 'sub_admin',
        action: 'INSPECTION_REJECTED', entityType: 'inspection', entityId: inspection.id,
        afterState: { reason: req.body.reason },
      });

      res.json({ message: 'Inspection rejected' });
    } catch (err) { next(err); }
  }
);

// ─── Availability ─────────────────────────────────────────────────────────────

router.get('/availability', authenticate, requireRole('sub_admin'), async (req, res, next) => {
  try {
    const subAdminId = req.user!.id;
    const data = await query(
      `SELECT * FROM sub_admin_availability WHERE sub_admin_id = $1 AND date >= CURRENT_DATE ORDER BY date ASC`,
      [subAdminId]
    );
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/availability', authenticate, requireRole('sub_admin'),
  validate(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isAvailable: z.boolean(),
    reason: z.string().optional(),
  })),
  async (req, res, next) => {
    try {
      const subAdminId = req.user!.id;
      const { date, isAvailable, reason } = req.body;
      await query(
        `INSERT INTO sub_admin_availability (id, sub_admin_id, date, is_available, reason)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)
         ON CONFLICT (sub_admin_id, date) DO UPDATE SET is_available = $3, reason = $4`,
        [subAdminId, date, isAvailable, reason ?? null]
      );
      res.json({ message: 'Availability updated' });
    } catch (err) { next(err); }
  }
);

router.delete('/availability/:date', authenticate, requireRole('sub_admin'), async (req, res, next) => {
  try {
    await query(
      `DELETE FROM sub_admin_availability WHERE sub_admin_id = $1 AND date = $2`,
      [req.user!.id, req.params.date]
    );
    res.json({ message: 'Availability removed' });
  } catch (err) { next(err); }
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get('/notifications', authenticate, requireRole('sub_admin'), async (req, res, next) => {
  try {
    const { getUnreadNotifications } = await import('../services/notificationService');
    const data = await getUnreadNotifications(req.user!.id, req.user!.role);
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
