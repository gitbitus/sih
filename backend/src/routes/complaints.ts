import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { logAction } from '../services/auditService';
import { uploadSingle } from '../middleware/upload';
import { saveFile } from '../services/storageService';
import { config } from '../config/env';

const router = Router();

// ─── File a Complaint ─────────────────────────────────────────────────────────

router.post('/', uploadSingle('photo'), async (req, res, next) => {
  try {
    const { complainantName, complainantContact, description, merchantId } = req.body;

    if (!complainantName || !complainantContact || !description) {
      res.status(400).json({ error: 'complainantName, complainantContact, and description are required' });
      return;
    }

    let photoPath: string | null = null;
    if (req.file) {
      photoPath = await saveFile(req.file.path, req.file.filename);
    }

    const [complaint] = await query<{ id: string }>(
      `INSERT INTO complaints (id, merchant_id, complainant_name, complainant_contact, description, photo_path, status)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'filed')
       RETURNING id`,
      [merchantId ?? null, complainantName, complainantContact, description, photoPath]
    );

    await logAction({
      action: 'COMPLAINT_FILED', entityType: 'complaint', entityId: complaint.id,
      actorId: 'anonymous', actorRole: 'merchant',
      afterState: { complainantName, merchantId: merchantId ?? null },
    });

    res.status(201).json({ id: complaint.id, message: 'Complaint filed successfully' });
  } catch (err) { next(err); }
});

// ─── List Complaints (admin only) ─────────────────────────────────────────────

router.get('/', authenticate, requireRole('admin', 'head_admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const status = req.query.status as string | undefined;
    const merchantId = req.query.merchantId as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (status) { conditions.push(`c.status = $${params.length + 1}`); params.push(status); }
    if (merchantId) { conditions.push(`c.merchant_id = $${params.length + 1}`); params.push(merchantId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM complaints c ${where}`, params);
    const data = await query(
      `SELECT c.*, m.business_name
       FROM complaints c
       LEFT JOIN merchants m ON m.id = c.merchant_id
       ${where}
       ORDER BY c.filed_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, (page - 1) * pageSize]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

// ─── Update Complaint Status (admin only) ─────────────────────────────────────

router.patch('/:id', authenticate, requireRole('admin', 'head_admin'),
  validate(z.object({
    status: z.enum(['filed', 'under_review', 'resolved', 'dismissed']),
    adminNotes: z.string().optional(),
  })),
  async (req, res, next) => {
    try {
      const { status, adminNotes } = req.body;
      const complaint = await queryOne(`SELECT id FROM complaints WHERE id = $1`, [req.params.id]);
      if (!complaint) { res.status(404).json({ error: 'Complaint not found' }); return; }

      await query(
        `UPDATE complaints SET status = $1, admin_notes = $2, resolved_by = $3, updated_at = NOW() WHERE id = $4`,
        [status, adminNotes ?? null, req.user!.id, req.params.id]
      );

      await logAction({
        actorId: req.user!.id, actorRole: req.user!.role, actorEmail: req.user!.email,
        action: 'COMPLAINT_STATUS_UPDATED', entityType: 'complaint', entityId: String(req.params.id),
        afterState: { status, adminNotes },
      });

      res.json({ message: 'Complaint updated' });
    } catch (err) { next(err); }
  }
);

export default router;
