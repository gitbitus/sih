import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { query, queryOne } from '../config/db';
import { AuthUser, UserRole } from '../types';

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, forcePasswordChange: user.forcePasswordChange ?? false },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): AuthUser {
  return jwt.verify(token, config.jwt.secret) as AuthUser;
}

export function verifyRefreshTokenJwt(token: string): { id: string; role: UserRole } {
  return jwt.verify(token, config.jwt.refreshSecret) as { id: string; role: UserRole };
}

// ─── Refresh Token DB ─────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function saveRefreshToken(
  userId: string,
  role: UserRole,
  token: string,
  ipAddress?: string
): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (id, user_id, user_role, token_hash, expires_at, ip_address)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
    [userId, role, tokenHash, expiresAt.toISOString(), ipAddress ?? null]
  );
}

export async function verifyRefreshToken(token: string): Promise<{ id: string; role: UserRole } | null> {
  try {
    const payload = verifyRefreshTokenJwt(token);
    const tokenHash = hashToken(token);
    const row = await queryOne<{ is_revoked: boolean; expires_at: string }>(
      `SELECT is_revoked, expires_at FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    if (!row || row.is_revoked || new Date(row.expires_at) < new Date()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await query(`UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllUserTokens(userId: string, role: UserRole): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND user_role = $2`,
    [userId, role]
  );
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function generatePasswordResetToken(userId: string, role: UserRole): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await query(
    `INSERT INTO password_reset_tokens (id, user_id, user_role, token_hash, expires_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
    [userId, role, tokenHash, expiresAt.toISOString()]
  );
  return rawToken;
}

export async function validatePasswordResetToken(
  rawToken: string
): Promise<{ id: string; userId: string; role: UserRole } | null> {
  const tokenHash = hashToken(rawToken);
  const row = await queryOne<{ id: string; user_id: string; user_role: UserRole; is_used: boolean; expires_at: string }>(
    `SELECT id, user_id, user_role, is_used, expires_at FROM password_reset_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  if (!row || row.is_used || new Date(row.expires_at) < new Date()) return null;
  return { id: row.id, userId: row.user_id, role: row.user_role };
}

export async function markTokenUsed(tokenId: string): Promise<void> {
  await query(`UPDATE password_reset_tokens SET is_used = true WHERE id = $1`, [tokenId]);
}

// ─── User Lookup ──────────────────────────────────────────────────────────────

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  force_password_change?: boolean;
  deleted_at?: string | null;
}

export async function getUserByEmail(email: string, role: UserRole): Promise<DbUser | null> {
  const tableMap: Record<UserRole, string> = {
    head_admin: 'head_admins',
    admin: 'admins',
    sub_admin: 'sub_admins',
    merchant: 'merchants',
  };
  const table = tableMap[role];
  if (!email) return null;

  if (role === 'admin' || role === 'sub_admin') {
    return queryOne<DbUser>(
      `SELECT id, email, password_hash, is_active, force_password_change FROM ${table} WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
  }
  return queryOne<DbUser>(
    `SELECT id, email, password_hash, is_active FROM ${table} WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
}

export async function getUserById(userId: string, role: UserRole): Promise<DbUser | null> {
  const tableMap: Record<UserRole, string> = {
    head_admin: 'head_admins',
    admin: 'admins',
    sub_admin: 'sub_admins',
    merchant: 'merchants',
  };
  const table = tableMap[role];
  return queryOne<DbUser>(`SELECT id, email, password_hash, is_active FROM ${table} WHERE id = $1 AND deleted_at IS NULL`, [userId]);
}

export async function updatePasswordInTable(userId: string, role: UserRole, passwordHash: string): Promise<void> {
  const tableMap: Record<UserRole, string> = {
    head_admin: 'head_admins',
    admin: 'admins',
    sub_admin: 'sub_admins',
    merchant: 'merchants',
  };
  const table = tableMap[role];
  if (role === 'admin' || role === 'sub_admin') {
    await query(
      `UPDATE ${table} SET password_hash = $1, force_password_change = false, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
  } else {
    await query(
      `UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
  }
}

// Legacy alias
export const env = {
  JWT_SECRET: config.jwt.secret,
  JWT_REFRESH_SECRET: config.jwt.refreshSecret,
};
