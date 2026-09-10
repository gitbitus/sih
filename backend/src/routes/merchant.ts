import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { query, queryOne } from '../config/db';
import { hashPassword, generateAccessToken, generateRefreshToken, saveRefreshToken } from '../services/authService';
import { createNotification, sendEmail } from '../services/notificationService';
import { logAction } from '../services/auditService';
import { uploadFields, uploadMultiple } from '../middleware/upload';
import { saveFile, getFilePath } from '../services/storageService';
import { config } from '../config/env';
import path from 'path';
import fs from 'fs';

const router = Router();

function paginate(page: number, pageSize: number) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

// ─── Register ─────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  phone: z.string().min(6),
  countryCode: z.string().default('+91'),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, businessName, ownerName, phone, countryCode } = req.body as z.infer<typeof registerSchema>;

    const existing = await queryOne(`SELECT id FROM merchants WHERE email = $1`, [email]);
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [merchant] = await query<{ id: string }>(
      `INSERT INTO merchants (id, email, password_hash, business_name, owner_name, phone, country_code, is_active, email_verified, email_verification_token)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true, false, $7)
       RETURNING id`,
      [email, passwordHash, businessName, ownerName, phone, countryCode, verificationToken]
    );

    const verifyUrl = `${config.corsOrigin}/api/merchants/verify-email?token=${verificationToken}`;
    await sendEmail(email, '[MIVC] Verify Your Email',
      `<h2>Welcome to MIVC System</h2><p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    );

    await logAction({ actorId: merchant.id, actorRole: 'merchant', actorEmail: email, action: 'MERCHANT_REGISTERED', entityType: 'merchant', entityId: merchant.id });

    res.status(201).json({ id: merchant.id, message: 'Registration successful. Please verify your email.' });
  } catch (err) { next(err); }
});

// ─── Email Verification ───────────────────────────────────────────────────────

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) { res.status(400).json({ error: 'Token required' }); return; }
    const merchant = await queryOne<{ id: string }>(
      `SELECT id FROM merchants WHERE email_verification_token = $1 AND email_verified = false`, [token]
    );
    if (!merchant) { res.status(400).json({ error: 'Invalid or expired verification token' }); return; }
    await query(`UPDATE merchants SET email_verified = true, email_verification_token = NULL, updated_at = NOW() WHERE id = $1`, [merchant.id]);
    res.redirect(`${config.corsOrigin}/merchant/login?verified=true`);
  } catch (err) { next(err); }
});

// ─── Login (merchant-specific) ────────────────────────────────────────────────

router.post('/login', validate(z.object({ email: z.string().email(), password: z.string() })), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { getUserByEmail, comparePassword } = await import('../services/authService');
    const user = await getUserByEmail(email, 'merchant');
    if (!user || !user.is_active) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const match = await comparePassword(password, user.password_hash);
    if (!match) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const authUser = { id: user.id, email: user.email, role: 'merchant' as const };
    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);
    await saveRefreshToken(user.id, 'merchant', refreshToken, req.ip);
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: 'merchant' } });
  } catch (err) { next(err); }
});

// ─── Profile ──────────────────────────────────────────────────────────────────

router.get('/me', authenticate, requireRole('merchant'), async (req, res, next) => {
  try {
    const merchant = await queryOne(
      `SELECT id, email, business_name, owner_name, phone, country_code, is_active, email_verified, created_at FROM merchants WHERE id = $1`,
      [req.user!.id]
    );
    if (!merchant) { res.status(404).json({ error: 'Merchant not found' }); return; }

    // Fetch active inspection visits for this merchant including today's OTP
    const visits = await query(
      `SELECT v.id, v.scheduled_date, v.status, v.otp_code, v.otp_verified,
              r.id AS request_id, r.make, r.model, r.serial_number,
              it.name AS instrument_type_name,
              sa.full_name AS inspector_name, sa.phone AS inspector_phone, sa.email AS inspector_email
       FROM visits v
       JOIN verification_requests r ON r.id = v.request_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       LEFT JOIN sub_admins sa ON sa.id = v.sub_admin_id
       WHERE r.merchant_id = $1 AND v.status = 'scheduled'
       ORDER BY v.scheduled_date ASC`,
      [req.user!.id]
    );

    res.json({ merchant, visits });
  } catch (err) { next(err); }
});

// ─── Applications ─────────────────────────────────────────────────────────────

const applicationSchema = z.object({
  instrumentTypeId: z.string().uuid('Invalid instrument category'),
  make: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  serialNumber: z.string().optional().or(z.literal('')),
  yearOfManufacture: z.coerce.number().int().optional(),
  lastCalibrationDate: z.string().optional().or(z.literal('')),
  // Allow flat or nested
  operatingAddressStreet: z.string().optional(),
  operatingAddressCityName: z.string().optional(),
  operatingAddressState: z.string().optional(),
  operatingAddressPin: z.string().optional(),
  operatingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pin: z.string().optional(),
  }).optional(),
  operatingAddressLat: z.coerce.number().optional(),
  operatingAddressLng: z.coerce.number().optional(),
  businessRegNumber: z.string().optional().or(z.literal('')),
  preferredInspectionStart: z.string().optional().or(z.literal('')),
  preferredInspectionEnd: z.string().optional().or(z.literal('')),
  preferredInspectionWindow: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  declarationAccepted: z.coerce.boolean(),
});

router.post('/applications',
  authenticate, requireRole('merchant'), requirePasswordChanged,
  uploadFields([
    { name: 'documents', maxCount: 5 },
    { name: 'instrumentPhotos', maxCount: 10 },
    { name: 'signature', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const merchantId = req.user!.id;
      const parsed = applicationSchema.safeParse(req.body);
      if (!parsed.success) {
        const { formatZodError } = await import('../middleware/validate');
        res.status(400).json({ error: formatZodError(parsed.error), details: parsed.error.issues });
        return;
      }
      const data = parsed.data;

      if (!data.declarationAccepted) { res.status(400).json({ error: 'Declaration must be accepted' }); return; }

      const street = data.operatingAddressStreet || data.operatingAddress?.street || 'N/A';
      const city = data.operatingAddressCityName || data.operatingAddress?.city || 'N/A';
      const state = data.operatingAddressState || data.operatingAddress?.state || 'N/A';
      const pin = data.operatingAddressPin || data.operatingAddress?.pin || 'N/A';
      const startDate = data.preferredInspectionStart || data.preferredInspectionWindow?.startDate || null;
      const endDate = data.preferredInspectionEnd || data.preferredInspectionWindow?.endDate || null;

      const [request] = await query<{ id: string }>(
        `INSERT INTO verification_requests (
           id, merchant_id, instrument_type_id, make, model, serial_number,
           year_of_manufacture, last_calibration_date,
           operating_address_street, operating_address_city, operating_address_state, operating_address_pin,
           operating_address_lat, operating_address_lng,
           business_reg_number, preferred_inspection_start, preferred_inspection_end, status
         ) VALUES (
           uuid_generate_v4(), $1, $2, $3, $4, $5,
           $6, $7,
           $8, $9, $10, $11,
           $12, $13,
           $14, $15, $16, 'submitted'
         ) RETURNING id`,
        [
          merchantId, data.instrumentTypeId, data.make ?? null, data.model ?? null, data.serialNumber ?? null,
          data.yearOfManufacture ?? null, data.lastCalibrationDate || null,
          street, city, state, pin,
          data.operatingAddressLat ?? null, data.operatingAddressLng ?? null,
          data.businessRegNumber || null, startDate, endDate,
        ]
      );

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      // Save documents
      for (const doc of files?.documents ?? []) {
        const filePath = await saveFile(doc.path, doc.filename);
        await query(
          `INSERT INTO request_documents (id, request_id, file_path, file_name, document_type)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'document')`,
          [request.id, filePath, doc.originalname]
        );
      }

      // Save instrument photos
      for (const photo of files?.instrumentPhotos ?? []) {
        const filePath = await saveFile(photo.path, photo.filename);
        await query(
          `INSERT INTO request_documents (id, request_id, file_path, file_name, document_type)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'photo')`,
          [request.id, filePath, photo.originalname]
        );
      }

      // Save signature
      if (files?.signature?.[0]) {
        const sig = files.signature[0];
        const filePath = await saveFile(sig.path, sig.filename);
        await query(
          `INSERT INTO request_documents (id, request_id, file_path, file_name, document_type)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'signature')`,
          [request.id, filePath, sig.originalname]
        );
      }

      await createNotification(merchantId, 'merchant', 'general',
        'Application Submitted',
        `Your verification application (ID: ${request.id.substring(0, 8)}) has been submitted.`,
        'request', request.id
      );

      await logAction({
        actorId: merchantId, actorRole: 'merchant', actorEmail: req.user!.email,
        action: 'APPLICATION_SUBMITTED', entityType: 'verification_request', entityId: request.id,
      });

      res.status(201).json({ requestId: request.id, message: 'Application submitted successfully' });
    } catch (err) { next(err); }
  }
);

router.get('/applications', authenticate, requireRole('merchant'), async (req, res, next) => {
  try {
    const merchantId = req.user!.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '10', 10);
    const { limit, offset } = paginate(page, pageSize);
    const statusFilter = req.query.status as string | undefined;

    const conditions = ['r.merchant_id = $1', 'r.deleted_at IS NULL'];
    const params: unknown[] = [merchantId];
    if (statusFilter) { conditions.push(`r.status = $${params.length + 1}`); params.push(statusFilter); }

    const where = conditions.join(' AND ');
    const [total] = await query<{ count: string }>(`SELECT COUNT(*) FROM verification_requests r WHERE ${where}`, params);
    const data = await query(
      `SELECT r.id, r.status, r.submitted_at, r.updated_at, it.name AS instrument_type_name,
              r.make, r.model, r.serial_number, r.operating_address_city, r.operating_address_state
       FROM verification_requests r
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE ${where}
       ORDER BY r.submitted_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data, total: parseInt(total.count, 10), page, pageSize, totalPages: Math.ceil(parseInt(total.count, 10) / pageSize) });
  } catch (err) { next(err); }
});

