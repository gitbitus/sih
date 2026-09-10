import request from 'supertest';
import app from '../app';
import { hashPassword, generateAccessToken } from '../services/authService';

jest.mock('../config/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  pool: { end: jest.fn() },
  withTransaction: jest.fn(),
}));

jest.mock('../services/notificationService', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  createNotification: jest.fn().mockResolvedValue(undefined),
  scheduleExpiryAlerts: jest.fn(),
  getUnreadNotifications: jest.fn().mockResolvedValue([]),
  markAllRead: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/auditService', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

const mockQuery = require('../config/db').query as jest.Mock;
const mockQueryOne = require('../config/db').queryOne as jest.Mock;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for user not found', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong', role: 'merchant' });
      expect(res.status).toBe(401);
    });

    it('should return 401 for wrong password', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 'abc123', email: 'test@test.com',
        password_hash: await hashPassword('correct'), is_active: true,
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong', role: 'merchant' });
      expect(res.status).toBe(401);
    });

    it('should return tokens for valid credentials', async () => {
      const hash = await hashPassword('correct');
      mockQueryOne.mockResolvedValueOnce({
        id: 'abc123', email: 'test@test.com', password_hash: hash, is_active: true,
      });
      mockQuery
        .mockResolvedValueOnce([]) // saveRefreshToken INSERT
        .mockResolvedValueOnce([]) // logAction INSERT
        ;

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'correct', role: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('merchant');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 if no refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 and revoke token', async () => {
      const user = { id: 'abc123', role: 'merchant' as const, email: 'test@test.com' };
      const token = generateAccessToken(user);
      mockQuery.mockResolvedValue([]); // revokeRefreshToken

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken: 'some-token' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should always return same response (no user enumeration)', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@test.com', role: 'merchant' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/sent/i);
    });
  });
});
