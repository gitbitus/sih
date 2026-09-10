import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import pino from 'pino';

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

export class AppError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.issues });
    return;
  }

  const status = (err as AppError).status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
}
