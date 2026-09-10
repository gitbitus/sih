import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth';
import {
  hashPassword, comparePassword, generateAccessToken, generateRefreshToken,
  saveRefreshToken, revokeRefreshToken, revokeAllUserTokens, verifyRefreshToken,
  generatePasswordResetToken, validatePasswordResetToken, markTokenUsed,
  getUserByEmail, updatePasswordInTable,
} from '../services/authService';
import { sendEmail } from '../services/notificationService';
import { logAction } from '../services/auditService';
import { config } from '../config/env';

const router = Router();

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['head_admin', 'admin', 'sub_admin', 'merchant', 'staff']).optional(),
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let role = req.body.role;

    let user: any = null;
    let detectedRole = role;

    // If role is 'admin' or 'staff' or not specified, search admin tables (head_admin -> admin -> sub_admin)
    if (!role || role === 'admin' || role === 'staff') {
      const candidates: ('head_admin' | 'admin' | 'sub_admin')[] = ['admin', 'sub_admin', 'head_admin'];
      for (const r of candidates) {
        const found = await getUserByEmail(email, r);
        if (found && found.is_active) {
          user = found;
          detectedRole = r;
          break;
        }
      }
    } else {
      user = await getUserByEmail(email, role);
    }

    if (!user || !user.is_active) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: detectedRole,
      forcePasswordChange: (user as any).force_password_change ?? false,
    };

    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);
    await saveRefreshToken(user.id, detectedRole, refreshToken, req.ip);

    await logAction({
      actorId: user.id, actorRole: detectedRole, actorEmail: user.email,
      action: 'LOGIN', entityType: 'session',
      ipAddress: req.ip, userAgent: req.get('user-agent'),
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: detectedRole, forcePasswordChange: authUser.forcePasswordChange },
    });
  } catch (err) { next(err); }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// ─── Refresh ──────────────────────────────────────────────────────────────────

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) { res.status(401).json({ error: 'Invalid or expired refresh token' }); return; }

    // Revoke old, issue new (token rotation)
    await revokeRefreshToken(refreshToken);
    const user = await getUserByEmail('', payload.role); // get by id
    const authUser = { id: payload.id, email: user?.email ?? '', role: payload.role };
    const newAccess = generateAccessToken(authUser);
    const newRefresh = generateRefreshToken(authUser);
    await saveRefreshToken(payload.id, payload.role, newRefresh, req.ip);

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) { next(err); }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

const forgotSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'sub_admin', 'merchant']),
});

router.post('/forgot-password', validate(forgotSchema), async (req, res, next) => {
  try {
    const { email, role } = req.body as z.infer<typeof forgotSchema>;
    const user = await getUserByEmail(email, role);

    if (user && user.is_active) {
      const rawToken = await generatePasswordResetToken(user.id, role);
      const resetUrl = `${config.corsOrigin}/reset-password?token=${rawToken}&role=${role}`;
      await sendEmail(
        email,
        '[MIVC] Password Reset Request',
        `<h2>Password Reset</h2>
         <p>Click the link below to reset your password. This link expires in 1 hour.</p>
         <p><a href="${resetUrl}">${resetUrl}</a></p>
         <p>If you did not request this, ignore this email.</p>`
      );
    }

    // Always return same response to avoid user enumeration
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
});

// ─── Reset Password ───────────────────────────────────────────────────────────

const resetSchema = z.object({
  token: z.string().min(1),
  role: z.enum(['head_admin', 'admin', 'sub_admin', 'merchant']),
  newPassword: z.string().min(8).max(128),
});

router.post('/reset-password', validate(resetSchema), async (req, res, next) => {
  try {
    const { token, role, newPassword } = req.body as z.infer<typeof resetSchema>;
    const tokenData = await validatePasswordResetToken(token);
    if (!tokenData || tokenData.role !== role) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }
    const passwordHash = await hashPassword(newPassword);
    await updatePasswordInTable(tokenData.userId, role, passwordHash);
    await markTokenUsed(tokenData.id);
    await revokeAllUserTokens(tokenData.userId, role);

    await logAction({
      actorId: tokenData.userId, actorRole: role,
      action: 'PASSWORD_RESET', entityType: 'user', entityId: tokenData.userId,
    });

    res.json({ message: 'Password reset successful' });
  } catch (err) { next(err); }
});

// ─── Change Password ──────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128),
});

router.post('/change-password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const user = req.user!;
    if (user.role === 'head_admin') {
      res.status(403).json({ error: 'Head Administrator password cannot be changed via the application interface.' });
      return;
    }
    const dbUser = await getUserByEmail(user.email, user.role);
    if (!dbUser) { res.status(404).json({ error: 'User not found' }); return; }

    // If not forced change, verify current password
    if (!user.forcePasswordChange) {
      if (!currentPassword) { res.status(400).json({ error: 'Current password required' }); return; }
      const match = await comparePassword(currentPassword, dbUser.password_hash);
      if (!match) { res.status(401).json({ error: 'Current password incorrect' }); return; }
    }

    const passwordHash = await hashPassword(newPassword);
    await updatePasswordInTable(user.id, user.role, passwordHash);

    await logAction({
      actorId: user.id, actorRole: user.role, actorEmail: user.email,
      action: 'PASSWORD_CHANGED', entityType: 'user', entityId: user.id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

export default router;
