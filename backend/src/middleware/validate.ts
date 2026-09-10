import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function formatZodError(err: ZodError): string {
  if (!err.issues || err.issues.length === 0) return 'Validation error';
  return err.issues
    .map((issue) => {
      const field = issue.path.join('.');
      return field ? `${field}: ${issue.message}` : issue.message;
    })
    .join(', ');
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const humanMessage = formatZodError(result.error);
      res.status(400).json({ error: humanMessage, details: result.error.issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const humanMessage = formatZodError(result.error);
      res.status(400).json({ error: humanMessage, details: result.error.issues });
      return;
    }
    (req as any).validatedQuery = result.data;
    next();
  };
}
