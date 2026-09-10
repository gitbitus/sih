import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../services/authService';
import { config } from '../config/env';

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
}));

jest.mock('../services/auditService', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

const mockQueryOne = require('../config/db').queryOne as jest.Mock;
const mockQuery = require('../config/db').query as jest.Mock;

describe('Assignment Route', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin1', role: 'admin', email: 'admin@test.com' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when request not found', async () => {
    // The request check: queryOne returns null
    mockQueryOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/admin/requests/req1/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subAdminId: 'b94d27b9-96cd-40b6-a5c9-3c4d00f6e6eb', scheduledDate: '2025-10-15' });

    expect(res.status).toBe(404);
  });

  it('should block Sunday scheduling', async () => {
    // Request found
    mockQueryOne.mockResolvedValueOnce({
      id: 'req1', status: 'submitted', merchant_id: 'm1',
      merchant_email: 'm@test.com', business_name: 'Test Shop',
    });

    // Sunday date: 2025-10-12 is a Sunday
    const res = await request(app)
      .post('/api/admin/requests/req1/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subAdminId: 'b94d27b9-96cd-40b6-a5c9-3c4d00f6e6eb', scheduledDate: '2025-10-12' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Sunday/i);
  });

  it('should block when max visits exceeded', async () => {
    // Request found
    mockQueryOne.mockResolvedValueOnce({
      id: 'req1', status: 'submitted', merchant_id: 'm1',
      merchant_email: 'm@test.com', business_name: 'Test Shop',
    });
    // No unavailability record
    mockQueryOne.mockResolvedValueOnce(null);
    // Visit count at max
    mockQuery.mockResolvedValueOnce([{ count: String(config.scheduling.maxVisitsPerDay) }]);

    const res = await request(app)
      .post('/api/admin/requests/req1/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subAdminId: 'b94d27b9-96cd-40b6-a5c9-3c4d00f6e6eb', scheduledDate: '2025-10-15' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/visits/i);
  });
});
