import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { config } from '../config/env';
import { addDays, formatISO, parseISO, getDay } from 'date-fns';

const router = Router();

// ─── Get Availability Window ──────────────────────────────────────────────────

router.get('/:subAdminId', authenticate, async (req, res, next) => {
  try {
    const { subAdminId } = req.params;
    const today = new Date();
    const windowDays = config.scheduling.calendarWindowDays;
    const maxVisits = config.scheduling.maxVisitsPerDay;

    // Collect all dates in the window
    const dates: string[] = [];
    for (let i = 0; i < windowDays; i++) {
      const d = addDays(today, i);
      dates.push(formatISO(d, { representation: 'date' }));
    }

    // Fetch unavailability records for this sub-admin in the window
    const unavailRecords = await query<{ date: string; reason?: string }>(
      `SELECT date::text, reason FROM sub_admin_availability
       WHERE sub_admin_id = $1 AND date >= $2 AND date <= $3 AND is_available = false`,
      [subAdminId, dates[0], dates[dates.length - 1]]
    );
    const unavailSet = new Set(unavailRecords.map(r => r.date));

    // Fetch visit counts per date in the window
    const visitCounts = await query<{ scheduled_date: string; count: string }>(
      `SELECT scheduled_date::text, COUNT(*) AS count
       FROM visits
       WHERE sub_admin_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3 AND status != 'cancelled'
       GROUP BY scheduled_date`,
      [subAdminId, dates[0], dates[dates.length - 1]]
    );
    const visitCountMap: Record<string, number> = {};
    for (const row of visitCounts) {
      visitCountMap[row.scheduled_date] = parseInt(row.count, 10);
    }

    const result = dates.map(date => {
      const dayOfWeek = getDay(parseISO(date)); // 0 = Sunday
      let status: 'available' | 'unavailable' | 'booked' | 'sunday';
      if (dayOfWeek === 0) {
        status = 'sunday';
      } else if (unavailSet.has(date)) {
        status = 'unavailable';
      } else if ((visitCountMap[date] ?? 0) >= maxVisits) {
        status = 'booked';
      } else {
        status = 'available';
      }
      return {
        date,
        status,
        visitCount: visitCountMap[date] ?? 0,
        maxVisits,
        reason: unavailRecords.find(r => r.date === date)?.reason,
      };
    });

    res.json({ data: result, subAdminId, windowDays, maxVisitsPerDay: maxVisits });
  } catch (err) { next(err); }
});

// ─── Set Availability ─────────────────────────────────────────────────────────

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

// ─── Remove Availability Record ───────────────────────────────────────────────

router.delete('/availability/:date', authenticate, requireRole('sub_admin'), async (req, res, next) => {
  try {
    await query(
      `DELETE FROM sub_admin_availability WHERE sub_admin_id = $1 AND date = $2`,
      [req.user!.id, req.params.date]
    );
    res.json({ message: 'Availability record removed' });
  } catch (err) { next(err); }
});

export default router;
