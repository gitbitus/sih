import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { config } from '../config/env';

const router = Router();

// ─── Public Search ────────────────────────────────────────────────────────────

router.get('/search', async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.trim());
    const search = `%${q.trim()}%`;

    if (type === 'certificate') {
      const data = await query(
        `SELECT c.id, c.certificate_number, c.issue_date, c.expiry_date, c.status,
                m.id AS merchant_id, m.business_name, m.owner_name, it.name AS instrument_type_name
         FROM certificates c
         JOIN verification_requests r ON r.id = c.request_id
         JOIN merchants m ON m.id = c.merchant_id
         JOIN instrument_types it ON it.id = r.instrument_type_id
         WHERE c.certificate_number ILIKE $1 
            OR m.business_name ILIKE $1
            ${isUUID ? 'OR c.id = $2 OR m.id = $2' : ''}
         LIMIT 20`,
        isUUID ? [search, q.trim()] : [search]
      );
      res.json({ data, type: 'certificate' });
    } else {
      // Search merchants & certificates combined or general search
      const data = await query(
        `SELECT m.id, m.business_name, m.owner_name, m.phone, m.email,
                COUNT(c.id) FILTER (WHERE c.status = 'active') AS active_certificates,
                COUNT(c.id) AS total_certificates
         FROM merchants m
         LEFT JOIN certificates c ON c.merchant_id = m.id
         WHERE (m.business_name ILIKE $1 OR m.owner_name ILIKE $1 ${isUUID ? 'OR m.id = $2' : ''})
           AND m.is_active = true AND m.deleted_at IS NULL
         GROUP BY m.id
         LIMIT 20`,
        isUUID ? [search, q.trim()] : [search]
      );
      res.json({ data, type: 'merchant' });
    }
  } catch (err) { next(err); }
});

// ─── Instrument Types ─────────────────────────────────────────────────────────

router.get('/instrument-types', async (req, res, next) => {
  try {
    const data = await query(
      `SELECT id, name, description FROM instrument_types WHERE is_active = true ORDER BY name ASC`
    );
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
