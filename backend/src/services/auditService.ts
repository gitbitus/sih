import { query } from '../config/db';
import { UserRole } from '../types';

interface AuditParams {
  actorId: string;
  actorRole: UserRole;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAction(params: AuditParams): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
         id, actor_id, actor_role, actor_email, action,
         entity_type, entity_id, before_state, after_state,
         ip_address, user_agent
       ) VALUES (
         uuid_generate_v4(), $1, $2, $3, $4,
         $5, $6, $7, $8,
         $9, $10
       )`,
      [
        params.actorId,
        params.actorRole,
        params.actorEmail ?? null,
        params.action,
        params.entityType,
        params.entityId ?? null,
        params.beforeState ? JSON.stringify(params.beforeState) : null,
        params.afterState ? JSON.stringify(params.afterState) : null,
        params.ipAddress ?? null,
        params.userAgent ?? null,
      ]
    );
  } catch (err) {
    // Audit log failures should not break main flow
    console.error('[AuditService] Failed to log action:', err);
  }
}
