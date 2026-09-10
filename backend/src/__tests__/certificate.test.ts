import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../services/authService';

jest.mock('../config/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  pool: { end: jest.fn() },
  withTransaction: jest.fn(),
}));

jest.mock('../services/certificateService', () => ({
  issueCertificate: jest.fn(),
}));

jest.mock('../services/notificationService', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  createNotification: jest.fn().mockResolvedValue(undefined),
  scheduleExpiryAlerts: jest.fn(),
}));

jest.mock('../services/auditService', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

const mockIssueCertificate = require('../services/certificateService').issueCertificate as jest.Mock;

describe('Certificate Approval', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin1', role: 'admin', email: 'admin@test.com' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should issue certificate when issueCertificate resolves', async () => {
    mockIssueCertificate.mockResolvedValueOnce({ id: 'cert1', certificate_number: 'MIVC-2025-000001' });

    const res = await request(app)
      .post('/api/admin/requests/req1/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.certificate.id).toBe('cert1');
    expect(res.body.message).toMatch(/Certificate issued/i);
  });

  it('should return 500 if issueCertificate throws', async () => {
    mockIssueCertificate.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/admin/requests/req1/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
