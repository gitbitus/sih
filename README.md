# Merchant Instrument Verification & Certification System (MIVC)

## Project Overview
The Merchant Instrument Verification & Certification System is a comprehensive platform designed to manage the inspection, verification, and certification of various merchant instruments. It streamlines the application process for merchants, facilitates inspection scheduling and reporting for sub-admins, and provides administrative oversight for head admins. The system generates secure, verifiable certificates with embedded QR codes.

## Tech Stack
| Tier | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL 15, `pg` driver (raw SQL) |
| **Storage** | Local File System / S3-compatible |
| **Authentication** | JWT (Access & Refresh Tokens) |

## Prerequisites
- Node.js 20+
- PostgreSQL 15+

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mivc-monorepo
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   Create a PostgreSQL database named `mivc_db` (or as configured in your `.env`).

4. **Initialize Database Schema:**
   ```bash
   psql -d mivc_db -f backend/db/schema.sql
   ```

5. **Seed Head Admin Data:**
   ```bash
   cd backend
   npx ts-node db/seed.ts
   ```

6. **Install Backend Dependencies:**
   ```bash
   cd backend && npm install
   ```

7. **Start Backend Server:**
   ```bash
   npm run dev
   ```

8. **Install Frontend Dependencies:**
   ```bash
   cd frontend && npm install
   ```

9. **Start Frontend Development Server:**
   ```bash
   npm run dev
   ```

## Environment Variables
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend server port (default 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `HEAD_ADMIN_EMAIL` | Yes | Default head admin email for seeding |
| `STORAGE_DRIVER` | No | `local` or `s3` |
| `SMTP_HOST` | Yes | SMTP server for emails |

*(See `.env.example` for the complete list of environment variables.)*

## API Overview
- `/api/auth` - Authentication routes (login, refresh token, logout, password reset)
- `/api/users` - User management (merchants, sub-admins, head admins)
- `/api/applications` - Merchant application submission and tracking
- `/api/inspections` - Sub-admin inspection reports and scheduling
- `/api/certificates` - Certificate generation, retrieval, and public verification
- `/api/settings` - System-wide settings and lookup data (e.g., instrument types)

## Role Descriptions
| Role | Description | Key Capabilities |
|---|---|---|
| **Head Admin** | System administrator | Manage sub-admins, view global reports, system settings. |
| **Sub-Admin** | Inspector | View assigned applications, submit inspection reports. |
| **Merchant** | End user | Submit applications, track status, download certificates. |
| **Public** | Unauthenticated | Verify certificates via QR code scan. |

## Available Scripts
- `npm run dev` (in backend/frontend) - Starts development server.
- `npm run build` (in backend/frontend) - Builds for production.
- `npm run start` (in backend/frontend) - Starts production server.
- `npm run test` (in backend) - Runs backend tests.

## Project Structure
```text
mivc-monorepo/
├── backend/
│   ├── src/
│   ├── db/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .env.example
├── .gitignore
├── DECISIONS.md
└── README.md
```

## License
MIT License
