import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { query, queryOne } from '../config/db';
import { NotificationType, UserRole } from '../types';

// ─── Transporter ─────────────────────────────────────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.password }
        : undefined,
    });
  }
  return transporter;
}

// ─── Email ───────────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html: htmlBody,
    });
  } catch (err) {
    // Log but don't throw — email failure should not break the main flow
    console.error('[NotificationService] Email send failed:', err);
  }
}

// ─── In-app Notifications ────────────────────────────────────────────────────

export async function createNotification(
  recipientId: string,
  recipientRole: UserRole,
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: string
): Promise<void> {
  await query(
    `INSERT INTO notifications (id, recipient_id, recipient_role, type, title, message, related_entity_type, related_entity_id)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)`,
    [recipientId, recipientRole, type, title, message, relatedEntityType ?? null, relatedEntityId ?? null]
  );
}

export async function getUnreadNotifications(
  userId: string,
  role: UserRole,
  limit = 20
): Promise<unknown[]> {
  return query(
    `SELECT * FROM notifications WHERE recipient_id = $1 AND recipient_role = $2
     ORDER BY created_at DESC LIMIT $3`,
    [userId, role, limit]
  );
}

export async function markAllRead(userId: string, role: UserRole): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = true
     WHERE recipient_id = $1 AND recipient_role = $2 AND is_read = false`,
    [userId, role]
  );
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2`,
    [notificationId, userId]
  );
}

// ─── Expiry Alerts ───────────────────────────────────────────────────────────

export function scheduleExpiryAlerts(): void {
  // Run once on startup, then every 24 hours
  runExpiryAlerts().catch(console.error);
  setInterval(() => runExpiryAlerts().catch(console.error), 24 * 60 * 60 * 1000);
}

async function runExpiryAlerts(): Promise<void> {
  try {
    // 30 days
    const expiring30 = await query<{
      id: string; certificate_number: string; merchant_id: string;
      merchant_email: string; merchant_business_name: string; expiry_date: string;
    }>(
      `SELECT c.id, c.certificate_number, c.merchant_id, c.expiry_date,
              m.email AS merchant_email, m.business_name AS merchant_business_name
       FROM certificates c
       JOIN merchants m ON m.id = c.merchant_id
       WHERE c.status = 'active'
         AND c.expiry_date::date = (CURRENT_DATE + INTERVAL '30 days')::date
         AND c.expiry_notified_30 = false`
    );
    for (const cert of expiring30) {
      await sendExpiryAlert(cert, 30);
      await query(`UPDATE certificates SET expiry_notified_30 = true WHERE id = $1`, [cert.id]);
    }

    // 15 days
    const expiring15 = await query<{
      id: string; certificate_number: string; merchant_id: string;
      merchant_email: string; merchant_business_name: string; expiry_date: string;
    }>(
      `SELECT c.id, c.certificate_number, c.merchant_id, c.expiry_date,
              m.email AS merchant_email, m.business_name AS merchant_business_name
       FROM certificates c
       JOIN merchants m ON m.id = c.merchant_id
       WHERE c.status = 'active'
         AND c.expiry_date::date = (CURRENT_DATE + INTERVAL '15 days')::date
         AND c.expiry_notified_15 = false`
    );
    for (const cert of expiring15) {
      await sendExpiryAlert(cert, 15);
      await query(`UPDATE certificates SET expiry_notified_15 = true WHERE id = $1`, [cert.id]);
    }

    // 7 days
    const expiring7 = await query<{
      id: string; certificate_number: string; merchant_id: string;
      merchant_email: string; merchant_business_name: string; expiry_date: string;
    }>(
      `SELECT c.id, c.certificate_number, c.merchant_id, c.expiry_date,
              m.email AS merchant_email, m.business_name AS merchant_business_name
       FROM certificates c
       JOIN merchants m ON m.id = c.merchant_id
       WHERE c.status = 'active'
         AND c.expiry_date::date = (CURRENT_DATE + INTERVAL '7 days')::date
         AND c.expiry_notified_7 = false`
    );
    for (const cert of expiring7) {
      await sendExpiryAlert(cert, 7);
      await query(`UPDATE certificates SET expiry_notified_7 = true WHERE id = $1`, [cert.id]);
    }
  } catch (err) {
    console.error('[ExpiryAlerts] Error running expiry alerts:', err);
  }
}

async function sendExpiryAlert(
  cert: { certificate_number: string; merchant_id: string; merchant_email: string; merchant_business_name: string; expiry_date: string; id: string },
  daysLeft: number
): Promise<void> {
  await createNotification(
    cert.merchant_id,
    'merchant',
    'certificate_expiring',
    `Certificate Expiring in ${daysLeft} Days`,
    `Your certificate ${cert.certificate_number} for ${cert.merchant_business_name} expires on ${cert.expiry_date}. Please initiate renewal.`
  );
  await sendEmail(
    cert.merchant_email,
    `[MIVC] Certificate Expiring in ${daysLeft} Days — ${cert.certificate_number}`,
    `<h2>Certificate Expiry Alert</h2>
     <p>Dear Merchant,</p>
     <p>Your instrument verification certificate <strong>${cert.certificate_number}</strong> will expire in <strong>${daysLeft} days</strong> (on ${cert.expiry_date}).</p>
     <p>Please log in to the MIVC Merchant Portal and submit a renewal application to avoid any disruption.</p>
     <p>Regards,<br/>MIVC System</p>`
  );
}
