import { Router } from 'express';
import { pool } from '../config/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

export default router;