router.get('/applications/:id', authenticate, requireRole('merchant'), async (req, res, next) => {
  try {
    const request = await queryOne(
      `SELECT r.*, it.name AS instrument_type_name
       FROM verification_requests r
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE r.id = $1 AND r.merchant_id = $2 AND r.deleted_at IS NULL`,
      [req.params.id, req.user!.id]
    );
    if (!request) { res.status(404).json({ error: 'Application not found' }); return; }

    const documents = await query(`SELECT * FROM request_documents WHERE request_id = $1`, [req.params.id]);
    const visit = await queryOne(
      `SELECT v.*, sa.full_name AS sub_admin_name FROM visits v LEFT JOIN sub_admins sa ON sa.id = v.sub_admin_id WHERE v.request_id = $1 ORDER BY v.created_at DESC LIMIT 1`,
      [req.params.id]
    );
    const certificate = await queryOne(`SELECT * FROM certificates WHERE request_id = $1`, [req.params.id]);

    res.json({ request, ...request, documents, visit, certificate });
  } catch (err) { next(err); }
});

// ─── Certificates ─────────────────────────────────────────────────────────────

router.get('/certificates', authenticate, requireRole('merchant'), async (req, res, next) => {
  try {
    const data = await query(
      `SELECT c.*, it.name AS instrument_type_name
       FROM certificates c
       JOIN verification_requests r ON r.id = c.request_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE c.merchant_id = $1
       ORDER BY c.issue_date DESC`,
      [req.user!.id]
    );
    res.json({ data });
  } catch (err) { next(err); }
});

router.get('/certificates/:id/download', authenticate, requireRole('merchant'), async (req, res, next) => {
  try {
    const cert = await queryOne<{ id: string; pdf_path: string; certificate_number: string; merchant_id: string }>(
      `SELECT id, pdf_path, certificate_number, merchant_id FROM certificates WHERE id = $1`,
      [req.params.id]
    );
    if (!cert || cert.merchant_id !== req.user!.id) { res.status(404).json({ error: 'Certificate not found' }); return; }
    if (!cert.pdf_path) { res.status(404).json({ error: 'PDF not available' }); return; }

    const absPath = getFilePath(cert.pdf_path);
    if (!fs.existsSync(absPath)) { res.status(404).json({ error: 'PDF file not found' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificate_number}.pdf"`);
    fs.createReadStream(absPath).pipe(res);
  } catch (err) { next(err); }
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get('/notifications', authenticate, requireRole('merchant'), async (req, res, next) => {
  try {
    const { getUnreadNotifications } = await import('../services/notificationService');
    const data = await getUnreadNotifications(req.user!.id, 'merchant');
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
