import { query, queryOne } from '../config/db';
import { config } from '../config/env';
import { createNotification, sendEmail } from './notificationService';
import { logAction } from './auditService';

/**
 * Add business days to a date (skipping Sundays).
 */
export function addBusinessDays(startDate: Date, days: number): string {
  let count = 0;
  const cur = new Date(startDate);
  while (count < days) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0) { // Skip Sunday
      count++;
    }
  }
  return cur.toISOString().split('T')[0];
}

/**
 * Automatically assign an incoming verification request to the earliest available sub-admin.
 */
export async function autoAssignVerificationRequest(requestId: string): Promise<{
  success: boolean;
  visitId?: string;
  subAdminId?: string;
  subAdminName?: string;
  scheduledDate?: string;
  estimatedReturnDate?: string;
  otpCode?: string;
  message?: string;
}> {
  const request = await queryOne<{
    id: string;
    merchant_id: string;
    status: string;
    merchant_email: string;
    business_name: string;
    operating_address_city: string;
  }>(
    `SELECT r.id, r.merchant_id, r.status, r.operating_address_city,
            m.email AS merchant_email, m.business_name
     FROM verification_requests r
     JOIN merchants m ON m.id = r.merchant_id
     WHERE r.id = $1`,
    [requestId]
  );

  if (!request) {
    return { success: false, message: 'Request not found' };
  }

  // Active sub-admins
  const subAdmins = await query<{ id: string; full_name: string; email: string }>(
    `SELECT id, full_name, email FROM sub_admins WHERE is_active = true AND deleted_at IS NULL ORDER BY created_at ASC`
  );

  if (subAdmins.length === 0) {
    return { success: false, message: 'No active sub-admins available in the system' };
  }

  const maxVisits = config.scheduling?.maxVisitsPerDay || 3;
  let assignedDate: string | null = null;
  let selectedOfficer: { id: string; full_name: string; email: string } | null = null;

  // Search over the next 14 calendar days starting from tomorrow
  const candidate = new Date();
  for (let d = 1; d <= 14; d++) {
    candidate.setDate(candidate.getDate() + 1);
    if (candidate.getDay() === 0) continue; // Skip Sunday

    const dateStr = candidate.toISOString().split('T')[0];

    // Check availability for all sub-admins on this date
    for (const sa of subAdmins) {
      // Check if on leave
      const leave = await queryOne(
        `SELECT id FROM sub_admin_availability WHERE sub_admin_id = $1 AND date = $2 AND is_available = false`,
        [sa.id, dateStr]
      );
      if (leave) continue;

      // Count scheduled visits
      const [vCount] = await query<{ count: string }>(
        `SELECT COUNT(*) FROM visits WHERE sub_admin_id = $1 AND scheduled_date = $2 AND status = 'scheduled'`,
        [sa.id, dateStr]
      );

      if (parseInt(vCount.count, 10) < maxVisits) {
        assignedDate = dateStr;
        selectedOfficer = sa;
        break;
      }
    }

    if (assignedDate && selectedOfficer) break;
  }

  // Fallback: If all slots in 14 days are packed, pick tomorrow with the first sub-admin
  if (!assignedDate || !selectedOfficer) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    if (fallback.getDay() === 0) fallback.setDate(fallback.getDate() + 1);
    assignedDate = fallback.toISOString().split('T')[0];
    selectedOfficer = subAdmins[0];
  }

  // Estimated return date: 3 business days after pickup
  const scheduledDateObj = new Date(assignedDate);
  const estimatedReturnDate = addBusinessDays(scheduledDateObj, 3);

  // Generate 6-digit officer verification token (pickup) & merchant delivery confirmation token (return)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const deliveryOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Create scheduled visit
  const [visit] = await query<{ id: string }>(
    `INSERT INTO visits (id, request_id, sub_admin_id, scheduled_date, return_date, status, otp_code, otp_verified, delivery_otp_code, delivery_otp_verified)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'scheduled', $5, false, $6, false)
     RETURNING id`,
    [requestId, selectedOfficer.id, assignedDate, estimatedReturnDate, otpCode, deliveryOtpCode]
  );

  // Update verification request
  await query(
    `UPDATE verification_requests
     SET status = 'assigned',
         assigned_sub_admin_id = $1,
         estimated_return_date = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [selectedOfficer.id, estimatedReturnDate, requestId]
  );

  // Notify merchant
  await createNotification(
    request.merchant_id,
    'merchant',
    'inspection_scheduled',
    'Pickup & Calibration Scheduled',
    `Officer ${selectedOfficer.full_name} is scheduled to collect your instrument on ${assignedDate}. Officer will provide a 6-digit verification code upon arrival. Estimated return date: ${estimatedReturnDate}.`,
    'request',
    requestId
  );

  await sendEmail(
    request.merchant_email,
    '[MIVC] Verification Machine Pickup Scheduled',
    `<h2>Instrument Pickup Scheduled</h2>
     <p>Dear <strong>${request.business_name}</strong>,</p>
     <p>Your verification fee has been received and Officer <strong>${selectedOfficer.full_name}</strong> has been automatically assigned.</p>
     <ul>
       <li><strong>Scheduled Pickup Date:</strong> ${assignedDate}</li>
       <li><strong>Estimated Return Date:</strong> ${estimatedReturnDate}</li>
       <li><strong>Anti-Impersonation Protocol:</strong> The officer will provide you a 6-digit Verification Token upon arrival. Enter this in your portal to confirm their identity and hand over the equipment safely.</li>
     </ul>`
  );

  // Notify Sub-Admin
  await createNotification(
    selectedOfficer.id,
    'sub_admin',
    'assignment',
    'New Instrument Pickup Scheduled',
    `You are assigned to collect an instrument from ${request.business_name} on ${assignedDate}. Your verification token for this visit is ${otpCode}.`,
    'visit',
    visit.id
  );

  await logAction({
    actorId: selectedOfficer.id,
    actorRole: 'sub_admin',
    action: 'REQUEST_AUTO_ASSIGNED',
    entityType: 'verification_request',
    entityId: requestId,
    afterState: { subAdminId: selectedOfficer.id, scheduledDate: assignedDate, estimatedReturnDate, visitId: visit.id },
  });

  return {
    success: true,
    visitId: visit.id,
    subAdminId: selectedOfficer.id,
    subAdminName: selectedOfficer.full_name,
    scheduledDate: assignedDate,
    estimatedReturnDate,
    otpCode,
  };
}

/**
 * Reallocate all scheduled visits for a sub-admin who is taking leave on a specific date.
 */
export async function reallocateSubAdminVisits(
  subAdminId: string,
  leaveDate: string,
  adminId?: string
): Promise<{
  reallocatedCount: number;
  details: Array<{
    visitId: string;
    businessName: string;
    action: 'reassigned_same_day' | 'rescheduled_new_date';
    assignedToName: string;
    newDate: string;
  }>;
}> {
  const maxVisits = config.scheduling?.maxVisitsPerDay || 3;

  // Find all scheduled visits for this sub-admin on the leave date
  const pendingVisits = await query<{
    visit_id: string;
    request_id: string;
    merchant_id: string;
    business_name: string;
    merchant_email: string;
  }>(
    `SELECT v.id AS visit_id, v.request_id, r.merchant_id, m.business_name, m.email AS merchant_email
     FROM visits v
     JOIN verification_requests r ON r.id = v.request_id
     JOIN merchants m ON m.id = r.merchant_id
     WHERE v.sub_admin_id = $1 AND v.scheduled_date = $2 AND v.status = 'scheduled'`,
    [subAdminId, leaveDate]
  );

  const otherSubAdmins = await query<{ id: string; full_name: string; email: string }>(
    `SELECT id, full_name, email FROM sub_admins
     WHERE id != $1 AND is_active = true AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [subAdminId]
  );

  const details: Array<{
    visitId: string;
    businessName: string;
    action: 'reassigned_same_day' | 'rescheduled_new_date';
    assignedToName: string;
    newDate: string;
  }> = [];

  for (const visit of pendingVisits) {
    let reassignedOfficer: { id: string; full_name: string; email: string } | null = null;
    let targetDate = leaveDate;
    let isSameDay = false;

    // 1. First attempt: Reassign to another sub-admin on the same day
    for (const candidate of otherSubAdmins) {
      const leave = await queryOne(
        `SELECT id FROM sub_admin_availability WHERE sub_admin_id = $1 AND date = $2 AND is_available = false`,
        [candidate.id, leaveDate]
      );
      if (leave) continue;

      const [vCount] = await query<{ count: string }>(
        `SELECT COUNT(*) FROM visits WHERE sub_admin_id = $1 AND scheduled_date = $2 AND status = 'scheduled'`,
        [candidate.id, leaveDate]
      );
      if (parseInt(vCount.count, 10) < maxVisits) {
        reassignedOfficer = candidate;
        isSameDay = true;
        break;
      }
    }

    // 2. Second attempt: If no one is available on the same day, find the next earliest available business date
    if (!reassignedOfficer) {
      const allActive = await query<{ id: string; full_name: string; email: string }>(
        `SELECT id, full_name, email FROM sub_admins WHERE is_active = true AND deleted_at IS NULL`
      );

      const candidateDay = new Date(leaveDate);
      for (let step = 1; step <= 14; step++) {
        candidateDay.setDate(candidateDay.getDate() + 1);
        if (candidateDay.getDay() === 0) continue; // Skip Sunday

        const dStr = candidateDay.toISOString().split('T')[0];
        for (const candidate of allActive) {
          const leave = await queryOne(
            `SELECT id FROM sub_admin_availability WHERE sub_admin_id = $1 AND date = $2 AND is_available = false`,
            [candidate.id, dStr]
          );
          if (leave) continue;

          const [vCount] = await query<{ count: string }>(
            `SELECT COUNT(*) FROM visits WHERE sub_admin_id = $1 AND scheduled_date = $2 AND status = 'scheduled'`,
            [candidate.id, dStr]
          );
          if (parseInt(vCount.count, 10) < maxVisits) {
            reassignedOfficer = candidate;
            targetDate = dStr;
            break;
          }
        }
        if (reassignedOfficer) break;
      }
    }

    // Apply reallocation
    if (reassignedOfficer) {
      const returnDate = addBusinessDays(new Date(targetDate), 3);

      await query(
        `UPDATE visits
         SET sub_admin_id = $1, scheduled_date = $2, return_date = $3, updated_at = NOW()
         WHERE id = $4`,
        [reassignedOfficer.id, targetDate, returnDate, visit.visit_id]
      );

      await query(
        `UPDATE verification_requests
         SET assigned_sub_admin_id = $1, estimated_return_date = $2, updated_at = NOW()
         WHERE id = $3`,
        [reassignedOfficer.id, returnDate, visit.request_id]
      );

      // Notify merchant of reassignment / reschedule
      await createNotification(
        visit.merchant_id,
        'merchant',
        'inspection_scheduled',
        'Officer Schedule Update',
        isSameDay
          ? `Your pickup officer for ${targetDate} has been updated to Officer ${reassignedOfficer.full_name}.`
          : `Your equipment pickup has been rescheduled to ${targetDate} by Officer ${reassignedOfficer.full_name}. Estimated return: ${returnDate}.`,
        'request',
        visit.request_id
      );

      // Notify new officer
      await createNotification(
        reassignedOfficer.id,
        'sub_admin',
        'assignment',
        'Reallocated Visit Assignment',
        `You have been assigned to collect equipment from ${visit.business_name} on ${targetDate}.`,
        'visit',
        visit.visit_id
      );

      details.push({
        visitId: visit.visit_id,
        businessName: visit.business_name,
        action: isSameDay ? 'reassigned_same_day' : 'rescheduled_new_date',
        assignedToName: reassignedOfficer.full_name,
        newDate: targetDate,
      });
    }
  }

  if (adminId) {
    await logAction({
      actorId: adminId,
      actorRole: 'admin',
      action: 'SUB_ADMIN_LEAVE_GRANTED_REALLOCATED',
      entityType: 'sub_admin',
      entityId: subAdminId,
      afterState: { leaveDate, reallocatedCount: details.length, details },
    });
  }

  return {
    reallocatedCount: details.length,
    details,
  };
}
