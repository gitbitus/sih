# Architectural and Technical Decisions

This document outlines the key technical and architectural decisions made during the development of the Merchant Instrument Verification & Certification System.

1. **Backend Framework**: Express + TypeScript chosen over NestJS for simplicity and lower boilerplate for a project of this scope. Easier to onboard new contributors.
2. **Database**: PostgreSQL 15 with the `pg` native driver (not ORM) — raw SQL gives full control, `schema.sql` is the authoritative source of truth.
3. **Auth**: JWT access tokens (15min) + refresh tokens (7 days) stored as hashed values in DB. Allows server-side invalidation (logout, account disable). Access tokens not stored server-side.
4. **File Storage**: Local filesystem with an interface abstraction. `STORAGE_DRIVER=s3` will use AWS SDK v3 — the interface ensures zero application-layer changes.
5. **QR Code**: Server-side generation with `qrcode` library. QR encodes the public verify URL. PDF generated with `pdfkit`, embedding the QR as a PNG buffer.
6. **Calendar**: Custom built component (not a heavy library) for the rolling-window availability display. Uses `date-fns` for date math.
7. **Soft Delete**: All user accounts and applications use `deleted_at` timestamp instead of hard delete to preserve audit trail and foreign key integrity.
8. **Password Reset**: Time-limited tokens (1 hour), stored hashed in DB, single-use.
9. **Email**: `nodemailer` with SMTP. Templates are simple HTML strings. For production, swap to a transactional email provider (SendGrid, Mailgun) by changing SMTP config.
10. **SMS**: Optional — guarded by `SMS_PROVIDER_API_KEY` env var. Currently stubbed; integrate Twilio or MSG91 by implementing the stub in `notificationService.ts`.
11. **Rate Limiting**: `express-rate-limit` with in-memory store. For multi-instance deployments, swap to Redis store (ioredis + rate-limit-redis).
12. **Tests**: Jest + Supertest for integration tests covering auth flow, assignment, and certificate generation.
13. **Instrument Types**: Stored in `instrument_types` table (configurable lookup), not hardcoded enum, so admins can add types without code changes.
14. **MAX_VISITS_PER_DAY**: Defaults to 3 if not set. Enforced at the DB query level in the assignment endpoint.
15. **Timezones**: All timestamps stored as `TIMESTAMPTZ` (UTC). Frontend displays in local timezone using `date-fns`.
16. **Head Admin Login Route**: `/head-admin/login` — intentionally non-advertised. Not linked from public nav.
