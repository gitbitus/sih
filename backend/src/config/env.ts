import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'mivc_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'ap-south-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM_ADDRESS || 'noreply@mivc.gov.in',
  },
  sms: {
    apiKey: process.env.SMS_PROVIDER_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'MIVC',
  },
  qr: {
    verifyBaseUrl:
      process.env.PUBLIC_VERIFY_BASE_URL && !process.env.PUBLIC_VERIFY_BASE_URL.includes('localhost')
        ? process.env.PUBLIC_VERIFY_BASE_URL
        : 'https://sih-ten-omega.vercel.app/verify',
    certificateValidityDays: parseInt(process.env.CERTIFICATE_VALIDITY_DAYS || '365', 10),
  },
  scheduling: {
    maxVisitsPerDay: parseInt(process.env.MAX_VISITS_PER_DAY || '3', 10),
    calendarWindowDays: parseInt(process.env.CALENDAR_WINDOW_DAYS || '14', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
