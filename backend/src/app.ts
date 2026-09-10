import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import publicRouter from './routes/public';
import complaintsRouter from './routes/complaints';
import calendarRouter from './routes/calendar';
import merchantRouter from './routes/merchant';
import adminRouter from './routes/admin';
import subAdminRouter from './routes/subAdmin';
import headAdminRouter from './routes/headAdmin';
import verifyRouter from './routes/verify';

const app = express();
export default app;

app.use(helmet());
app.use(cors({ origin: config.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp());

// Serve uploaded files statically
app.use('/uploads', express.static(config.storage.uploadDir));

const publicRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/public', publicRateLimit, publicRouter);
app.use('/api/complaints', publicRateLimit, complaintsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/merchants', merchantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/sub-admin', subAdminRouter);
app.use('/api/head-admin', headAdminRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);
