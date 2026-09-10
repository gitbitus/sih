import { Router } from 'express';
import { queryOne } from '../config/db';

const router = Router();

router.get('/:certificateId', async (req, res, next) => {
  try {
    const cert = await queryOne(
      `SELECT c.id, c.certificate_number, c.issue_date, c.expiry_date, c.status, c.qr_code_path,
              c.revocation_reason,
              m.business_name, m.owner_name,
              r.operating_address_street, r.operating_address_city, r.operating_address_state, r.operating_address_pin,
              r.make, r.model, r.serial_number,
              it.name AS instrument_type_name
       FROM certificates c
       JOIN verification_requests r ON r.id = c.request_id
       JOIN merchants m ON m.id = c.merchant_id
       JOIN instrument_types it ON it.id = r.instrument_type_id
       WHERE c.id::text = $1 OR c.certificate_number = $1`,
      [req.params.certificateId]
    );

    if (!cert) {
      res.status(404).json({ error: 'Certificate not found', isValid: false });
      return;
    }

    const now = new Date();
    const expiryDate = new Date((cert as any).expiry_date);
    const isValid = (cert as any).status === 'active' && expiryDate > now;

    res.json({
      ...(cert as object),
      isValid,
      verifiedAt: now.toISOString(),
    });
  } catch (err) { next(err); }
});

export default router;
