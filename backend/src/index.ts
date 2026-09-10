import 'dotenv/config';
import pino from 'pino';
import app from './app';
import { config } from './config/env';
import { pool } from './config/db';
import { scheduleExpiryAlerts } from './services/notificationService';

const logger = pino({ level: config.nodeEnv === 'production' ? 'info' : 'debug' });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
  scheduleExpiryAlerts();
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await pool.end();
    logger.info('Server closed');
    process.exit(0);
  });
});
